import { FlashList } from '@shopify/flash-list';
import { Globe, ListMusic, Lock, MoreVertical, Pencil, Play, Trash2 } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Alert, RefreshControl, useWindowDimensions, View } from 'react-native';
import type { RootScreenProps } from '@/app/navigation/types';
import { MediaRow, MediaRowSkeleton } from '@/components/cards/MediaRow';
import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { IconButton } from '@/components/common/IconButton';
import { EmptyState, ErrorState } from '@/components/common/States';
import { Touchable } from '@/components/common/Touchable';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { useMediaActions } from '@/hooks/useMediaActions';
import { useDeletePlaylistMutation, useGetPlaylistQuery, useRemoveFromPlaylistMutation } from '@/store/api/playlistsApi';
import { colors, GUTTER, shadow } from '@/theme';
import type { Podcast } from '@/types/models';
import { formatCount } from '@/utils/format';
import { isClip } from '@/utils/podcast';
import { PlaylistCover } from '../components/PlaylistCover';
import { countLabel } from '../components/PlaylistRow';

const Gap = () => <View className="h-4" />;

/** One playlist (live `get-single`): cover, name, privacy, Play all, and its messages (remove from the ⋮ menu). */
export function PlaylistScreen({ route, navigation }: RootScreenProps<'Playlist'>) {
  const { id } = route.params;
  const playlist = useGetPlaylistQuery(id);
  const [deletePlaylist] = useDeletePlaylistMutation();
  const [removeFromPlaylist] = useRemoveFromPlaylistMutation();
  const { play } = useMediaActions();
  const bottom = useBottomSpace(false);
  const { width } = useWindowDimensions();
  const thumbWidth = Math.round((width - GUTTER * 2) * 0.45);

  const data = playlist.data;
  const items = useMemo(() => data?.podcasts ?? [], [data?.podcasts]);
  const episodes = useMemo(() => items.filter((p) => !isClip(p)), [items]);

  const [refreshing, setRefreshing] = useState(false);
  const { refetch } = playlist;
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const onMore = useCallback(
    (p: Podcast) =>
      Alert.alert(p.title, undefined, [
        {
          text: 'Remove from playlist',
          style: 'destructive',
          onPress: () =>
            void removeFromPlaylist({ playlistId: id, podcastId: p._id })
              .unwrap()
              .catch((e: { message?: string }) => Alert.alert('Couldn’t remove it', e.message ?? 'Please try again.')),
        },
        { text: 'Cancel', style: 'cancel' },
      ]),
    [id, removeFromPlaylist],
  );

  if (playlist.isLoading) {
    return (
      <Screen>
        <ScreenHeader />
        <View style={{ paddingHorizontal: GUTTER }}>
          <MediaRowSkeleton thumbWidth={thumbWidth} rows={4} />
        </View>
      </Screen>
    );
  }

  if (!data) {
    const notFound = (playlist.error as { status?: number } | undefined)?.status === 404;
    return (
      <Screen>
        <ScreenHeader />
        {notFound ? <EmptyState icon={ListMusic} title="Playlist not found" message="It may have been deleted, or it’s private." /> : <ErrorState onRetry={() => void refetch()} />}
      </Screen>
    );
  }

  const confirmDelete = () =>
    Alert.alert(`Delete “${data.name}”?`, 'The messages stay in Preach Radio; only this playlist is removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          navigation.goBack(); // the list already dropped it (optimistic)
          void deletePlaylist(id)
            .unwrap()
            .catch((e: { message?: string }) => Alert.alert('Couldn’t delete the playlist', e.message ?? 'Please try again.'));
        },
      },
    ]);

  const Privacy = data.isPublic ? Globe : Lock;

  return (
    <Screen>
      <ScreenHeader
        right={
          <View className="flex-row">
            <IconButton icon={Pencil} size={20} onPress={() => navigation.navigate('PlaylistEditor', { id })} accessibilityLabel="Edit playlist" />
            <IconButton icon={Trash2} size={20} color={colors.danger} onPress={confirmDelete} accessibilityLabel="Delete playlist" />
          </View>
        }
      />
      <FlashList
        data={items}
        keyExtractor={(p) => p._id}
        ItemSeparatorComponent={Gap}
        contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: bottom }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.white} />}
        ListHeaderComponent={
          <View className="items-center pb-6">
            <View style={shadow.floating}>
              <PlaylistCover coverImage={data.cover_image} covers={items.slice(0, 4).map((p) => p.coverImage)} size={200} />
            </View>
            <AppText variant="h1" className="mt-6 text-center">
              {data.name}
            </AppText>
            {data.description ? (
              <AppText variant="bodySm" tone="secondary" className="mt-1.5 text-center">
                {data.description}
              </AppText>
            ) : null}
            <View className="mt-2 flex-row items-center gap-1">
              <Privacy size={12} color={colors.text.muted} />
              <AppText variant="caption" tone="muted">
                {data.isPublic ? 'Public' : 'Private'} · {countLabel(items.length)}
              </AppText>
            </View>
            {items.length ? (
              <Button
                label="Play all"
                icon={Play}
                onPress={() => {
                  const first = episodes[0] ?? items[0];
                  if (first) play(first, episodes);
                }}
                className="mt-5 self-stretch"
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon={ListMusic}
            title="This playlist is empty"
            message="Tap “Add to playlist” in the player to add messages."
            actionLabel="Find messages"
            onAction={() => navigation.navigate('Search')}
          />
        }
        renderItem={({ item }) => (
          <MediaRow
            podcast={item}
            meta={`${item.category.name} · ${formatCount(item.totalView)} views`}
            thumbWidth={thumbWidth}
            onPress={(p) => play(p, episodes)}
            trailing={
              <Touchable onPress={() => onMore(item)} className="h-9 w-8 items-center justify-center" accessibilityLabel={`More options for ${item.title}`}>
                <MoreVertical size={18} color={colors.text.muted} />
              </Touchable>
            }
          />
        )}
      />
    </Screen>
  );
}
