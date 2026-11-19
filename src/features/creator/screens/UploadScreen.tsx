import { CheckCircle2, FileAudio, FileVideo, ImagePlus, MapPin, Tag, UploadCloud, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import type { RootScreenProps } from '@/app/navigation/types';
import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { Chip } from '@/components/common/Chip';
import { SegmentedTabs } from '@/components/common/SegmentedTabs';
import { EmptyState } from '@/components/common/States';
import { TextField } from '@/components/common/TextField';
import { Touchable } from '@/components/common/Touchable';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { Artwork } from '@/components/media/Artwork';
import { ProgressLine } from '@/components/media/Seekbar';
import { useCategories, useCreatePodcast, useSubCategories } from '@/hooks/queries';
import { colors, GUTTER } from '@/theme';
import { ApiError } from '@/types/api';
import type { PodcastType } from '@/types/models';
import { formatClock } from '@/utils/format';
import { formatBytes, pickAudio, pickImage, pickVideo, type PickedFile } from '@/utils/pickers';

const CLIP_MAX = 120;
const TYPES = [
  { key: 'episode', label: 'Full message' },
  { key: 'clip', label: 'Preach Clip' },
] as const;

/** "12:34" → 754 */
const parseClock = (v: string) => {
  const parts = v.split(':').map((n) => Number(n));
  if (parts.some((n) => Number.isNaN(n))) return 0;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
};

/**
 * Upload flow (`/generate-presigned-url` → S3 → `/podcast/create`).
 * Validation mirrors the backend: clips ≤ 2 min, episodes need a location, cover optional.
 */
export function UploadScreen({ route, navigation }: RootScreenProps<'Upload'>) {
  const { mediaType, recording } = route.params;
  const categories = useCategories();
  const [category, setCategory] = useState<string>();
  const subs = useSubCategories(category);
  const create = useCreatePodcast();

  const [type, setType] = useState<PodcastType>('episode');
  const [file, setFile] = useState<PickedFile | null>(recording ? { uri: recording.uri, name: 'Recording.m4a', duration: recording.durationSeconds } : null);
  const [cover, setCover] = useState<string>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [address, setAddress] = useState('');
  const [length, setLength] = useState(recording ? formatClock(recording.durationSeconds) : '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (file?.duration) setLength(formatClock(Math.round(file.duration)));
  }, [file]);

  const seconds = useMemo(() => parseClock(length), [length]);
  const isClip = mediaType === 'video' && type === 'clip';

  const choose = async () => {
    const picked = mediaType === 'audio' ? await pickAudio() : await pickVideo();
    if (picked) setFile(picked);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!file) e.file = `Choose ${mediaType === 'audio' ? 'an audio' : 'a video'} file`;
    if (!title.trim()) e.title = 'Add a title';
    else if (title.length > 300) e.title = 'Keep the title under 300 characters';
    if (!description.trim()) e.description = 'Add a short description';
    if (!category) e.category = 'Choose a category';
    if (!seconds) e.length = 'Enter the length as mm:ss';
    else if (isClip && seconds > CLIP_MAX) e.length = 'Clips can be at most 2 minutes long';
    if (!isClip && !address.trim()) e.address = 'Full messages need a location';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    // The app only asks for a category. The backend still requires a sub-category,
    // so the category's first one is sent until the API makes it optional.
    const subCategory = subs.data?.[0]?._id;
    if (!validate() || !file || !category || !subCategory) return;
    // Simulated S3 upload progress; the real flow PUTs to the presigned URL.
    setProgress(0);
    for (let p = 0.1; p <= 1; p += 0.1) {
      await new Promise((r) => setTimeout(r, 140));
      setProgress(Math.min(1, p));
    }
    try {
      await create.mutateAsync({
        type: isClip ? 'clip' : 'episode',
        mediaType,
        title: title.trim(),
        description: description.trim(),
        category,
        subCategory,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 50),
        durationSeconds: seconds,
        address: address.trim() || undefined,
        fileUri: file.uri,
        coverUri: cover,
      });
      setDone(true);
    } catch (err) {
      setErrors({ submit: err instanceof ApiError ? err.message : 'Upload failed. Please try again.' });
    } finally {
      setProgress(null);
    }
  };

  if (done) {
    return (
      <Screen>
        <ScreenHeader back="down" />
        <EmptyState
          icon={CheckCircle2}
          title="Published"
          message="Your message is live. We’re optimizing it for streaming; it plays right away in the meantime."
          actionLabel="View my podcasts"
          onAction={() => navigation.replace('MyPodcasts')}
        />
      </Screen>
    );
  }

  const FileIcon = mediaType === 'audio' ? FileAudio : FileVideo;

  return (
    <Screen>
      <ScreenHeader back="down" title={mediaType === 'audio' ? 'Upload audio' : 'Upload video'} />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: GUTTER, gap: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          {mediaType === 'video' ? <SegmentedTabs tabs={TYPES} value={type} onChange={setType} /> : null}

          <Touchable
            onPress={choose}
            scaleTo={0.99}
            className={file ? 'flex-row items-center rounded-lg border border-line-strong bg-ink-800 p-4' : 'items-center rounded-xl border-2 border-dashed border-line-strong bg-ink-800 px-6 py-9'}
            accessibilityLabel={file ? `Selected ${file.name}. Choose another file` : 'Choose a file'}
          >
            {file ? (
              <>
                <View className="h-12 w-12 items-center justify-center rounded-md bg-brand-500/15">
                  <FileIcon size={22} color={colors.brand[400]} />
                </View>
                <View className="ml-3.5 flex-1">
                  <AppText variant="title" numberOfLines={1}>
                    {file.name}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    {[formatBytes(file.size), file.duration ? formatClock(file.duration) : null].filter(Boolean).join(' · ') || 'Ready to upload'}
                  </AppText>
                </View>
                <AppText variant="label" tone="brand">
                  Change
                </AppText>
              </>
            ) : (
              <>
                <UploadCloud size={34} color={colors.brand[400]} />
                <AppText variant="title" className="mt-3">
                  Choose {mediaType === 'audio' ? 'an audio file' : 'a video'}
                </AppText>
                <AppText variant="caption" tone="muted" className="mt-1 text-center">
                  {isClip ? 'Vertical video, up to 2 minutes' : mediaType === 'audio' ? 'MP3, M4A or WAV' : 'MP4 or MOV'}
                </AppText>
              </>
            )}
          </Touchable>
          {errors.file ? (
            <AppText variant="caption" tone="live" className="-mt-3">
              {errors.file}
            </AppText>
          ) : null}

          <View className="flex-row items-center gap-4">
            <Touchable onPress={async () => { const img = await pickImage(isClip ? [9, 16] : [1, 1]); if (img) setCover(img.uri); }} accessibilityLabel="Choose a cover image">
              {cover ? (
                <View>
                  <Artwork uri={cover} width={88} height={88} radius={14} />
                  <Touchable onPress={() => setCover(undefined)} className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-ink-600" accessibilityLabel="Remove cover">
                    <X size={13} color={colors.white} />
                  </Touchable>
                </View>
              ) : (
                <View className="h-[88px] w-[88px] items-center justify-center rounded-[14px] border border-dashed border-line-strong bg-ink-800">
                  <ImagePlus size={24} color={colors.text.muted} />
                </View>
              )}
            </Touchable>
            <View className="flex-1">
              <AppText variant="title">Cover image</AppText>
              <AppText variant="caption" tone="muted" className="mt-0.5">
                Optional. {mediaType === 'video' ? 'We’ll use the first frame if you skip it.' : 'A branded cover is used if you skip it.'}
              </AppText>
            </View>
          </View>

          <TextField label="Title" value={title} onChangeText={setTitle} maxLength={300} error={errors.title} placeholder="e.g. Anchored: Faith That Holds" />
          <TextField label="Description" value={description} onChangeText={setDescription} multiline maxLength={10000} error={errors.description} placeholder="What is this message about?" />

          <View>
            <AppText variant="label" tone="secondary" className="mb-2">
              Category
            </AppText>
            <View className="flex-row flex-wrap gap-2">
              {categories.data?.map((c) => (
                <Chip key={c._id} label={c.name} selected={category === c._id} onPress={() => setCategory(c._id)} />
              ))}
            </View>
            {errors.category ? (
              <AppText variant="caption" tone="live" className="mt-1.5">
                {errors.category}
              </AppText>
            ) : null}
          </View>

          <TextField label="Length (mm:ss)" value={length} onChangeText={setLength} keyboardType="numbers-and-punctuation" placeholder="45:20" error={errors.length} hint={file?.duration ? 'Detected from your file' : undefined} />
          <TextField label="Tags" icon={Tag} value={tags} onChangeText={setTags} placeholder="faith, hope, hebrews" hint="Separate with commas" autoCapitalize="none" />
          {!isClip ? <TextField label="Location" icon={MapPin} value={address} onChangeText={setAddress} placeholder="City, Country" error={errors.address} /> : null}

          {progress !== null ? (
            <View className="gap-2">
              <AppText variant="label" tone="secondary">
                Uploading… {Math.round(progress * 100)}%
              </AppText>
              <ProgressLine ratio={progress} height={6} />
            </View>
          ) : null}
          {errors.submit ? (
            <AppText variant="bodySm" tone="live">
              {errors.submit}
            </AppText>
          ) : null}
          <Button label="Publish" icon={UploadCloud} onPress={submit} loading={progress !== null || create.isPending} size="lg" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
