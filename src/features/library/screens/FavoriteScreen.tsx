import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { Heart } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, useWindowDimensions, View } from 'react-native';
import type { TabScreenProps } from '@/app/navigation/types';
import { MediaRow, MediaRowSkeleton } from '@/components/cards/MediaRow';
import { AppText } from '@/components/common/AppText';
import { EmptyState, ErrorState } from '@/components/common/States';
import { Touchable } from '@/components/common/Touchable';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { useMediaActions } from '@/hooks/useMediaActions';
import { flattenFavorites, useGetFavoritesInfiniteQuery, useToggleFavoriteMutation, type FavoriteEntry } from '@/store/api/favoritesApi';
import { colors, GUTTER } from '@/theme';
import type { Podcast } from '@/types/models';
import { formatCount, timeAgo } from '@/utils/format';
import { isClip } from '@/utils/podcast';

const entryKey = (e: FavoriteEntry) => e.podcast._id;
const Gap = () => <View className="h-4" />;

/**
 * Favorite tab: podcasts and clips saved with the heart / bookmark (`/bookmark/my-bookmarks`, newest saved
 * first, paged), in the same list design as History. The heart on a row removes it (optimistic).
 */
export function FavoriteScreen({ navigation }: TabScreenProps<'Favorite'>) {
  const favorites = useGetFavoritesInfiniteQuery();
  const items = useMemo(() => flattenFavorites(favorites.data?.pages), [favorites.data?.pages]);
  const episodes = useMemo(() => items.map((e) => e.podcast).filter((p) => !isClip(p)), [items]);
  const [toggleFavorite] = useToggleFavoriteMutation();
  const { play } = useMediaActions();
  const { width } = useWindowDimensions();
  const bottom = useBottomSpace();
  const thumbWidth = Math.round((width - GUTTER * 2) * 0.45);

  // Saves can also come from another device: refetch on focus (not the first one — it is loading then).
  const focusedOnce = useRef(false);
  const { refetch } = favorites;
  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) void refetch();
      focusedOnce.current = true;
    }, [refetch]),
  );

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = favorites;
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

  const remove = useCallback((podcast: Podcast) => void toggleFavorite({ podcast, saved: false }), [toggleFavorite]);

  return (
    <Screen>
      <ScreenHeader title="Favorite" back={false} />
      {favorites.isLoading ? (
        <View style={{ paddingHorizontal: GUTTER, paddingTop: 4 }}>
          <MediaRowSkeleton thumbWidth={thumbWidth} />
        </View>
      ) : favorites.isError && !items.length ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <FlashList
          data={items}
          keyExtractor={entryKey}
          // Clips open the reels viewer; episodes play with the other saved episodes as the queue.
          renderItem={({ item }) => (
            <MediaRow
              podcast={item.podcast}
              meta={`${formatCount(item.podcast.totalView)} views · Saved ${timeAgo(item.savedAt)}`}
              thumbWidth={thumbWidth}
              onPress={(p) => play(p, episodes)}
              trailing={
                <Touchable haptic onPress={() => remove(item.podcast)} className="h-9 w-9 items-center justify-center" accessibilityLabel={`Remove ${item.podcast.title} from favorites`}>
                  <Heart size={20} color={colors.live} fill={colors.live} />
                </Touchable>
              }
            />
          )}
          ItemSeparatorComponent={Gap}
          contentContainerStyle={{ paddingHorizontal: GUTTER, paddingTop: 4, paddingBottom: bottom }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.white} />}
          ListHeaderComponent={
            items.length ? (
              <View className="mb-3 flex-row items-center gap-2">
                <Heart size={15} color={colors.brand[400]} />
                <AppText variant="title" tone="secondary">
                  Saved
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
            <EmptyState
              icon={Heart}
              title="No favorites yet"
              message="Tap the heart in the player, or the bookmark on a clip, to save it here."
              actionLabel="Browse"
              onAction={() => navigation.navigate('Home')}
            />
          }
        />
      )}
    </Screen>
  );
}
