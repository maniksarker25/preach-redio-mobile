import { memo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AppText } from '@/components/common/AppText';
import { colors } from '@/theme';
import { formatClock } from '@/utils/format';

interface SeekbarProps {
  position: number;
  duration: number;
  onSeek: (seconds: number) => void;
  /** Hide the time labels (e.g. compact video overlays). */
  compact?: boolean;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Draggable progress bar. Shows elapsed / remaining and scrubs on drag or tap. */
export const Seekbar = memo(function Seekbar({ position, duration, onSeek, compact }: SeekbarProps) {
  const [width, setWidth] = useState(0);
  const [scrub, setScrub] = useState<number | null>(null);
  const active = useSharedValue(0);

  const ratio = duration > 0 ? clamp((scrub ?? position) / duration, 0, 1) : 0;
  const shown = scrub ?? position;

  const toSeconds = (x: number) => (width > 0 ? clamp(x / width, 0, 1) * duration : 0);

  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onBegin((e) => {
      active.value = withTiming(1, { duration: 120 });
      setScrub(toSeconds(e.x));
    })
    .onUpdate((e) => setScrub(toSeconds(e.x)))
    .onFinalize((e) => {
      active.value = withTiming(0, { duration: 160 });
      onSeek(toSeconds(e.x));
      setScrub(null);
    });

  const track = useAnimatedStyle(() => ({ height: 4 + active.value * 3 }));
  const thumb = useAnimatedStyle(() => ({ transform: [{ scale: 0.85 + active.value * 0.45 }] }));

  return (
    <View>
      <GestureDetector gesture={pan}>
        <View
          className="h-7 justify-center"
          onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Playback position"
          accessibilityValue={{ min: 0, max: Math.round(duration), now: Math.round(shown), text: formatClock(shown) }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => onSeek(clamp(position + (e.nativeEvent.actionName === 'increment' ? 15 : -15), 0, duration))}
        >
          <Animated.View style={[{ borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.16)', overflow: 'hidden' }, track]}>
            <View style={{ width: `${ratio * 100}%`, height: '100%', backgroundColor: colors.white }} />
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[
              { position: 'absolute', left: ratio * width - 7, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.white },
              thumb,
            ]}
          />
        </View>
      </GestureDetector>
      {compact ? null : (
        <View className="mt-1 flex-row justify-between">
          <AppText variant="caption" tone="secondary" style={{ fontVariant: ['tabular-nums'] }}>
            {formatClock(shown)}
          </AppText>
          <AppText variant="caption" tone="muted" style={{ fontVariant: ['tabular-nums'] }}>
            -{formatClock(Math.max(0, duration - shown))}
          </AppText>
        </View>
      )}
    </View>
  );
});

/** Thin, non-interactive progress line (cards, mini-player). */
export const ProgressLine = memo(function ProgressLine({ ratio, height = 3, color = colors.brand[500] }: { ratio: number; height?: number; color?: string }) {
  return (
    <View style={{ height, borderRadius: height, backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' }}>
      <View style={{ width: `${clamp(ratio, 0, 1) * 100}%`, height: '100%', backgroundColor: color, borderRadius: height }} />
    </View>
  );
});
