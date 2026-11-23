import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { Bell, CreditCard, Megaphone, MessageCircle, Radio } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, View } from 'react-native';
import type { RootScreenProps } from '@/app/navigation/types';
import { AppText } from '@/components/common/AppText';
import { EmptyState, ErrorState } from '@/components/common/States';
import { Touchable } from '@/components/common/Touchable';
import { ListSkeleton } from '@/components/layouts/ListSkeleton';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { useMediaActions } from '@/hooks/useMediaActions';
import { flattenNotifications, useDeleteNotificationMutation, useGetNotificationsInfiniteQuery, useMarkNotificationsSeenMutation } from '@/store/api/notificationsApi';
import { reelsApi } from '@/store/api/reelsApi';
import { useAppDispatch } from '@/store/hooks';
import { colors, GUTTER } from '@/theme';
import type { AppNotification, NotificationType } from '@/types/models';
import { timeAgo } from '@/utils/format';

const ICONS: Partial<Record<NotificationType, { icon: LucideIcon; tint: string }>> = {
  LIVE_INVITATION: { icon: Radio, tint: colors.live },
  GENERAL: { icon: Megaphone, tint: colors.brand[400] },
  PAYMENT: { icon: CreditCard, tint: colors.gold },
  FEEDBACK: { icon: Bell, tint: '#7FB2FF' },
  COMMENT: { icon: MessageCircle, tint: '#7FD1AE' },
};
const DEFAULT_ICON = { icon: Bell, tint: colors.brand[400] };
/** Types whose `redirectId` is a podcast / clip id. */
const OPENS_PODCAST = new Set<NotificationType>(['COMMENT', 'GENERAL']);
const Gap = () => <View className="h-2.5" />;

/**
 * Notifications — live. Unread ones stay highlighted while you are here; leaving the screen marks
 * everything seen (that also clears the home badge). Long-press to delete.
 */
export function NotificationsScreen({ navigation }: RootScreenProps<'Notifications'>) {
  const dispatch = useAppDispatch();
  const query = useGetNotificationsInfiniteQuery();
  const items = useMemo(() => flattenNotifications(query.data?.pages), [query.data?.pages]);
  const [markSeen] = useMarkNotificationsSeenMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const { play } = useMediaActions();
  const [opening, setOpening] = useState<string>();

  const { refetch, hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  // Refresh on every visit; mark all seen when leaving (so this visit still shows what was new).
  useFocusEffect(
    useCallback(() => {
      void refetch();
      return () => void markSeen();
    }, [markSeen, refetch]),
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

  /** A podcast/clip notification opens it (clip → reels, episode → player). */
  const open = useCallback(
    async (n: AppNotification) => {
      if (!n.redirectId || !OPENS_PODCAST.has(n.type)) return;
      setOpening(n._id);
      const request = dispatch(reelsApi.endpoints.getClip.initiate(n.redirectId));
      try {
        const podcast = await request.unwrap();
        play(podcast);
      } catch {
        Alert.alert('Not available', 'This message is no longer available.');
      } finally {
        request.unsubscribe();
        setOpening(undefined);
      }
    },
    [dispatch, play],
  );

  const confirmDelete = useCallback(
    (n: AppNotification) =>
      Alert.alert('Delete notification?', n.title, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            void deleteNotification(n)
              .unwrap()
              .catch(() => Alert.alert('Couldn’t delete it', 'Please try again.')),
        },
      ]),
    [deleteNotification],
  );

  return (
    <Screen>
      <ScreenHeader title="Notifications" />
      {query.isLoading ? (
        <ListSkeleton rows={5} />
      ) : query.isError && !items.length ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(n) => n._id}
          extraData={opening}
          contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 40 }}
          ItemSeparatorComponent={Gap}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.white} />}
          ListEmptyComponent={<EmptyState icon={Bell} title="You’re all caught up" message="We’ll let you know about new messages, comments and live broadcasts." />}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.white} style={{ marginVertical: 16 }} /> : null}
          renderItem={({ item }) => {
            const { icon: Icon, tint } = ICONS[item.type] ?? DEFAULT_ICON;
            const fresh = !item.isSeen;
            return (
              <Touchable
                onPress={() => void open(item)}
                onLongPress={() => confirmDelete(item)}
                scaleTo={0.985}
                className={fresh ? 'flex-row rounded-lg border border-brand-500/30 bg-brand-500/10 p-4' : 'flex-row rounded-lg border border-line bg-ink-800 p-4'}
                accessibilityLabel={`${fresh ? 'Unread. ' : ''}${item.title}. ${item.message}`}
                accessibilityHint="Long-press to delete"
              >
                <View className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: `${tint}22` }}>
                  <Icon size={20} color={tint} />
                </View>
                <View className="ml-3.5 flex-1">
                  <AppText variant="title">{item.title}</AppText>
                  <AppText variant="bodySm" tone="secondary" className="mt-1">
                    {item.message}
                  </AppText>
                  <AppText variant="caption" tone="faint" className="mt-2">
                    {timeAgo(item.createdAt)}
                  </AppText>
                </View>
                {opening === item._id ? (
                  <ActivityIndicator size="small" color={colors.white} style={{ marginLeft: 8 }} />
                ) : fresh ? (
                  <View className="ml-2 mt-1.5 h-2.5 w-2.5 rounded-full bg-live" />
                ) : null}
              </Touchable>
            );
          }}
        />
      )}
    </Screen>
  );
}
