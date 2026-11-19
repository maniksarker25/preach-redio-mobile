import { FlashList } from '@shopify/flash-list';
import { ListMusic, Pencil, Play, Trash2 } from 'lucide-react-native';
import { Alert, View } from 'react-native';
import type { RootScreenProps } from '@/app/navigation/types';
import { EpisodeRow } from '@/components/cards/EpisodeRow';
import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { IconButton } from '@/components/common/IconButton';
import { EmptyState } from '@/components/common/States';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { usePodcastsByIds } from '@/hooks/queries';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { useMediaActions } from '@/hooks/useMediaActions';
import { useLibraryStore } from '@/store/libraryStore';
import { colors, GUTTER, shadow } from '@/theme';
import type { Podcast } from '@/types/models';
import { PlaylistCover } from '../components/PlaylistCover';

export function PlaylistScreen({ route, navigation }: RootScreenProps<'Playlist'>) {
  const playlist = useLibraryStore((s) => s.playlists.find((p) => p._id === route.params.id));
  const { deletePlaylist, removeFromPlaylist } = useLibraryStore.getState();
  const list = usePodcastsByIds(playlist?.podcasts ?? []);
  const { play, openDetail } = useMediaActions();
  const bottom = useBottomSpace(false);

  if (!playlist) {
    return (
      <Screen>
        <ScreenHeader />
        <EmptyState icon={ListMusic} title="Playlist not found" />
      </Screen>
    );
  }

  const confirmDelete = () =>
    Alert.alert(`Delete “${playlist.name}”?`, 'The messages stay in Preach Radio; only this playlist is removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePlaylist(playlist._id);
          navigation.goBack();
        },
      },
    ]);

  const onMore = (p: Podcast) =>
    Alert.alert(p.title, undefined, [
      { text: 'Remove from playlist', style: 'destructive', onPress: () => removeFromPlaylist(playlist._id, p._id) },
      { text: 'Cancel', style: 'cancel' },
    ]);

  const items = playlist.podcasts.length ? (list.data ?? []) : [];

  return (
    <Screen>
      <ScreenHeader
        right={
          <View className="flex-row">
            <IconButton icon={Pencil} size={20} onPress={() => navigation.navigate('PlaylistEditor', { id: playlist._id })} accessibilityLabel="Edit playlist" />
            <IconButton icon={Trash2} size={20} color={colors.danger} onPress={confirmDelete} accessibilityLabel="Delete playlist" />
          </View>
        }
      />
      <FlashList
        data={items}
        keyExtractor={(p) => p._id}
        contentContainerStyle={{ paddingBottom: bottom }}
        ListHeaderComponent={
          <View className="items-center pb-5" style={{ paddingHorizontal: GUTTER }}>
            <View style={shadow.floating}>
              <PlaylistCover playlist={playlist} size={200} />
            </View>
            <AppText variant="h1" className="mt-6 text-center">
              {playlist.name}
            </AppText>
            {playlist.description ? (
              <AppText variant="bodySm" tone="secondary" className="mt-1.5 text-center">
                {playlist.description}
              </AppText>
            ) : null}
            <AppText variant="caption" tone="muted" className="mt-2">
              {playlist.podcasts.length} messages
            </AppText>
            {items.length ? <Button label="Play all" icon={Play} onPress={() => items[0] && play(items[0], items)} className="mt-5 self-stretch" /> : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState icon={ListMusic} title="This playlist is empty" message="Add messages from any episode page." actionLabel="Find messages" onAction={() => navigation.navigate('Search')} />
        }
        renderItem={({ item }) => <EpisodeRow podcast={item} onPress={openDetail} onPlay={(p) => play(p, items)} onMore={onMore} />}
      />
    </Screen>
  );
}
