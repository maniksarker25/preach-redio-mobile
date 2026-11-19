import { FlashList } from '@shopify/flash-list';
import { Bell, CreditCard, Megaphone, Radio } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import type { RootScreenProps } from '@/app/navigation/types';
import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { EmptyState, ErrorState } from '@/components/common/States';
import { Touchable } from '@/components/common/Touchable';
import { ListSkeleton } from '@/components/layouts/ListSkeleton';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { useNotifications } from '@/hooks/queries';
import { useAppSelector } from '@/store/hooks';
import { selectProfile } from '@/store/slices/authSlice';
import { colors, GUTTER } from '@/theme';
import type { AppNotification, NotificationType } from '@/types/models';
import { timeAgo } from '@/utils/format';

const ICONS: Record<NotificationType, { icon: LucideIcon; tint: string }> = {
  LIVE_INVITATION: { icon: Radio, tint: colors.live },
  GENERAL: { icon: Megaphone, tint: colors.brand[400] },
  PAYMENT: { icon: CreditCard, tint: colors.gold },
  FEEDBACK: { icon: Bell, tint: '#7FB2FF' },
};

export function NotificationsScreen({ navigation }: RootScreenProps<'Notifications'>) {
  const list = useNotifications();
  const me = useAppSelector(selectProfile)?._id ?? '';
  const [readLocally, setReadLocally] = useState<Set<string>>(new Set());
  const isUnread = (n: AppNotification) => !n.seenBy.includes(me) && !readLocally.has(n._id);
  const unread = list.data?.filter(isUnread).length ?? 0;

  /** `redirectId` points at a podcast, station/creator or album depending on its prefix. */
  const open = (n: AppNotification) => {
    setReadLocally((s) => new Set(s).add(n._id));
    const id = n.redirectId;
    if (!id) return;
    if (id.startsWith('pod_') || id.startsWith('clip_')) navigation.navigate('PodcastDetail', { id });
    else if (id.startsWith('alb_')) navigation.navigate('Album', { id });
    else navigation.navigate('StationDetail', { id });
  };

  return (
    <Screen>
      <ScreenHeader
        title="Notifications"
        right={unread ? <Button label="Mark all read" size="sm" variant="ghost" onPress={() => setReadLocally(new Set(list.data?.map((n) => n._id)))} /> : null}
      />
      {list.isLoading ? (
        <ListSkeleton rows={5} />
      ) : list.isError ? (
        <ErrorState onRetry={() => void list.refetch()} />
      ) : (
        <FlashList
          data={list.data}
          keyExtractor={(n) => n._id}
          contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View className="h-2.5" />}
          ListEmptyComponent={<EmptyState icon={Bell} title="You’re all caught up" message="We’ll let you know when stations go live or new messages arrive." />}
          renderItem={({ item }) => {
            const { icon: Icon, tint } = ICONS[item.type] ?? ICONS.GENERAL;
            const fresh = isUnread(item);
            return (
              <Touchable onPress={() => open(item)} scaleTo={0.985} className={fresh ? 'flex-row rounded-lg border border-brand-500/30 bg-brand-500/10 p-4' : 'flex-row rounded-lg border border-line bg-ink-800 p-4'} accessibilityLabel={`${fresh ? 'Unread. ' : ''}${item.title}. ${item.message}`}>
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
                {fresh ? <View className="ml-2 mt-1.5 h-2.5 w-2.5 rounded-full bg-live" /> : null}
              </Touchable>
            );
          }}
        />
      )}
    </Screen>
  );
}
