import { Check, Mic, Pause, RotateCcw, Square } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootScreenProps } from '@/app/navigation/types';
import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { IconButton } from '@/components/common/IconButton';
import { Touchable } from '@/components/common/Touchable';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { colors, GUTTER, shadow } from '@/theme';
import { formatClock } from '@/utils/format';

type Phase = 'idle' | 'recording' | 'paused' | 'done';
const BARS = 48;

const WaveBar = ({ level, active }: { level: number; active: boolean }) => {
  const style = useAnimatedStyle(() => ({ height: withTiming(6 + level * 70, { duration: 180 }) }));
  return <Animated.View style={[{ width: 3, borderRadius: 2, backgroundColor: active ? colors.brand[500] : colors.ink[500] }, style]} />;
};

/**
 * Recorder UI. Recording is simulated; wire expo-audio's recorder behind the
 * same phase machine to capture real audio.
 */
export function RecordAudioScreen({ navigation }: RootScreenProps<'RecordAudio'>) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('idle');
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array.from({ length: BARS }, () => 0.05));

  useEffect(() => {
    if (phase !== 'recording') return;
    const t = setInterval(() => {
      setSeconds((s) => s + 0.2);
      setLevels((prev) => [...prev.slice(1), 0.15 + Math.random() * 0.85]);
    }, 200);
    return () => clearInterval(t);
  }, [phase]);

  const whole = Math.floor(seconds);
  const hint = useMemo(
    () => ({ idle: 'Tap to start recording', recording: 'Recording…', paused: 'Paused', done: 'Recording ready' })[phase],
    [phase],
  );

  const reset = () => {
    setPhase('idle');
    setSeconds(0);
    setLevels(Array.from({ length: BARS }, () => 0.05));
  };

  return (
    <Screen>
      <ScreenHeader back="down" title="Record audio" />
      <View className="flex-1 justify-between" style={{ paddingHorizontal: GUTTER, paddingBottom: insets.bottom + 24 }}>
        <View className="items-center pt-16">
          <AppText variant="overline" tone={phase === 'recording' ? 'live' : 'muted'}>
            {hint}
          </AppText>
          <AppText variant="display" className="mt-3 text-[56px] leading-[64px]" style={{ fontVariant: ['tabular-nums'] }}>
            {formatClock(whole)}
          </AppText>
          <View className="mt-12 h-20 flex-row items-center gap-[3px]" accessibilityElementsHidden>
            {levels.map((l, i) => (
              <WaveBar key={i} level={l} active={phase === 'recording'} />
            ))}
          </View>
        </View>

        <View className="items-center">
          <View className="flex-row items-center gap-10">
            <IconButton icon={RotateCcw} variant="surface" onPress={reset} accessibilityLabel="Discard and start over" color={phase === 'idle' ? colors.text.faint : colors.text.primary} />
            <Touchable
              haptic
              scaleTo={0.9}
              onPress={() => setPhase((p) => (p === 'recording' ? 'paused' : 'recording'))}
              accessibilityLabel={phase === 'recording' ? 'Pause recording' : 'Start recording'}
              className="h-24 w-24 items-center justify-center rounded-full border-4 border-live/40 bg-live"
              style={shadow.glow}
            >
              {phase === 'recording' ? <Pause size={34} color={colors.white} fill={colors.white} /> : <Mic size={36} color={colors.white} />}
            </Touchable>
            <IconButton
              icon={Square}
              fill
              variant="surface"
              onPress={() => seconds > 1 && setPhase('done')}
              accessibilityLabel="Stop recording"
              color={seconds > 1 ? colors.text.primary : colors.text.faint}
            />
          </View>
          {phase === 'done' ? (
            <Button
              label="Use this recording"
              icon={Check}
              size="lg"
              fullWidth
              className="mt-10"
              onPress={() => navigation.replace('Upload', { mediaType: 'audio', recording: { uri: `file:///recordings/${Date.now()}.m4a`, durationSeconds: whole } })}
            />
          ) : (
            <AppText variant="caption" tone="faint" className="mt-10">
              Find a quiet room and hold the phone 20–30 cm away.
            </AppText>
          )}
        </View>
      </View>
    </Screen>
  );
}
