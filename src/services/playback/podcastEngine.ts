import type { PlaybackEngine, PlaybackSource } from './engine';
import { createExpoAudioEngine } from './expoAudioEngine';
import { createExpoVideoEngine, type VideoPlaybackEngine } from './expoVideoEngine';

/**
 * The player store's single engine: video episodes → expo-video, audio episodes and live radio → expo-audio
 * (which falls back to its timer for live). Only the active engine's events reach the store.
 */
export const createPodcastEngine = (): PlaybackEngine & { video: VideoPlaybackEngine } => {
  const audio = createExpoAudioEngine();
  const video = createExpoVideoEngine();
  let active: PlaybackEngine = audio;

  const progress = new Set<(p: number) => void>();
  const ended = new Set<() => void>();
  const playingChange = new Set<(playing: boolean) => void>();
  const durationChange = new Set<(d: number) => void>();

  for (const e of [audio, video]) {
    e.onProgress((p) => e === active && progress.forEach((l) => l(p)));
    e.onEnded(() => e === active && ended.forEach((l) => l()));
    e.onPlayingChange((playing) => e === active && playingChange.forEach((l) => l(playing)));
    e.onDuration((d) => e === active && durationChange.forEach((l) => l(d)));
  }

  return {
    video,
    load(source: PlaybackSource) {
      const next = source.video && source.url ? video : audio;
      if (next !== active) active.pause();
      active = next;
      next.load(source);
    },
    play: () => active.play(),
    pause: () => active.pause(),
    seek: (p) => active.seek(p),
    setRate(rate) {
      audio.setRate(rate);
      video.setRate(rate);
    },
    release() {
      audio.release();
      video.release();
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
