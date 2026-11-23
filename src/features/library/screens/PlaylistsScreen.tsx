import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { ChevronRight, Plus } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, View } from 'react-native';
import type { RootScreenProps } from '@/app/navigation/types';
import { AppText } from '@/components/common/AppText';
import { ErrorState, Skeleton } from '@/components/common/States';
import { Touchable } from '@/components/common/Touchable';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { flattenPlaylists, useGetMyPlaylistsInfiniteQuery } from '@/store/api/playlistsApi';
import { colors, GUTTER } from '@/theme';
import type { Playlist } from '@/types/models';
import { PlaylistRow } from '../components/PlaylistRow';

const Gap = () => <View className="h-2.5" />;

/** "My playlist" (Flutter `PlaylistScreen`): the user's playlists (live, last updated first) plus a create row. */
export function PlaylistsScreen({ navigation }: RootScreenProps<'Playlists'>) {
  const bottom = useBottomSpace(false);
  const query = useGetMyPlaylistsInfiniteQuery();
  const playlists = useMemo(() => flattenPlaylists(query.data?.pages), [query.data?.pages]);

  const focusedOnce = useRef(false);
  const { refetch, hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) void refetch();
      focusedOnce.current = true;
    }, [refetch]),
  );
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const open = useCallback((p: Playlist) => navigation.navigate('Playlist', { id: p._id }), [navigation]);

  const createRow = (
    <Touchable onPress={() => navigation.navigate('PlaylistEditor', {})} className="mb-2.5 flex-row items-center rounded-sm bg-ink-800 p-2.5" accessibilityLabel="Create a playlist">
      <View className="h-14 w-14 items-center justify-center rounded-[6px] border border-dashed border-white/40">
        <Plus size={24} color={colors.white} />
      </View>
      <AppText variant="title" className="ml-3.5 text-[16px]">
        Create playlist
      </AppText>
    </Touchable>
  );

  return (
    <Screen>
      <ScreenHeader title="My playlist" />
      {query.isLoading ? (
        <View style={{ paddingHorizontal: GUTTER, gap: 10 }} accessibilityLabel="Loading" accessibilityRole="progressbar">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={76} radius={8} />
          ))}
        </View>
      ) : query.isError && !playlists.length ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <FlashList
          data={playlists}
          keyExtractor={(p) => p._id}
          renderItem={({ item }) => <PlaylistRow playlist={item} onPress={open} trailing={<ChevronRight size={18} color={colors.text.muted} />} />}
          ItemSeparatorComponent={Gap}
          ListHeaderComponent={createRow}
          ListEmptyComponent={
            <AppText variant="bodySm" tone="muted" className="mt-6 text-center">
              No playlists yet. Create one, or tap “Add to playlist” on any message.
            </AppText>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4">
                <ActivityIndicator color={colors.white} />
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: bottom }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.white} />}
        />
      )}
    </Screen>
  );
}
