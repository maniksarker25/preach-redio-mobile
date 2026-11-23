import { ImagePlus } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Switch, View } from 'react-native';
import type { RootScreenProps } from '@/app/navigation/types';
import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/States';
import { TextField } from '@/components/common/TextField';
import { Touchable } from '@/components/common/Touchable';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { mimeFor } from '@/services/upload/media';
import { UploadCancelledError, useS3Upload } from '@/services/upload/useS3Upload';
import { useCreatePlaylistMutation, useGetPlaylistQuery, useUpdatePlaylistMutation, type PlaylistInput } from '@/store/api/playlistsApi';
import { colors, GUTTER } from '@/theme';
import type { PlaylistDetail } from '@/types/models';
import { pickImage } from '@/utils/pickers';
import { PlaylistCover } from '../components/PlaylistCover';

const NAME_MAX = 60;
const DESCRIPTION_MAX = 200;

/** Create or edit a playlist (`/playlist/create`, `/playlist/update/:id`): name, description, privacy and an optional cover. */
export function PlaylistEditorScreen({ route, navigation }: RootScreenProps<'PlaylistEditor'>) {
  const { id } = route.params;
  // Editing opens from the playlist screen, so this is normally already cached; the form starts from it.
  const existing = useGetPlaylistQuery(id ?? '', { skip: !id });
  if (id && !existing.data) {
    return (
      <Screen>
        <ScreenHeader back="down" title="Edit playlist" />
        {existing.isError ? (
          <ErrorState onRetry={() => void existing.refetch()} />
        ) : (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.white} />
          </View>
        )}
      </Screen>
    );
  }
  return <PlaylistForm key={id ?? 'new'} route={route} navigation={navigation} existing={existing.data} />;
}

function PlaylistForm({ route, navigation, existing }: RootScreenProps<'PlaylistEditor'> & { existing?: PlaylistDetail }) {
  const { id, addPodcastId } = route.params;
  const [createPlaylist] = useCreatePlaylistMutation();
  const [updatePlaylist] = useUpdatePlaylistMutation();
  const { upload } = useS3Upload();

  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [isPublic, setIsPublic] = useState(existing?.isPublic ?? false);
  /** A newly picked local image (uploaded on save). */
  const [cover, setCover] = useState<{ uri: string; mimeType: string } | null>(null);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState<'idle' | 'uploading' | 'saving'>('idle');
  const busy = saving !== 'idle';

  const chooseCover = async () => {
    const img = await pickImage([1, 1]);
    if (img) setCover({ uri: img.uri, mimeType: mimeFor(img.uri, img.mimeType, 'image/jpeg') });
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Give your playlist a name');
      return;
    }
    setError(undefined);
    try {
      const input: PlaylistInput = { name: trimmed, description: description.trim(), isPublic };
      if (cover) {
        setSaving('uploading');
        input.cover_image = await upload({ uri: cover.uri, mimeType: cover.mimeType, category: 'podcast_cover' });
      }
      setSaving('saving');
      if (id) {
        await updatePlaylist({ id, patch: input }).unwrap();
        navigation.goBack();
      } else {
        const created = await createPlaylist({ ...input, podcastIds: addPodcastId ? [addPodcastId] : [] }).unwrap();
        navigation.replace('Playlist', { id: created._id });
      }
    } catch (e) {
      if (e instanceof UploadCancelledError) return;
      setError((e as { message?: string }).message ?? 'Couldn’t save the playlist. Please try again.');
      setSaving('idle');
    }
  };

  return (
    <Screen>
      <ScreenHeader back="down" title={id ? 'Edit playlist' : 'New playlist'} />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: GUTTER, gap: 18 }} keyboardShouldPersistTaps="handled">
          <Touchable onPress={() => void chooseCover()} disabled={busy} className="items-center self-center" accessibilityLabel="Choose a cover (optional)">
            <PlaylistCover coverImage={cover?.uri ?? existing?.cover_image} covers={existing?.podcasts.slice(0, 4).map((p) => p.coverImage)} size={140} />
            <View className="mt-2.5 flex-row items-center gap-1.5">
              <ImagePlus size={15} color={colors.brand[400]} />
              <AppText variant="label" tone="brand">
                {cover || existing?.cover_image ? 'Change cover' : 'Add a cover (optional)'}
              </AppText>
            </View>
          </Touchable>

          <TextField
            label="Name"
            value={name}
            onChangeText={(t) => {
              setName(t);
              setError(undefined);
            }}
            placeholder="e.g. Sunday Drive"
            autoFocus={!id}
            maxLength={NAME_MAX}
            returnKeyType="next"
            editable={!busy}
          />
          <TextField label="Description" value={description} onChangeText={setDescription} placeholder="What is this playlist for? (optional)" multiline maxLength={DESCRIPTION_MAX} editable={!busy} />

          <View className="flex-row items-center rounded-sm bg-ink-800 px-3.5 py-3">
            <View className="flex-1 pr-3">
              <AppText variant="title">Public playlist</AppText>
              <AppText variant="caption" tone="muted" className="mt-0.5">
                {isPublic ? 'Anyone with the link can open it.' : 'Only you can see it.'}
              </AppText>
            </View>
            <Switch value={isPublic} onValueChange={setIsPublic} disabled={busy} trackColor={{ true: colors.brand[400], false: colors.ink[600] }} thumbColor={colors.white} />
          </View>

          {error ? (
            <AppText variant="caption" tone="live" accessibilityRole="alert">
              {error}
            </AppText>
          ) : null}

          <Button label={id ? 'Save changes' : 'Create playlist'} onPress={() => void save()} size="lg" className="mt-2" loading={busy} disabled={busy} />
          {saving === 'uploading' ? (
            <View className="flex-row items-center justify-center gap-2">
              <ActivityIndicator size="small" color={colors.white} />
              <AppText variant="caption" tone="muted">
                Uploading cover…
              </AppText>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
