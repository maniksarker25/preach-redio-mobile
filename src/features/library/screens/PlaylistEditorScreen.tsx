import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import type { RootScreenProps } from '@/app/navigation/types';
import { Button } from '@/components/common/Button';
import { TextField } from '@/components/common/TextField';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { useLibraryStore } from '@/store/libraryStore';
import { GUTTER } from '@/theme';

/** Create or rename a playlist (`/playlist/create`, `/playlist/update/:id`). */
export function PlaylistEditorScreen({ route, navigation }: RootScreenProps<'PlaylistEditor'>) {
  const { id, addPodcastId } = route.params;
  const existing = useLibraryStore((s) => (id ? s.playlists.find((p) => p._id === id) : undefined));
  const { createPlaylist, updatePlaylist } = useLibraryStore.getState();
  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [error, setError] = useState<string>();

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Give your playlist a name');
      return;
    }
    if (existing) {
      updatePlaylist(existing._id, { name: trimmed, description: description.trim() });
      navigation.goBack();
    } else {
      const created = createPlaylist({ name: trimmed, description: description.trim(), podcastIds: addPodcastId ? [addPodcastId] : [] });
      navigation.replace('Playlist', { id: created._id });
    }
  };

  return (
    <Screen>
      <ScreenHeader back="down" title={existing ? 'Edit playlist' : 'New playlist'} />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: GUTTER, gap: 18 }} keyboardShouldPersistTaps="handled">
          <TextField
            label="Name"
            value={name}
            onChangeText={(t) => {
              setName(t);
              setError(undefined);
            }}
            placeholder="e.g. Sunday Drive"
            autoFocus={!existing}
            maxLength={60}
            error={error}
            returnKeyType="next"
          />
          <TextField label="Description" value={description} onChangeText={setDescription} placeholder="What is this playlist for? (optional)" multiline maxLength={200} />
          <Button label={existing ? 'Save changes' : 'Create playlist'} onPress={save} size="lg" className="mt-2" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
