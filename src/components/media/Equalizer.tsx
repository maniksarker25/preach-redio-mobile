import { memo, useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { colors } from '@/theme';

/** Heights echo the five bars of the Preach Radio logo. */
const REST = [0.35, 0.85, 0.55, 1, 0.7];

const Bar = ({ value, width, height, color }: { value: SharedValue<number>; width: number; height: number; color: string }) => {
  const style = useAnimatedStyle(() => ({ height: Math.max(2, value.value * height) }));
  return <Animated.View style={[{ width, borderRadius: width, backgroundColor: color }, style]} />;
};

interface EqualizerProps {
  playing: boolean;
  height?: number;
  barWidth?: number;
  color?: string;
  bars?: 3 | 4 | 5;
}

/** Animated "now playing" bars — the logo's motif in motion. */
export const Equalizer = memo(function Equalizer({ playing, height = 16, barWidth = 3, color = colors.brand[500], bars = 4 }: EqualizerProps) {
  const v0 = useSharedValue(REST[0]!);
  const v1 = useSharedValue(REST[1]!);
  const v2 = useSharedValue(REST[2]!);
  const v3 = useSharedValue(REST[3]!);
  const v4 = useSharedValue(REST[4]!);
  const values = [v0, v1, v2, v3, v4].slice(0, bars);

  useEffect(() => {
    values.forEach((v, i) => {
      if (playing) {
        const d = 260 + i * 70;
        v.value = withDelay(
          i * 90,
          withRepeat(
            withSequence(withTiming(1, { duration: d, easing: Easing.inOut(Easing.quad) }), withTiming(0.25, { duration: d, easing: Easing.inOut(Easing.quad) })),
            -1,
            true,
          ),
        );
      } else {
        cancelAnimation(v);
        v.value = withTiming(REST[i]!, { duration: 250 });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  return (
    <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: barWidth * 0.8 }} accessibilityElementsHidden>
      {values.map((v, i) => (
        <Bar key={i} value={v} width={barWidth} height={height} color={color} />
      ))}
    </View>
  );
});
