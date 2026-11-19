import { Maximize2, Minimize2, Pause, Play, RotateCcw, RotateCw } from 'lucide-react-native';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { AppText } from '@/components/common/AppText';
import { IconButton } from '@/components/common/IconButton';
import { Touchable } from '@/components/common/Touchable';
import { Artwork, Scrim } from '@/components/media/Artwork';
import { Seekbar } from '@/components/media/Seekbar';
import { colors } from '@/theme';
import { formatClock } from '@/utils/format';

const HIDE_AFTER_MS = 3200;

interface VideoStageProps {
  poster?: string | null;
  width: number;
  height: number;
  playing: boolean;
  position: number;
  duration: number;
  onToggle: () => void;
  onSeek: (s: number) => void;
  onSkip: (d: number) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
}

/**
 * The video surface with auto-hiding overlay controls.
 * The poster stands in for the video until a real player (expo-video) is wired.
 */
export const VideoStage = memo(function VideoStage({
  poster,
  width,
  height,
  playing,
  position,
  duration,
  onToggle,
  onSeek,
  onSkip,
  expanded,
  onToggleExpanded,
}: VideoStageProps) {
  const [visible, setVisible] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleHide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), HIDE_AFTER_MS);
  }, []);

  useEffect(() => {
    if (playing && visible) scheduleHide();
    if (!playing) setVisible(true);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [playing, visible, scheduleHide]);

  const interact = (fn: () => void) => () => {
    fn();
    scheduleHide();
  };

  return (
    <Pressable onPress={() => setVisible((v) => !v)} accessibilityLabel={visible ? 'Hide controls' : 'Show controls'} style={{ width, height, backgroundColor: colors.black }}>
      <Artwork uri={poster} width={width} height={height} radius={0} priority="high" />
      {visible ? (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(220)} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
          <View className="absolute inset-0 bg-black/45" />
          <Scrim strength={0.8} from={0.55} />
          <View className="absolute inset-0 flex-row items-center justify-center gap-10">
            <Touchable haptic scaleTo={0.85} onPress={interact(() => onSkip(-10))} accessibilityLabel="Back 10 seconds" className="h-12 w-12 items-center justify-center">
              <RotateCcw size={30} color={colors.white} strokeWidth={1.7} />
              <AppText variant="caption" tone="white" className="absolute text-[9px]" style={{ marginTop: 2 }}>
                10
              </AppText>
            </Touchable>
            <Touchable haptic scaleTo={0.85} onPress={interact(onToggle)} accessibilityLabel={playing ? 'Pause' : 'Play'} className="h-16 w-16 items-center justify-center rounded-full bg-white/15">
              {playing ? <Pause size={30} color={colors.white} fill={colors.white} /> : <Play size={30} color={colors.white} fill={colors.white} style={{ marginLeft: 3 }} />}
            </Touchable>
            <Touchable haptic scaleTo={0.85} onPress={interact(() => onSkip(10))} accessibilityLabel="Forward 10 seconds" className="h-12 w-12 items-center justify-center">
              <RotateCw size={30} color={colors.white} strokeWidth={1.7} />
              <AppText variant="caption" tone="white" className="absolute text-[9px]" style={{ marginTop: 2 }}>
                10
              </AppText>
            </Touchable>
          </View>
          <View className="absolute bottom-1 left-3 right-1 flex-row items-center gap-2">
            <AppText variant="caption" tone="white" style={{ fontVariant: ['tabular-nums'] }}>
              {formatClock(position)}
            </AppText>
            <View className="flex-1">
              <Seekbar compact position={position} duration={duration} onSeek={(s) => { onSeek(s); scheduleHide(); }} />
            </View>
            <AppText variant="caption" tone="secondary" style={{ fontVariant: ['tabular-nums'] }}>
              {formatClock(duration)}
            </AppText>
            <IconButton icon={expanded ? Minimize2 : Maximize2} size={18} color={colors.white} onPress={interact(onToggleExpanded)} accessibilityLabel={expanded ? 'Exit theatre mode' : 'Theatre mode'} />
          </View>
        </Animated.View>
      ) : null}
    </Pressable>
  );
});
