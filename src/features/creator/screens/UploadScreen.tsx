import { AlertTriangle, CheckCircle2, FileAudio, FileVideo, ImagePlus, LocateFixed, MapPin, Mic, Tag, UploadCloud, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import type { RootScreenProps } from '@/app/navigation/types';
import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { Chip } from '@/components/common/Chip';
import { SegmentedTabs } from '@/components/common/SegmentedTabs';
import { EmptyState } from '@/components/common/States';
import { TextField } from '@/components/common/TextField';
import { Touchable } from '@/components/common/Touchable';
import { Screen } from '@/components/layouts/Screen';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Artwork } from '@/components/media/Artwork';
import { ProgressLine } from '@/components/media/Seekbar';
import { currentPlace, geocodePlace, LocationPermissionError } from '@/services/upload/location';
import { legacyDuration, mimeFor, parseClock, probeAudioDuration } from '@/services/upload/media';
import { UploadCancelledError, useS3Upload } from '@/services/upload/useS3Upload';
import { useCreatePodcastMutation } from '@/store/api/contentApi';
import { useGetUploadCategoriesQuery } from '@/store/api/creatorApi';
import { useAppSelector } from '@/store/hooks';
import { selectCreatorApproved } from '@/store/slices/authSlice';
import { colors, GUTTER } from '@/theme';
import type { GeoPoint, PodcastType } from '@/types/models';
import type { CreatePodcastBody } from '@/types/upload';
import { getErrorMessage } from '@/utils/apiError';
import { formatClock } from '@/utils/format';
import { formatBytes, pickAudio, pickImage, pickVideo, type PickedFile } from '@/utils/pickers';

const CLIP_MAX_SECONDS = 120;
/** Share of the progress bar used by the cover; the media file takes the rest. */
const COVER_WEIGHT = 0.08;
const TYPES = [
  { key: 'episode', label: 'Full message' },
  { key: 'clip', label: 'Preach Clip' },
] as const;

type Errors = Partial<Record<'file' | 'cover' | 'title' | 'description' | 'category' | 'length' | 'address' | 'submit', string>>;
interface Stage {
  label: string;
  ratio: number;
}

/**
 * Creator upload: audio, video (full message or Preach Clip) and recordings.
 *
 * 1. cover → S3, 2. media → S3 (presigned PUT, native streaming with progress),
 * 3. `POST /podcast/create` with the URLs. Audio and recordings need a cover; video
 * covers are optional (the server grabs a frame). Full messages need a location.
 * Uploaded files are remembered, so "Try again" after a failure doesn't re-upload them.
 */
export function UploadScreen({ route, navigation }: RootScreenProps<'Upload'>) {
  const { mediaType, recording } = route.params;
  const isAudio = mediaType === 'audio';
  const approved = useAppSelector(selectCreatorApproved);
  const categories = useGetUploadCategoriesQuery();
  const [createPodcast] = useCreatePodcastMutation();
  const { upload, cancel } = useS3Upload();

  const [type, setType] = useState<PodcastType>('episode');
  const [file, setFile] = useState<PickedFile | null>(recording ? { uri: recording.uri, name: 'Recording.m4a', mimeType: 'audio/mp4', duration: recording.durationSeconds } : null);
  const [cover, setCover] = useState<PickedFile | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState<string>();
  const [length, setLength] = useState(recording ? formatClock(recording.durationSeconds) : '');
  const [detected, setDetected] = useState(Boolean(recording));
  const [probing, setProbing] = useState(false);
  const [address, setAddress] = useState('');
  const [geo, setGeo] = useState<{ address: string; location: GeoPoint } | null>(null);
  const [locating, setLocating] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [stage, setStage] = useState<Stage | null>(null);
  const [done, setDone] = useState(false);
  /** local uri → uploaded URL, so a retry skips files that already made it. */
  const uploaded = useRef(new Map<string, string>());

  const isClip = mediaType === 'video' && type === 'clip';
  const busy = stage !== null;
  const seconds = parseClock(length);

  /* ------------------------------------------------------------ media */
  const applyFile = async (picked: PickedFile) => {
    setFile(picked);
    setErrors((e) => ({ ...e, file: undefined, length: undefined }));
    let duration = picked.duration;
    if (!duration && isAudio) {
      setProbing(true);
      duration = await probeAudioDuration(picked.uri);
      setProbing(false);
    }
    setDetected(Boolean(duration));
    setLength(duration ? formatClock(Math.round(duration)) : '');
  };

  const chooseFile = async () => {
    if (busy) return;
    if (recording) {
      navigation.replace('RecordAudio');
      return;
    }
    const picked = isAudio ? await pickAudio() : await pickVideo();
    if (picked) await applyFile(picked);
  };

  const chooseCover = async () => {
    if (busy) return;
    const img = await pickImage(isClip ? [9, 16] : isAudio ? [1, 1] : [16, 9]);
    if (img) {
      setCover(img);
      setErrors((e) => ({ ...e, cover: undefined }));
    }
  };

  /* --------------------------------------------------------- location */
  const fillCurrentLocation = async () => {
    setLocating(true);
    try {
      const place = await currentPlace();
      setGeo(place);
      setAddress(place.address);
      setErrors((e) => ({ ...e, address: undefined }));
    } catch (e) {
      setErrors((x) => ({ ...x, address: e instanceof LocationPermissionError ? e.message : 'Couldn’t get your location. Type the city and country instead.' }));
    } finally {
      setLocating(false);
    }
  };

  /** Coordinates for the address field (the one from "Use current location", or geocoded). */
  const resolveLocation = async (): Promise<GeoPoint | undefined> => {
    const text = address.trim();
    if (geo && geo.address === text) return geo.location;
    return geocodePlace(text);
  };

  /* ------------------------------------------------------- validation */
  const validate = () => {
    const e: Errors = {};
    if (!file) e.file = isAudio ? 'Choose an audio file' : 'Choose a video';
    if (isAudio && !cover) e.cover = 'Audio messages need a cover image';
    if (!title.trim()) e.title = 'Add a title';
    if (!description.trim()) e.description = 'Add a short description';
    if (!category) e.category = 'Choose a category';
    if (!seconds) e.length = 'Enter the length as mm:ss';
    else if (isClip && seconds > CLIP_MAX_SECONDS) e.length = 'Preach Clips can be at most 2 minutes long';
    if (!isClip && !address.trim()) e.address = 'Full messages need a location';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ----------------------------------------------------------- submit */
  const uploadOnce = async (f: PickedFile, kind: 'cover' | 'media', from: number, to: number) => {
    const cached = uploaded.current.get(f.uri);
    if (cached) return cached;
    const mimeType = kind === 'cover' ? mimeFor(f.uri, f.mimeType, 'image/jpeg') : mimeFor(f.uri, f.mimeType, isAudio ? 'audio/mp4' : 'video/mp4');
    const label = kind === 'cover' ? 'Uploading cover' : isAudio ? 'Uploading audio' : 'Uploading video';
    setStage({ label, ratio: from });
    const url = await upload({
      uri: f.uri,
      mimeType,
      category: kind === 'cover' ? 'podcast_cover' : isAudio ? 'podcast_audio' : 'podcast_video',
      onProgress: (r) => setStage({ label, ratio: from + (to - from) * r }),
    });
    uploaded.current.set(f.uri, url);
    return url;
  };

  const submit = async () => {
    if (busy || !validate() || !file || !category) return;
    const cat = categories.data?.find((c) => c._id === category);
    // The app shows categories only; the API still needs a sub-category, so the first one is used.
    const subCategory = cat?.subcategories[0]?._id;
    if (!subCategory) {
      setErrors({ category: 'This category can’t take uploads yet. Choose another one.' });
      return;
    }

    try {
      setStage({ label: 'Preparing', ratio: 0 });
      let location: GeoPoint | undefined;
      if (!isClip) {
        location = await resolveLocation();
        if (!location) {
          setErrors({ address: 'We couldn’t find this place. Check the spelling or use your current location.' });
          setStage(null);
          return;
        }
      }

      const coverUrl = cover ? await uploadOnce(cover, 'cover', 0, COVER_WEIGHT) : undefined;
      const mediaUrl = await uploadOnce(file, 'media', cover ? COVER_WEIGHT : 0, 0.97);

      setStage({ label: 'Publishing', ratio: 0.98 });
      const body: CreatePodcastBody = {
        type: isClip ? 'clip' : 'episode',
        mediaType,
        title: title.trim(),
        description: description.trim(),
        category,
        subCategory,
        podcast_url: mediaUrl,
        coverImage: coverUrl,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 50),
        duration: legacyDuration(seconds),
        durationSeconds: seconds,
        ...(location ? { location, address: address.trim() } : {}),
        ...(file.width && file.height ? { videoWidth: Math.round(file.width), videoHeight: Math.round(file.height) } : {}),
      };
      await createPodcast(body).unwrap();
      setDone(true);
    } catch (err) {
      if (!(err instanceof UploadCancelledError)) setErrors({ submit: getErrorMessage(err, 'Upload failed. Please try again.') });
    } finally {
      setStage(null);
    }
  };

  // Leaving mid-upload asks first (and cancels the transfer).
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (!busy || done) return;
        e.preventDefault();
        Alert.alert('Cancel upload?', 'Your message hasn’t been published yet.', [
          { text: 'Keep uploading', style: 'cancel' },
          {
            text: 'Cancel upload',
            style: 'destructive',
            onPress: () => {
              cancel();
              navigation.dispatch(e.data.action);
            },
          },
        ]);
      }),
    [navigation, busy, done, cancel],
  );

  /* ------------------------------------------------------------ views */
  if (done) {
    return (
      <Screen>
        <ScreenHeader back="down" />
        <EmptyState
          icon={CheckCircle2}
          title="Published"
          message={isAudio ? 'Your message is live for your listeners.' : 'Your message is live. We’re optimizing it for smooth streaming; it plays right away in the meantime.'}
          actionLabel="View my podcasts"
          onAction={() => navigation.replace('MyPodcasts')}
        />
      </Screen>
    );
  }

  const FileIcon = isAudio ? FileAudio : FileVideo;
  const screenTitle = recording ? 'Publish recording' : isAudio ? 'Upload audio' : 'Upload video';

  return (
    <Screen>
      <ScreenHeader back="down" title={screenTitle} />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: GUTTER, gap: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          {approved === false ? (
            <View className="flex-row items-start gap-3 rounded-xl border border-gold/30 bg-gold/10 p-4">
              <AlertTriangle size={18} color={colors.gold} />
              <AppText variant="bodySm" tone="secondary" className="flex-1">
                Your creator account is waiting for approval. You can publish once an admin approves it.
              </AppText>
            </View>
          ) : null}

          {mediaType === 'video' ? <SegmentedTabs tabs={TYPES} value={type} onChange={(t) => !busy && setType(t)} /> : null}

          {/* Media file */}
          <View>
            <Touchable
              onPress={() => void chooseFile()}
              disabled={busy}
              scaleTo={0.99}
              className={file ? 'flex-row items-center rounded-xl border border-line-strong bg-ink-800 p-4' : 'items-center rounded-xl border-2 border-dashed border-line-strong bg-ink-800 px-6 py-9'}
              accessibilityLabel={file ? `Selected ${file.name}. Choose another file` : 'Choose a file'}
            >
              {file ? (
                <>
                  <View className="h-12 w-12 items-center justify-center rounded-lg bg-brand-500/15">
                    {recording ? <Mic size={22} color={colors.brand[400]} /> : <FileIcon size={22} color={colors.brand[400]} />}
                  </View>
                  <View className="ml-3.5 flex-1">
                    <AppText variant="title" numberOfLines={1}>
                      {file.name}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                      {probing ? 'Reading length…' : [formatBytes(file.size), seconds ? formatClock(seconds) : null].filter(Boolean).join(' · ') || 'Ready to upload'}
                    </AppText>
                  </View>
                  <AppText variant="label" tone="brand">
                    {recording ? 'Re-record' : 'Change'}
                  </AppText>
                </>
              ) : (
                <>
                  <UploadCloud size={34} color={colors.brand[400]} />
                  <AppText variant="title" className="mt-3">
                    Choose {isAudio ? 'an audio file' : 'a video'}
                  </AppText>
                  <AppText variant="caption" tone="muted" className="mt-1 text-center">
                    {isClip ? 'Vertical video, up to 2 minutes' : isAudio ? 'MP3, M4A, AAC or WAV' : 'MP4 or MOV'}
                  </AppText>
                </>
              )}
            </Touchable>
            {errors.file ? (
              <AppText variant="caption" tone="live" className="mt-1.5">
                {errors.file}
              </AppText>
            ) : null}
          </View>

          {/* Cover */}
          <View>
            <View className="flex-row items-center gap-4">
              <Touchable onPress={() => void chooseCover()} disabled={busy} accessibilityLabel="Choose a cover image">
                {cover ? (
                  <View>
                    <Artwork uri={cover.uri} width={isClip ? 62 : 88} height={88} radius={14} />
                    {!busy ? (
                      <Touchable onPress={() => setCover(null)} className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-ink-600" accessibilityLabel="Remove cover">
                        <X size={13} color={colors.white} />
                      </Touchable>
                    ) : null}
                  </View>
                ) : (
                  <View
                    className="items-center justify-center rounded-[14px] border border-dashed bg-ink-800"
                    style={{ width: isClip ? 62 : 88, height: 88, borderColor: errors.cover ? colors.live : colors.ink[500] }}
                  >
                    <ImagePlus size={24} color={errors.cover ? colors.live : colors.text.muted} />
                  </View>
                )}
              </Touchable>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <AppText variant="title">Cover image</AppText>
                  <View className={isAudio ? 'rounded-full bg-live/15 px-2 py-0.5' : 'rounded-full bg-ink-700 px-2 py-0.5'}>
                    <AppText className={isAudio ? 'text-[10px] font-bold text-live' : 'text-[10px] font-bold text-fg-muted'}>{isAudio ? 'Required' : 'Optional'}</AppText>
                  </View>
                </View>
                <AppText variant="caption" tone="muted" className="mt-1">
                  {isAudio ? 'Square image, shown on the player and in every list.' : 'If you skip it, we’ll use a frame from your video.'}
                </AppText>
              </View>
            </View>
            {errors.cover ? (
              <AppText variant="caption" tone="live" className="mt-1.5">
                {errors.cover}
              </AppText>
            ) : null}
          </View>

          <TextField label="Title" value={title} onChangeText={setTitle} maxLength={300} error={errors.title} placeholder="e.g. Anchored: Faith That Holds" editable={!busy} />
          <TextField
            label="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={10000}
            error={errors.description}
            placeholder="What is this message about?"
            editable={!busy}
          />

          <View>
            <AppText variant="label" tone="secondary" className="mb-2">
              Category
            </AppText>
            {categories.isLoading ? (
              <ActivityIndicator color={colors.text.muted} style={{ alignSelf: 'flex-start' }} />
            ) : categories.isError ? (
              <Touchable onPress={() => void categories.refetch()} className="self-start" accessibilityLabel="Retry loading categories">
                <AppText variant="caption" tone="live">
                  Couldn’t load categories · Tap to retry
                </AppText>
              </Touchable>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {categories.data?.map((c) => (
                  <Chip
                    key={c._id}
                    label={c.name}
                    selected={category === c._id}
                    onPress={() => {
                      if (busy) return;
                      setCategory(c._id);
                      setErrors((e) => ({ ...e, category: undefined }));
                    }}
                  />
                ))}
              </View>
            )}
            {errors.category ? (
              <AppText variant="caption" tone="live" className="mt-1.5">
                {errors.category}
              </AppText>
            ) : null}
          </View>

          {!detected || errors.length ? (
            <TextField
              label="Length (mm:ss)"
              value={length}
              onChangeText={setLength}
              keyboardType="numbers-and-punctuation"
              placeholder="45:20"
              error={errors.length}
              hint={file && !detected && !probing ? 'We couldn’t read the length from this file' : undefined}
              editable={!busy}
            />
          ) : null}

          <TextField label="Tags" icon={Tag} value={tags} onChangeText={setTags} placeholder="faith, hope, hebrews" hint="Separate with commas" autoCapitalize="none" editable={!busy} />

          {!isClip ? (
            <View>
              <TextField label="Location" icon={MapPin} value={address} onChangeText={setAddress} placeholder="City, Country" error={errors.address} editable={!busy} />
              <Touchable onPress={() => void fillCurrentLocation()} disabled={busy || locating} className="mt-2.5 flex-row items-center gap-2 self-start py-1" accessibilityLabel="Use my current location">
                {locating ? <ActivityIndicator size="small" color={colors.brand[400]} /> : <LocateFixed size={16} color={colors.brand[400]} />}
                <AppText variant="label" tone="brand">
                  Use my current location
                </AppText>
              </Touchable>
            </View>
          ) : null}

          {stage ? (
            <View className="gap-2.5 rounded-xl border border-line bg-ink-800 p-4">
              <View className="flex-row items-center justify-between">
                <AppText variant="label">
                  {stage.label}… {Math.round(stage.ratio * 100)}%
                </AppText>
                {stage.label.startsWith('Uploading') ? (
                  <Touchable onPress={cancel} accessibilityLabel="Cancel upload">
                    <AppText variant="label" tone="muted">
                      Cancel
                    </AppText>
                  </Touchable>
                ) : null}
              </View>
              <ProgressLine ratio={stage.ratio} height={6} />
              <AppText variant="caption" tone="faint">
                Keep the app open until it finishes.
              </AppText>
            </View>
          ) : null}

          {errors.submit ? (
            <View className="flex-row items-start gap-2.5 rounded-xl border border-live/30 bg-live/10 p-3.5">
              <AlertTriangle size={16} color={colors.live} style={{ marginTop: 2 }} />
              <AppText variant="bodySm" className="flex-1 text-fg-primary">
                {errors.submit}
              </AppText>
            </View>
          ) : null}

          <Button
            label={errors.submit ? 'Try again' : 'Publish'}
            icon={UploadCloud}
            onPress={() => void submit()}
            loading={busy}
            disabled={approved === false || probing}
            size="lg"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
