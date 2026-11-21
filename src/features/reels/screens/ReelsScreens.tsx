import { ChevronLeft } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootScreenProps } from '@/app/navigation/types';
import { IconButton } from '@/components/common/IconButton';
import { ErrorState } from '@/components/common/States';
import { Screen } from '@/components/layouts/Screen';
import { flattenClips, useGetClipQuery, useGetClipsInfiniteQuery } from '@/store/api/reelsApi';
import { colors } from '@/theme';
import { ReelsFeed } from '../components/ReelsFeed';

/**
 * Praise Clips (Flutter `ReelsScreen`): vertical full-screen pages from the live clip feed,
 * starting at the tapped clip. More clips load as the user swipes.
 */
export function ReelsViewerScreen({ route, navigation }: RootScreenProps<'ReelsViewer'>) {
  const insets = useSafeAreaInsets();
  const { startId } = route.params;
  const feed = useGetClipsInfiniteQuery();
  const loaded = useMemo(() => flattenClips(feed.data?.pages), [feed.data?.pages]);
  const startLoaded = loaded.some((c) => c._id === startId);
  // The tapped clip may be on a page that isn't loaded yet — fetch it and show it first.
  const start = useGetClipQuery(startId, { skip: !feed.isSuccess || startLoaded });

  const clips = useMemo(() => {
    if (startLoaded || !start.data) return loaded;
    return [start.data, ...loaded.filter((c) => c._id !== startId)];
  }, [loaded, start.data, startId, startLoaded]);

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feed;
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Wait for the start clip (unless it failed) so the list order — and the initial index — never shifts.
  const waitingForStart = feed.isSuccess && !startLoaded && start.isLoading;

  return (
    <Screen safeTop={false} className="bg-black">
      {feed.isLoading || waitingForStart ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.white} />
        </View>
      ) : feed.isError && !clips.length ? (
        <ErrorState onRetry={() => void feed.refetch()} />
      ) : (
        <ReelsFeed clips={clips} startId={startId} bottomInset={insets.bottom + 8} onEndReached={loadMore} />
      )}
      <View className="absolute left-2" style={{ top: insets.top + 4 }}>
        <IconButton icon={ChevronLeft} variant="glass" size={24} color={colors.white} onPress={() => navigation.goBack()} accessibilityLabel="Close clips" />
      </View>
    </Screen>
  );
}
