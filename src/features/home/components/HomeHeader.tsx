import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Bell, Search } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { memo } from 'react';
import { View } from 'react-native';
import { logoMark } from '@/assets';
import { AppText } from '@/components/common/AppText';
import { Touchable } from '@/components/common/Touchable';
import { useGetUnseenNotificationCountQuery } from '@/store/api/notificationsApi';
import { useAppSelector } from '@/store/hooks';
import { selectProfile } from '@/store/slices/authSlice';
import { colors, GUTTER } from '@/theme';
import { greeting } from '@/utils/format';

/** Soft round icon button with an optional unread badge. */
const RoundAction = ({ icon: Icon, label, badge, onPress }: { icon: LucideIcon; label: string; badge?: number; onPress: () => void }) => (
  <Touchable
    haptic
    scaleTo={0.9}
    onPress={onPress}
    accessibilityLabel={label}
    style={{
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.07)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    }}
  >
    <Icon size={20} color={colors.white} strokeWidth={2} />
    {badge ? (
      <View
        style={{
          position: 'absolute',
          top: -2,
          right: -2,
          minWidth: 18,
          height: 18,
          borderRadius: 9,
          paddingHorizontal: 4,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.live,
          borderWidth: 2,
          borderColor: colors.ink[900],
        }}
      >
        <AppText variant="caption" tone="white" className="text-[10px] leading-[12px]">
          {badge > 9 ? '9+' : badge}
        </AppText>
      </View>
    ) : null}
  </Touchable>
);

/** Home header: brand badge + personal greeting on the left, search and notifications on the right. */
export const HomeHeader = memo(function HomeHeader() {
  const navigation = useNavigation();
  const profile = useAppSelector(selectProfile);
  // Light count endpoint; re-checked every minute while the app is in front.
  const { data: unread = 0 } = useGetUnseenNotificationCountQuery(undefined, { pollingInterval: 60_000, skipPollingIfUnfocused: true, refetchOnMountOrArgChange: 30 });
  const firstName = profile?.name.split(' ')[0] ?? 'there';

  return (
    <View style={{ paddingHorizontal: GUTTER, height: 68, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}>
        <Image source={logoMark} style={{ width: 32, height: 32 }} contentFit="contain" accessibilityLabel="Preach Radio" />
      </View>
      <View className="ml-3 flex-1">
        <AppText variant="caption" tone="muted" className="text-[13px]">
          {greeting()}
        </AppText>
        <AppText variant="h3" numberOfLines={1} className="text-[19px]">
          {firstName}
        </AppText>
      </View>
      <View className="flex-row gap-2.5">
        <RoundAction icon={Search} label="Search" onPress={() => navigation.navigate('Search')} />
        <RoundAction icon={Bell} label={`Notifications${unread ? `, ${unread} unread` : ''}`} badge={unread} onPress={() => navigation.navigate('Notifications')} />
      </View>
    </View>
  );
});
