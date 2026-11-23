import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { Clock } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, useWindowDimensions, View } from 'react-native';
import type { TabScreenProps } from '@/app/navigation/types';
import { AppText } from '@/components/common/AppText';
import { EmptyState, ErrorState } from '@/components/common/States';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { useMediaActions } from '@/hooks/useMediaActions';
import { flattenHistory, useGetWatchHistoryInfiniteQuery, type HistoryEntry } from '@/store/api/historyApi';
import { colors, GUTTER } from '@/theme';
import { isClip } from '@/utils/podcast';
import { MediaRow, MediaRowSkeleton } from '@/components/cards/MediaRow';
import { formatCount, timeAgo } from '@/utils/format';

const entryKey = (e: HistoryEntry) => e.podcast._id;
const Gap = () => <View className="h-4" />;

/**
 * History tab: "Recently played" as a list (16:9 thumbnail · title · owner · views · when), from the server's watch
 * history (last played first, paged). Refreshed whenever the tab gains focus, since every play
 * elsewhere (player, Preach Clips) adds to it.
 */
export function HistoryScreen({ navigation }: TabScreenProps<'History'>) {
  const history = useGetWatchHistoryInfiniteQuery();
  const items = useMemo(() => flattenHistory(history.data?.pages), [history.data?.pages]);
  const episodes = useMemo(() => items.map((e) => e.podcast).filter((p) => !isClip(p)), [items]);
  const { play } = useMediaActions();
  const { width } = useWindowDimensions();
  const bottom = useBottomSpace();
  // Thumbnail ≈ 45% of the row, like a watch-history list; text takes the rest.
  const thumbWidth = Math.round((width - GUTTER * 2) * 0.45);

  // Refetch on focus, but not on the first focus (the query is already loading then).
  const focusedOnce = useRef(false);
  const { refetch } = history;
  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) void refetch();
      focusedOnce.current = true;
    }, [refetch]),
  );

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = history;
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Pull-to-refresh spinner only for a user refresh, not for paging or the silent focus refetch.
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <Screen>
      <ScreenHeader title="History" back={false} />
      {history.isLoading ? (
        <View style={{ paddingHorizontal: GUTTER, paddingTop: 4 }}>
          <MediaRowSkeleton thumbWidth={thumbWidth} />
        </View>
      ) : history.isError && !items.length ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <FlashList
          data={items}
          keyExtractor={entryKey}
          // Clips open the reels viewer; episodes play with the other history episodes as the queue.
          renderItem={({ item }) => (
            <MediaRow podcast={item.podcast} meta={`${formatCount(item.podcast.totalView)} views · ${timeAgo(item.playedAt)}`} thumbWidth={thumbWidth} onPress={(p) => play(p, episodes)} />
          )}
          ItemSeparatorComponent={Gap}
          contentContainerStyle={{ paddingHorizontal: GUTTER, paddingTop: 4, paddingBottom: bottom }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.white} />}
          ListHeaderComponent={
            items.length ? (
              <View className="mb-3 flex-row items-center gap-2">
                <Clock size={15} color={colors.brand[400]} />
                <AppText variant="title" tone="secondary">
                  Recently played
                </AppText>
              </View>
            ) : null
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4">
                <ActivityIndicator color={colors.white} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState icon={Clock} title="No history yet" message="Podcasts you play will show up here." actionLabel="Start listening" onAction={() => navigation.navigate('Home')} />
          }
        />
      )}
    </Screen>
  );
}
