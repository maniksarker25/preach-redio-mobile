import { memo, useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { cn } from '@/utils/podcast';
import { AppText } from './AppText';

/** "LIVE" pill with a pulsing dot. */
export const LiveBadge = memo(function LiveBadge({ size = 'md', className }: { size?: 'sm' | 'md'; className?: string }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }), -1, false);
  }, [pulse]);
  const ring = useAnimatedStyle(() => ({ opacity: 1 - pulse.value, transform: [{ scale: 1 + pulse.value * 1.6 }] }));

  return (
    <View
      className={cn('flex-row items-center gap-1.5 self-start rounded-full bg-live', size === 'sm' ? 'px-2 py-[3px]' : 'px-2.5 py-1', className)}
      accessibilityLabel="Live now"
    >
      <View className="h-1.5 w-1.5 items-center justify-center">
        <Animated.View style={[{ position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' }, ring]} />
        <View className="h-1.5 w-1.5 rounded-full bg-white" />
      </View>
      <AppText variant="overline" tone="white" className={size === 'sm' ? 'text-[9px] tracking-[1px]' : 'text-[10px]'}>
        Live
      </AppText>
    </View>
  );
});
