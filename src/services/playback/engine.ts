/**
 * Playback engine contract. The UI and the player store only talk to this
 * interface, so the mock below can be swapped for a real implementation
 * (react-native-track-player / expo-audio for audio, 100ms for live) later.
 */
export interface PlaybackSource {
  /** `hlsUrl ?? podcast_url`, or a live stream URL */
  url?: string;
  durationSec: number;
  isLive: boolean;
  startAt?: number;
}

export interface PlaybackEngine {
  load(source: PlaybackSource): void;
  play(): void;
  pause(): void;
  seek(positionSec: number): void;
  setRate(rate: number): void;
  release(): void;
  onProgress(listener: (positionSec: number) => void): () => void;
  onEnded(listener: () => void): () => void;
}

const TICK_MS = 500;

/** Simulates playback with a timer. No media is fetched. */
export const createMockEngine = (): PlaybackEngine => {
  let timer: ReturnType<typeof setInterval> | null = null;
  let position = 0;
  let duration = 0;
  let rate = 1;
  let live = false;
  const progress = new Set<(p: number) => void>();
  const ended = new Set<() => void>();

  const emit = () => progress.forEach((l) => l(position));
  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };

  return {
    load(source) {
      stop();
      position = source.startAt ?? 0;
      duration = source.durationSec;
      live = source.isLive;
      emit();
    },
    play() {
      if (timer) return;
      timer = setInterval(() => {
        position += (TICK_MS / 1000) * (live ? 1 : rate);
        if (!live && position >= duration) {
          position = duration;
          stop();
          emit();
          ended.forEach((l) => l());
          return;
        }
        emit();
      }, TICK_MS);
    },
    pause: stop,
    seek(p) {
      position = Math.max(0, live ? p : Math.min(p, duration));
      emit();
    },
    setRate(r) {
      rate = r;
    },
    release() {
      stop();
      progress.clear();
      ended.clear();
    },
    onProgress(listener) {
      progress.add(listener);
      return () => progress.delete(listener);
    },
    onEnded(listener) {
      ended.add(listener);
      return () => ended.delete(listener);
    },
  };
};
