import { createVideoPlayer, type VideoPlayer } from 'expo-video';
import { IS_NATIVE_BUILD } from '@/utils/runtime';
import type { PlaybackEngine } from './engine';

export interface VideoPlaybackEngine extends PlaybackEngine {
  /** The shared player for `<VideoView player={…}>`. One player for the app, so playback survives leaving the screen. */
  readonly player: VideoPlayer;
}

/**
 * Video episodes on expo-video. The same player plays both "Video" and "Audio" modes: audio mode
 * only hides the picture, so switching is instant and keeps the position (no reload).
 * It keeps playing in the background (as audio) when the player screen closes or the app is minimised.
 */
export const createExpoVideoEngine = (): VideoPlaybackEngine => {
  const player = createVideoPlayer(null);
  player.timeUpdateEventInterval = 0.5;
  player.staysActiveInBackground = IS_NATIVE_BUILD;
  player.showNowPlayingNotification = IS_NATIVE_BUILD;
  player.audioMixingMode = 'doNotMix';

  /** `startAt` waits until the source has loaded; seeking an unloaded item is ignored. */
  let pendingSeek: number | null = null;
  let lastDuration = 0;
  const progress = new Set<(p: number) => void>();
  const ended = new Set<() => void>();
  const playingChange = new Set<(playing: boolean) => void>();
  const durationChange = new Set<(d: number) => void>();

  player.addListener('sourceLoad', ({ duration }) => {
    if (pendingSeek !== null) {
      player.currentTime = pendingSeek;
      pendingSeek = null;
    }
    if (duration > 0 && Math.abs(duration - lastDuration) >= 1) {
      lastDuration = duration;
      durationChange.forEach((l) => l(duration));
    }
  });
  player.addListener('timeUpdate', ({ currentTime }) => {
    if (pendingSeek === null) progress.forEach((l) => l(currentTime));
  });
  player.addListener('playingChange', ({ isPlaying }) => playingChange.forEach((l) => l(isPlaying)));
  player.addListener('playToEnd', () => ended.forEach((l) => l()));

  return {
    player,
    load(source) {
      pendingSeek = source.startAt && source.startAt > 0 ? source.startAt : null;
      lastDuration = 0;
      player.replace(source.url ? { uri: source.url, metadata: source.meta ? { title: source.meta.title, artist: source.meta.artist, artwork: source.meta.artworkUrl } : undefined } : null, true);
    },
    play: () => player.play(),
    pause: () => player.pause(),
    seek(positionSec) {
      const to = Math.max(0, positionSec);
      if (pendingSeek !== null) pendingSeek = to;
      else player.currentTime = to;
      progress.forEach((l) => l(to)); // move the seekbar now, not on the next tick
    },
    setRate(rate) {
      player.playbackRate = rate;
    },
    release() {
      player.release();
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
