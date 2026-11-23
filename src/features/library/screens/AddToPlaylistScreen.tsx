import { FlashList } from '@shopify/flash-list';
import { Check, Plus } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootScreenProps } from '@/app/navigation/types';
import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { ErrorState, Skeleton } from '@/components/common/States';
import { Touchable } from '@/components/common/Touchable';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { flattenPlaylists, PLAYLIST_MAX_PODCASTS, useAddToPlaylistMutation, useGetMyPlaylistsInfiniteQuery, useRemoveFromPlaylistMutation } from '@/store/api/playlistsApi';
import { usePlayerStore } from '@/store/playerStore';
import { colors, GUTTER } from '@/theme';
import type { Playlist } from '@/types/models';
import { PlaylistRow } from '../components/PlaylistRow';

/** Sheet to toggle a message in and out of the user's playlists (live; each tap is one atomic add/remove). */
export function AddToPlaylistScreen({ route, navigation }: RootScreenProps<'AddToPlaylist'>) {
  const { podcastId } = route.params;
  const insets = useSafeAreaInsets();
  const query = useGetMyPlaylistsInfiniteQuery();
  const playlists = useMemo(() => flattenPlaylists(query.data?.pages), [query.data?.pages]);
  const [add] = useAddToPlaylistMutation();
  const [remove] = useRemoveFromPlaylistMutation();
  /** Rows with a request in flight (a second tap waits for the first). */
  const [pending, setPending] = useState<Record<string, true>>({});

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const toggle = useCallback(
    async (p: Playlist) => {
      const added = p.podcasts.includes(podcastId);
      if (!added && p.podcasts.length >= PLAYLIST_MAX_PODCASTS) {
        Alert.alert('Playlist is full', `A playlist can hold up to ${PLAYLIST_MAX_PODCASTS} messages.`);
        return;
      }
      setPending((s) => ({ ...s, [p._id]: true }));
      try {
        if (added) await remove({ playlistId: p._id, podcastId }).unwrap();
        else {
          // The podcast object (when it is the one playing) lets an open playlist show it at once.
          const np = usePlayerStore.getState().nowPlaying;
          const podcast = np?.kind === 'podcast' && np.podcast._id === podcastId ? np.podcast : undefined;
          await add({ playlistId: p._id, podcastId, podcast }).unwrap();
        }
      } catch (e) {
        Alert.alert(added ? 'Couldn’t remove it' : 'Couldn’t add it', (e as { message?: string }).message ?? 'Please try again.');
      } finally {
        setPending((s) => {
          const next = { ...s };
          delete next[p._id];
          return next;
        });
      }
    },
    [add, podcastId, remove],
  );

  return (
    <Screen safeTop={false} className="bg-ink-850">
      <View className="items-center pt-2.5">
        <View className="h-1 w-10 rounded-full bg-ink-500" />
      </View>
      <ScreenHeader back="down" title="Add to playlist" />
      {query.isLoading ? (
        <View style={{ paddingHorizontal: GUTTER, gap: 12 }} accessibilityLabel="Loading" accessibilityRole="progressbar">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} width="100%" height={56} radius={8} />
          ))}
        </View>
      ) : query.isError && !playlists.length ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : (
        <FlashList
          data={playlists}
          keyExtractor={(p) => p._id}
          extraData={pending}
          contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: insets.bottom + 24 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          ListHeaderComponent={
            <Touchable onPress={() => navigation.replace('PlaylistEditor', { addPodcastId: podcastId })} className="flex-row items-center py-2.5" accessibilityLabel="New playlist">
              <View className="h-14 w-14 items-center justify-center rounded-md bg-white">
                <Plus size={24} color={colors.black} />
              </View>
              <AppText variant="title" className="ml-3.5">
                New playlist
              </AppText>
            </Touchable>
          }
          renderItem={({ item }) => {
            const added = item.podcasts.includes(podcastId);
            const busy = Boolean(pending[item._id]);
            return (
              <PlaylistRow
                playlist={item}
                className="py-2.5"
                onPress={(p) => void toggle(p)}
                disabled={busy}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: added, disabled: busy }}
                trailing={
                  busy ? (
                    <ActivityIndicator size="small" color={colors.white} style={{ width: 28 }} />
                  ) : (
                    <View className={added ? 'h-7 w-7 items-center justify-center rounded-full bg-white' : 'h-7 w-7 rounded-full border-2 border-ink-500'}>
                      {added ? <Check size={16} color={colors.black} strokeWidth={3} /> : null}
                    </View>
                  )
                }
              />
            );
          }}
          ListFooterComponent={
            <>
              {isFetchingNextPage ? <ActivityIndicator color={colors.white} style={{ marginTop: 12 }} /> : null}
              <Button label="Done" variant="secondary" onPress={() => navigation.goBack()} className="mt-6" />
            </>
          }
        />
      )}
    </Screen>
  );
}
