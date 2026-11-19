import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Clock, Heart, House, Plus } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { memo } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/common/Avatar';
import { Touchable } from '@/components/common/Touchable';
import { MiniPlayer } from '@/components/media/MiniPlayer';
import { TAB_BAR_HEIGHT } from '@/hooks/useBottomSpace';
import { useAppSelector } from '@/store/hooks';
import { selectProfile } from '@/store/slices/authSlice';
import { colors } from '@/theme';
import type { MainTabParamList } from './types';

const ICONS: Partial<Record<keyof MainTabParamList, { icon: LucideIcon; label: string }>> = {
  Home: { icon: House, label: 'Home' },
  History: { icon: Clock, label: 'History' },
  Favorite: { icon: Heart, label: 'Favorite' },
};

const ProfileIcon = ({ focused }: { focused: boolean }) => {
  const profile = useAppSelector(selectProfile);
  return (
    <View className="rounded-full" style={{ borderWidth: 2, borderColor: focused ? colors.white : 'transparent', padding: 1 }}>
      <Avatar uri={profile?.profile_image} name={profile?.name ?? 'You'} size={28} />
    </View>
  );
};

const TabItem = memo(function TabItem({ name, focused, onPress }: { name: keyof MainTabParamList; focused: boolean; onPress: () => void }) {
  const meta = ICONS[name];
  const label = name === 'Profile' ? 'Profile' : name === 'Create' ? 'Create' : (meta?.label ?? name);

  return (
    <Touchable
      haptic
      scaleTo={0.88}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      className="flex-1 items-center justify-center"
      style={{ height: TAB_BAR_HEIGHT }}
    >
      {name === 'Profile' ? (
        <ProfileIcon focused={focused} />
      ) : name === 'Create' ? (
        <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
          <Plus size={24} color={colors.black} strokeWidth={2.4} />
        </View>
      ) : meta ? (
        <meta.icon size={28} color={focused ? colors.white : colors.brand[400]} strokeWidth={focused ? 2.2 : 1.8} />
      ) : null}
      {focused && name !== 'Profile' && name !== 'Create' ? <View className="absolute bottom-2 h-1 w-1 rounded-full bg-white" /> : null}
    </Touchable>
  );
});

/**
 * Flutter-style bottom navigation: icon-only tabs on #151619, white when
 * selected, accent pink otherwise; profile avatar as the last tab.
 * Rendered in normal flow (not absolute), so screens always end above it.
 */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="bg-ink-900">
      <MiniPlayer />
      <View className="flex-row border-t border-line bg-ink-850" style={{ paddingBottom: insets.bottom }}>
        {state.routes.map((route, index) => {
          const name = route.name as keyof MainTabParamList;
          const focused = state.index === index;
          const onPress = () => {
            if (name === 'Create') {
              navigation.getParent()?.navigate('CreateSheet');
              return;
            }
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };
          return <TabItem key={route.key} name={name} focused={focused} onPress={onPress} />;
        })}
      </View>
    </View>
  );
}
