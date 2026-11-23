import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { Check, Mic, MicOff, Pause, Play, RotateCcw, Square } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootScreenProps } from '@/app/navigation/types';
import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { IconButton } from '@/components/common/IconButton';
import { EmptyState } from '@/components/common/States';
import { Touchable } from '@/components/common/Touchable';
import { Screen } from '@/components/layouts/Screen';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { ProgressLine } from '@/components/media/Seekbar';
import { usePlayerStore } from '@/store/playerStore';
import { colors, GUTTER, shadow } from '@/theme';
import { formatClock } from '@/utils/format';

type Phase = 'idle' | 'recording' | 'paused' | 'done';
type Permission = 'unknown' | 'granted' | 'denied';

const BARS = 48;
const SILENT = 0.04;
/** Recordings shorter than this can't be published. */
const MIN_SECONDS = 3;
/** Safety cap (3 h) so a forgotten recorder doesn't fill the phone. */
const MAX_SECONDS = 3 * 60 * 60;

const RECORDING_OPTIONS = { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true };

/** Metering is in dBFS (-160 … 0); speech sits around -50 … -10. */
const levelFromDb = (db?: number) => (db === undefined ? SILENT : Math.max(SILENT, Math.min(1, (db + 55) / 50)));

const WaveBar = ({ level, active }: { level: number; active: boolean }) => {
  const style = useAnimatedStyle(() => ({ height: withTiming(6 + level * 70, { duration: 120 }) }));
  return <Animated.View style={[{ width: 3, borderRadius: 2, backgroundColor: active ? colors.brand[400] : colors.ink[500] }, style]} />;
};

/** Plays back the finished take before it's published. */
function TakePreview({ uri }: { uri: string }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const duration = status.duration || 0;

  const toggle = () => {
    if (status.playing) player.pause();
    else {
      if (duration && status.currentTime >= duration - 0.25) void player.seekTo(0);
      player.play();
    }
  };

  return (
    <View className="w-full flex-row items-center gap-3.5 rounded-xl border border-line bg-ink-800 p-3.5">
      <Touchable haptic onPress={toggle} className="h-11 w-11 items-center justify-center rounded-full bg-white" accessibilityLabel={status.playing ? 'Pause preview' : 'Play preview'}>
        {status.playing ? <Pause size={18} color={colors.black} fill={colors.black} /> : <Play size={18} color={colors.black} fill={colors.black} style={{ marginLeft: 2 }} />}
      </Touchable>
      <View className="flex-1 gap-1.5">
        <ProgressLine ratio={duration ? status.currentTime / duration : 0} height={4} />
        <AppText variant="caption" tone="muted" style={{ fontVariant: ['tabular-nums'] }}>
          {formatClock(Math.floor(status.currentTime))} / {formatClock(Math.round(duration))}
        </AppText>
      </View>
    </View>
  );
}

/**
 * Records a message with the microphone (expo-audio, AAC .m4a), with live input
 * levels, pause/resume, a playback check, then hands the file to the upload form.
 */
export function RecordAudioScreen({ navigation }: RootScreenProps<'RecordAudio'>) {
  const insets = useSafeAreaInsets();
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const state = useAudioRecorderState(recorder, 100);
  const pausePlayer = usePlayerStore((s) => s.pause);

  const [permission, setPermission] = useState<Permission>('unknown');
  const [phase, setPhase] = useState<Phase>('idle');
  const [take, setTake] = useState<{ uri: string; seconds: number } | null>(null);
  const [levels, setLevels] = useState<number[]>(() => Array.from({ length: BARS }, () => SILENT));
  const [busy, setBusy] = useState(false);
  const finishing = useRef(false);

  const seconds = phase === 'done' && take ? take.seconds : state.durationMillis / 1000;

  // Ask for the microphone up front; nothing else in the app should be playing while recording.
  useEffect(() => {
    pausePlayer();
    void requestRecordingPermissionsAsync().then(({ granted }) => setPermission(granted ? 'granted' : 'denied'));
    return () => {
      void setAudioModeAsync({ allowsRecording: false });
    };
  }, [pausePlayer]);

  // Live level bars: one new bar per recorder status tick (React's "adjust state on prop change" pattern).
  const [lastTick, setLastTick] = useState(0);
  if (state.isRecording && state.durationMillis !== lastTick) {
    setLastTick(state.durationMillis);
    setLevels((prev) => [...prev.slice(1), levelFromDb(state.metering)]);
  }

  const stop = useCallback(async () => {
    if (finishing.current) return;
    finishing.current = true;
    setBusy(true);
    try {
      const secs = recorder.currentTime || state.durationMillis / 1000;
      await recorder.stop();
      // Back to playback mode so the preview uses the loudspeaker on iOS.
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const uri = recorder.uri;
      if (!uri) throw new Error('No recording file');
      setTake({ uri, seconds: Math.round(secs) });
      setPhase('done');
    } catch {
      Alert.alert('Recording failed', 'Something went wrong while saving your recording. Please try again.');
      setPhase('idle');
    } finally {
      finishing.current = false;
      setBusy(false);
    }
  }, [recorder, state.durationMillis]);

  // Stop automatically at the length cap.
  useEffect(() => {
    if (!state.isRecording || state.durationMillis / 1000 < MAX_SECONDS) return;
    const t = setTimeout(() => void stop(), 0);
    return () => clearTimeout(t);
  }, [state.durationMillis, state.isRecording, stop]);

  const start = async () => {
    setBusy(true);
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setPhase('recording');
    } catch {
      Alert.alert('Can’t start recording', 'The microphone is unavailable. Close other apps using it and try again.');
    } finally {
      setBusy(false);
    }
  };

  const toggle = () => {
    if (busy) return;
    if (phase === 'idle') void start();
    else if (phase === 'recording') {
      recorder.pause();
      setPhase('paused');
    } else if (phase === 'paused') {
      recorder.record();
      setPhase('recording');
    }
  };

  const discard = useCallback(async () => {
    if (state.isRecording || phase === 'paused') await recorder.stop().catch(() => undefined);
    setTake(null);
    setPhase('idle');
    setLevels(Array.from({ length: BARS }, () => SILENT));
  }, [phase, recorder, state.isRecording]);

  const confirmDiscard = () =>
    Alert.alert('Discard recording?', 'This take will be deleted.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => void discard() },
    ]);

  // Leaving with an unsaved take asks first.
  const hasTake = phase !== 'idle';
  const leaving = useRef(false);
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (!hasTake || leaving.current) return;
        e.preventDefault();
        Alert.alert('Discard recording?', 'You’ll lose this recording if you leave now.', [
          { text: 'Keep recording', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              leaving.current = true;
              void discard().finally(() => navigation.dispatch(e.data.action));
            },
          },
        ]);
      }),
    [navigation, hasTake, discard],
  );

  const useTake = () => {
    if (!take) return;
    if (take.seconds < MIN_SECONDS) {
      Alert.alert('Too short', `Record at least ${MIN_SECONDS} seconds.`);
      return;
    }
    leaving.current = true;
    navigation.replace('Upload', { mediaType: 'audio', recording: { uri: take.uri, durationSeconds: take.seconds } });
  };

  if (permission === 'denied') {
    return (
      <Screen>
        <ScreenHeader back="down" title="Record audio" />
        <EmptyState
          icon={MicOff}
          title="Microphone access needed"
          message="Allow Preach Radio to use the microphone in Settings to record your message."
          actionLabel="Open Settings"
          onAction={() => void Linking.openSettings()}
        />
      </Screen>
    );
  }

  const hint = { idle: 'Tap to start recording', recording: 'Recording', paused: 'Paused', done: 'Recording ready' }[phase];
  const canStop = phase === 'recording' || phase === 'paused';

  return (
    <Screen>
      <ScreenHeader back="down" title="Record audio" />
      <View className="flex-1 justify-between" style={{ paddingHorizontal: GUTTER, paddingBottom: insets.bottom + 24 }}>
        <View className="items-center pt-14">
          <View className="flex-row items-center gap-2">
            {phase === 'recording' ? <View className="h-2 w-2 rounded-full bg-live" /> : null}
            <AppText variant="overline" tone={phase === 'recording' ? 'live' : 'muted'}>
              {hint}
            </AppText>
          </View>
          <AppText variant="display" className="mt-3 text-[56px] leading-[64px]" style={{ fontVariant: ['tabular-nums'] }}>
            {formatClock(Math.floor(seconds))}
          </AppText>
          <View className="mt-12 h-20 flex-row items-center gap-[3px]" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {levels.map((l, i) => (
              <WaveBar key={i} level={l} active={phase === 'recording'} />
            ))}
          </View>
          {phase === 'done' && take ? (
            <View className="mt-10 w-full">
              <TakePreview uri={take.uri} />
            </View>
          ) : null}
        </View>

        <View className="items-center">
          {phase === 'done' ? (
            <View className="w-full gap-3">
              <Button label="Use this recording" icon={Check} size="lg" fullWidth onPress={useTake} />
              <Button label="Record again" icon={RotateCcw} variant="secondary" size="lg" fullWidth onPress={confirmDiscard} />
            </View>
          ) : (
            <>
              <View className="flex-row items-center gap-10">
                <IconButton
                  icon={RotateCcw}
                  variant="surface"
                  onPress={() => (canStop ? confirmDiscard() : undefined)}
                  accessibilityLabel="Discard and start over"
                  color={canStop ? colors.text.primary : colors.text.faint}
                />
                <Touchable
                  haptic
                  scaleTo={0.9}
                  onPress={toggle}
                  disabled={busy || permission !== 'granted'}
                  accessibilityLabel={phase === 'recording' ? 'Pause recording' : phase === 'paused' ? 'Resume recording' : 'Start recording'}
                  className="h-24 w-24 items-center justify-center rounded-full border-4 border-live/40 bg-live"
                  style={[shadow.glow, { opacity: permission === 'granted' ? 1 : 0.5 }]}
                >
                  {phase === 'recording' ? <Pause size={34} color={colors.white} fill={colors.white} /> : <Mic size={36} color={colors.white} />}
                </Touchable>
                <IconButton
                  icon={Square}
                  fill
                  variant="surface"
                  onPress={() => (canStop && seconds >= 1 ? void stop() : undefined)}
                  accessibilityLabel="Stop recording"
                  color={canStop && seconds >= 1 ? colors.text.primary : colors.text.faint}
                />
              </View>
              <AppText variant="caption" tone="faint" className="mt-10 text-center">
                {phase === 'idle' ? 'Find a quiet room and hold the phone 20–30 cm away.' : 'Tap ■ when you’re finished.'}
              </AppText>
            </>
          )}
        </View>
      </View>
    </Screen>
  );
}
