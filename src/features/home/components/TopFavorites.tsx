import { useNavigation } from '@react-navigation/native';
import { Tv } from 'lucide-react-native';
import { memo, useEffect, useState } from 'react';
import { Modal, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Avatar } from '@/components/common/Avatar';
import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { LiveBadge } from '@/components/common/LiveBadge';
import { Touchable } from '@/components/common/Touchable';
import { Rail } from '@/components/layouts/Rail';
import { useMediaActions } from '@/hooks/useMediaActions';
import { colors } from '@/theme';
import type { Broadcaster } from '@/types/broadcaster';

/** Red ring that pulses around a live host (Flutter `_pulseAnimation`). */
const PulseRing = () => {
  const s = useSharedValue(0);
  useEffect(() => {
    s.value = withRepeat(withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [s]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 1 + s.value * 0.06 }] }));
  return <Animated.View style={[{ position: 'absolute', width: 104, height: 104, borderRadius: 52, borderWidth: 3, borderColor: 'rgba(244,67,54,0.6)' }, style]} />;
};

const HostItem = memo(function HostItem({ host, onPress }: { host: Broadcaster; onPress: (h: Broadcaster) => void }) {
  return (
    <Touchable onPress={() => onPress(host)} className="w-[106px] items-center" accessibilityLabel={`${host.name}${host.isLive ? ', live now' : ''}`}>
      <View className="h-[106px] w-[106px] items-center justify-center">
        {host.isLive ? <PulseRing /> : null}
        <Avatar uri={host.avatar} name={host.name} size={96} />
        {host.isLive ? (
          <View className="absolute bottom-0">
            <LiveBadge size="sm" />
          </View>
        ) : null}
      </View>
      <AppText variant="label" numberOfLines={1} className="mt-2 px-1 text-center">
        {host.name}
      </AppText>
    </Touchable>
  );
});

/** "Top Favorites": the station and creators; a live host asks before joining, like Flutter. */
export const TopFavorites = memo(function TopFavorites({ hosts }: { hosts: Broadcaster[] }) {
  const navigation = useNavigation();
  const { tuneIn } = useMediaActions();
  const [pending, setPending] = useState<Broadcaster | null>(null);

  const onPress = (h: Broadcaster) => (h.isLive ? setPending(h) : navigation.navigate('StationDetail', { id: h.id }));

  return (
    <>
      <Rail data={hosts} keyExtractor={(h) => h.id} gap={6} renderItem={({ item }) => <HostItem host={item} onPress={onPress} />} />
      <Modal visible={pending !== null} transparent animationType="fade" onRequestClose={() => setPending(null)}>
        <View className="flex-1 items-center justify-center bg-black/70 px-8">
          <View className="w-full rounded-2xl border border-live bg-[#1C1B1B] p-6">
            <View className="items-center">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-live/15">
                <Tv size={30} color={colors.live} />
              </View>
              <AppText variant="h3" className="mt-4 text-center">
                {pending?.name} is Live!
              </AppText>
              <AppText variant="bodySm" tone="secondary" className="mt-2 text-center">
                Would you like to join the live session?
              </AppText>
            </View>
            <View className="mt-6 flex-row gap-3">
              <Button label="Maybe Later" variant="ghost" onPress={() => setPending(null)} className="flex-1" />
              <Button
                label="Join Now"
                variant="danger"
                className="flex-1"
                onPress={() => {
                  const host = pending;
                  setPending(null);
                  if (host) tuneIn(host);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
});
