import { useEvent } from 'expo';
import type { VideoPlayer } from 'expo-video';
import { memo, useRef, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AppText } from '@/components/common/AppText';
import { colors } from '@/theme';
import { formatClock } from '@/utils/format';

/** Touch area height; the visible bar sits near its bottom. Big enough for a thumb, small enough not to cover the caption. */
const HIT_HEIGHT = 30;
const BAR_IDLE = 2.5;
const BAR_ACTIVE = 6;
const THUMB = 14;
/** While dragging, seek at most this often so the frame follows the finger without flooding the decoder. */
const LIVE_SEEK_MS = 90;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

interface ReelScrubberProps {
  player: VideoPlayer;
  /** Space below the bar (home indicator). */
  bottomInset: number;
  /** True while the user is dragging: the item hides its overlays and the feed stops vertical paging. */
  onScrubbingChange: (scrubbing: boolean) => void;
}

/**
 * TikTok-style progress bar for the visible clip.
 * - Drag sideways anywhere on the bar: it grows, the frame follows the finger and
 *   a large "0:12 / 0:45" shows; release to continue from there.
 * - Tap a point on the bar to jump there.
 * Vertical moves fail the gesture, so swiping to the next clip still works.
 */
export const ReelScrubber = memo(function ReelScrubber({ player, bottomInset, onScrubbingChange }: ReelScrubberProps) {
  const { currentTime } = useEvent(player, 'timeUpdate', { currentTime: player.currentTime, currentLiveTimestamp: null, currentOffsetFromLive: null, bufferedPosition: 0 });
  const duration = player.duration;
  const [width, setWidth] = useState(0);
  const [scrub, setScrub] = useState<number | null>(null);
  // After a seek while paused no time update arrives; keep showing the target until one does.
  const [settled, setSettled] = useState<{ value: number; staleTime: number } | null>(null);

  const wasPlaying = useRef(false);
  const lastSeekAt = useRef(0);
  const lastX = useRef(0);
  const dragging = useRef(false);
  const grow = useSharedValue(0);

  const ready = duration > 0 && width > 0;
  const toSeconds = (x: number) => (ready ? clamp(x / width, 0, 1) * duration : 0);

  const seekTo = (seconds: number) => {
    // expo-video seeks by assigning currentTime (documented API).
    player.currentTime = seconds;
  };

  const begin = (x: number) => {
    lastX.current = x;
    dragging.current = true;
    wasPlaying.current = player.playing;
    player.pause();
    grow.set(withTiming(1, { duration: 120 }));
    setScrub(toSeconds(x));
    onScrubbingChange(true);
  };

  const move = (x: number) => {
    lastX.current = x;
    const t = toSeconds(x);
    setScrub(t);
    const now = Date.now();
    if (now - lastSeekAt.current >= LIVE_SEEK_MS) {
      lastSeekAt.current = now;
      seekTo(t);
    }
  };

  const end = () => {
    dragging.current = false;
    const t = toSeconds(lastX.current);
    seekTo(t);
    setSettled({ value: t, staleTime: currentTime });
    if (wasPlaying.current) player.play();
    grow.set(withTiming(0, { duration: 160 }));
    setScrub(null);
    onScrubbingChange(false);
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .enabled(ready)
    .activeOffsetX([-6, 6])
    .failOffsetY([-14, 14])
    .onStart((e) => begin(e.x))
    .onUpdate((e) => move(e.x))
    // onFinalize also covers a cancelled drag, so the clip never stays paused by accident.
    .onFinalize(() => {
      if (dragging.current) end();
    });

  const tap = Gesture.Tap()
    .runOnJS(true)
    .enabled(ready)
    .onEnd((e) => {
      const t = toSeconds(e.x);
      seekTo(t);
      setSettled({ value: t, staleTime: currentTime });
    });

  const shown = scrub ?? (settled && settled.staleTime === currentTime ? settled.value : currentTime);
  const ratio = duration > 0 ? clamp(shown / duration, 0, 1) : 0;

  const barStyle = useAnimatedStyle(() => ({
    height: BAR_IDLE + grow.value * (BAR_ACTIVE - BAR_IDLE),
    backgroundColor: `rgba(255,255,255,${0.22 + grow.value * 0.1})`,
  }));
  const thumbStyle = useAnimatedStyle(() => ({ opacity: grow.value, transform: [{ scale: 0.4 + grow.value * 0.6 }] }));

  return (
    <>
      {scrub !== null ? (
        <Animated.View entering={FadeIn.duration(120)} exiting={FadeOut.duration(160)} pointerEvents="none" className="absolute left-0 right-0 items-center" style={{ bottom: bottomInset + 64 }}>
          <AppText variant="h1" tone="white" style={{ fontVariant: ['tabular-nums'], textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 8 }}>
            {formatClock(scrub)}
            <AppText variant="h1" tone="secondary" style={{ fontVariant: ['tabular-nums'] }}>
              {`  /  ${formatClock(duration)}`}
            </AppText>
          </AppText>
        </Animated.View>
      ) : null}

      <GestureDetector gesture={Gesture.Race(pan, tap)}>
        <View
          className="absolute left-0 right-0 justify-end"
          style={{ bottom: Math.max(0, bottomInset - 8), height: HIT_HEIGHT, paddingBottom: 8 }}
          onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Clip position"
          accessibilityValue={{ min: 0, max: Math.round(duration), now: Math.round(shown), text: `${formatClock(shown)} of ${formatClock(duration)}` }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => seekTo(clamp(shown + (e.nativeEvent.actionName === 'increment' ? 5 : -5), 0, duration))}
        >
          <Animated.View style={[{ overflow: 'hidden' }, barStyle]}>
            <View style={{ width: `${ratio * 100}%`, height: '100%', backgroundColor: colors.white }} />
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[
              { position: 'absolute', bottom: 8 + BAR_ACTIVE / 2 - THUMB / 2, left: clamp(ratio * width - THUMB / 2, 0, Math.max(0, width - THUMB)), width: THUMB, height: THUMB, borderRadius: THUMB / 2, backgroundColor: colors.white },
              thumbStyle,
            ]}
          />
        </View>
      </GestureDetector>
    </>
  );
});
