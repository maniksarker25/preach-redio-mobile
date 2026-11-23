import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioStatus } from 'expo-audio';
import { IS_NATIVE_BUILD } from '@/utils/runtime';
import { createMockEngine, type PlaybackEngine, type PlaybackSource } from './engine';

const UPDATE_INTERVAL_MS = 500;

/**
 * Lock-screen controls need the expo-audio playback service, which only exists in a build made with our
 * config plugin (dev build / store build). Expo Go doesn't have it and logs an error on every play.
 */
const LOCK_SCREEN_SUPPORTED = IS_NATIVE_BUILD;

/**
 * Background audio with lock-screen controls. Lock-screen controls need `doNotMix`;
 * re-applied on every load because the recorder screen changes the audio mode.
 */
const applyPlaybackMode = () => setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: IS_NATIVE_BUILD, interruptionMode: 'doNotMix', allowsRecording: false }).catch(() => undefined);

/**
 * Real podcast playback on expo-audio (AVPlayer / ExoPlayer). Plays `hlsUrl` or the original
 * upload; video episodes play their audio track, as in the Flutter app's player.
 * Sources without a URL (live radio, until 100ms is wired) fall back to the timer engine.
 */
export const createExpoAudioEngine = (): PlaybackEngine => {
  const timer = createMockEngine();
  let player: AudioPlayer | null = null;
  /** True while the current source plays on `player` (false → `timer`). */
  let usingPlayer = false;
  /** `startAt` waits until the media is loaded; seeking earlier is ignored by the native players. */
  let pendingSeek: number | null = null;
  let lastPlaying = false;
  let lastDuration = 0;

  const progress = new Set<(p: number) => void>();
  const ended = new Set<() => void>();
  const playingChange = new Set<(playing: boolean) => void>();
  const durationChange = new Set<(d: number) => void>();

  // The timer only drives live radio; forward its events while it is the active engine.
  timer.onProgress((p) => !usingPlayer && progress.forEach((l) => l(p)));
  timer.onEnded(() => !usingPlayer && ended.forEach((l) => l()));

  const onStatus = (s: AudioStatus) => {
    if (!usingPlayer) return;
    if (s.isLoaded && pendingSeek !== null) {
      const to = pendingSeek;
      pendingSeek = null;
      void player?.seekTo(to);
      return;
    }
    if (pendingSeek === null) progress.forEach((l) => l(s.currentTime));
    if (s.duration > 0 && Math.abs(s.duration - lastDuration) >= 1) {
      lastDuration = s.duration;
      durationChange.forEach((l) => l(s.duration));
    }
    if (s.didJustFinish) {
      lastPlaying = false;
      ended.forEach((l) => l());
      return;
    }
    // Buffering also reports `playing: false`; only a settled state is a real play/pause.
    if (s.isLoaded && !s.isBuffering && s.playing !== lastPlaying) {
      lastPlaying = s.playing;
      playingChange.forEach((l) => l(s.playing));
    }
  };

  const ensurePlayer = (): AudioPlayer => {
    if (!player) {
      player = createAudioPlayer(null, { updateInterval: UPDATE_INTERVAL_MS });
      player.addListener('playbackStatusUpdate', onStatus);
    }
    return player;
  };

  const loadUrl = (source: PlaybackSource & { url: string }) => {
    const p = ensurePlayer();
    void applyPlaybackMode();
    pendingSeek = source.startAt && source.startAt > 0 ? source.startAt : null;
    lastPlaying = false;
    lastDuration = 0;
    p.replace({ uri: source.url });
    if (source.meta && LOCK_SCREEN_SUPPORTED) {
      try {
        p.setActiveForLockScreen(true, source.meta, { showSeekForward: true, showSeekBackward: true });
      } catch {
        /* lock-screen controls are optional (e.g. Expo Go on some devices) */
      }
    }
  };

  return {
    load(source) {
      if (source.url) {
        timer.pause();
        usingPlayer = true;
        loadUrl({ ...source, url: source.url });
        return;
      }
      if (usingPlayer) {
        player?.pause();
        if (LOCK_SCREEN_SUPPORTED)
          try {
            player?.clearLockScreenControls();
          } catch {
            /* not active */
          }
      }
      usingPlayer = false;
      timer.load(source);
    },
    play() {
      if (usingPlayer) player?.play();
      else timer.play();
    },
    pause() {
      if (usingPlayer) player?.pause();
      else timer.pause();
    },
    seek(positionSec) {
      if (!usingPlayer) return timer.seek(positionSec);
      const to = Math.max(0, positionSec);
      if (pendingSeek !== null) pendingSeek = to;
      else void player?.seekTo(to);
      progress.forEach((l) => l(to)); // move the seekbar now, not on the next tick
    },
    setRate(rate) {
      timer.setRate(rate);
      player?.setPlaybackRate(rate);
    },
    release() {
      timer.release();
      player?.remove();
      player = null;
      progress.clear();
      ended.clear();
      playingChange.clear();
      durationChange.clear();
    },
    onProgress(listener) {
      progress.add(listener);
      return () => progress.delete(listener);
    },
    onEnded(listener) {
      ended.add(listener);
      return () => ended.delete(listener);
    },
    onPlayingChange(listener) {
      playingChange.add(listener);
      return () => playingChange.delete(listener);
    },
    onDuration(listener) {
      durationChange.add(listener);
      return () => durationChange.delete(listener);
    },
  };
};
