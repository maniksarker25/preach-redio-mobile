import { Headphones } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import type { RootScreenProps } from '@/app/navigation/types';
import { EmptyState, ErrorState } from '@/components/common/States';
import { GridSkeleton } from '@/components/layouts/GridSkeleton';
import { PodcastGrid } from '@/components/layouts/PodcastGrid';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { usePodcasts } from '@/hooks/queries';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { useMediaActions } from '@/hooks/useMediaActions';
import { flattenClips, useGetClipsInfiniteQuery } from '@/store/api/reelsApi';
import { colors } from '@/theme';

/** "See all" for Just In / Faith Hits / Praise Clips (Flutter `PodcastListScreen`, 2-column grid). */
export function PodcastListScreen({ route }: RootScreenProps<'PodcastList'>) {
  const { title, query } = route.params;
  if (query?.type === 'clip') return <ClipList title={title} />;
  return <EpisodeList title={title} query={query} />;
}

function EpisodeList({ title, query }: RootScreenProps<'PodcastList'>['route']['params']) {
  const list = usePodcasts({ ...query, limit: 50 });
  const { play } = useMediaActions();
  const bottom = useBottomSpace(false);

  return (
    <Screen>
      <ScreenHeader title={title} />
      {list.isLoading ? (
        <GridSkeleton />
      ) : list.isError ? (
        <ErrorState onRetry={() => void list.refetch()} />
      ) : (
        <PodcastGrid data={list.data} bottom={bottom} onPress={(p) => play(p, list.data)} empty={<EmptyState icon={Headphones} title="Nothing here yet" />} />
      )}
    </Screen>
  );
}

/** Praise Clips "See all": the live clip feed, paged as the user scrolls; a tap opens the reels viewer there. */
function ClipList({ title }: { title: string }) {
  const feed = useGetClipsInfiniteQuery();
  const clips = useMemo(() => flattenClips(feed.data?.pages), [feed.data?.pages]);
  const { play } = useMediaActions();
  const bottom = useBottomSpace(false);

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feed;
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <Screen>
      <ScreenHeader title={title} />
      {feed.isLoading ? (
        <GridSkeleton />
      ) : feed.isError && !clips.length ? (
        <ErrorState onRetry={() => void feed.refetch()} />
      ) : (
        <PodcastGrid
          data={clips}
          bottom={bottom}
          onPress={(p) => play(p)}
          onEndReached={loadMore}
          footer={isFetchingNextPage ? <View className="py-4"><ActivityIndicator color={colors.white} /></View> : null}
          empty={<EmptyState icon={Headphones} title="No clips yet" />}
        />
      )}
    </Screen>
  );
}
