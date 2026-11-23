import { create } from 'zustand';
import { createPodcastEngine } from '@/services/playback/podcastEngine';
import type { Broadcaster } from '@/types/broadcaster';
import type { Podcast } from '@/types/models';
import { podcastSeconds } from '@/utils/format';
import { isClip, isVideo, ownerName, playbackUrl } from '@/utils/podcast';
import { episodesApi } from './api/episodesApi';
import { reelsApi } from './api/reelsApi';
import { store } from './index';
import { useLibraryStore } from './libraryStore';

export type NowPlaying = { kind: 'podcast'; podcast: Podcast } | { kind: 'live'; broadcaster: Broadcaster };

export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2] as const;
export type PlaybackRate = (typeof PLAYBACK_RATES)[number];

interface PlayerState {
  nowPlaying: NowPlaying | null;
  /** The swipeable queue. Grows automatically as the listener nears the end. */
  queue: Podcast[];
  /** Position of `nowPlaying` in `queue` (-1 for live). */
  index: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  rate: PlaybackRate;
  loadingMore: boolean;
  hasMore: boolean;
  /** Listener chose "Audio" for video episodes: hide the picture, keep the sound. Sticky for the session. */
  audioOnly: boolean;

  playPodcast: (podcast: Podcast, queue?: Podcast[]) => void;
  playAt: (index: number) => void;
  playLive: (broadcaster: Broadcaster) => void;
  toggle: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  skipBy: (seconds: number) => void;
  next: () => void;
  previous: () => void;
  setRate: (rate: PlaybackRate) => void;
  setAudioOnly: (audioOnly: boolean) => void;
  /** Reload the current podcast from where it stopped (after a network / playback error). */
  retry: () => void;
  stop: () => void;
}

const engine = createPodcastEngine();

/** The shared video player for `<VideoView>` on the player screen (video episodes only). */
export const podcastVideoPlayer = engine.video.player;
const SAVE_EVERY_SEC = 5;
/** Start fetching more when this many items (or fewer) are left after the current one. */
const PREFETCH_AT = 2;

/**
 * Podcast + live radio playback (the mini-player and player screen follow this store).
 * The queue is endless: near its end, more podcasts are pulled from the feed
 * (`/podcast/all`, paged — the same idea as Flutter's podcast feed).
 */
/** View count + server watch history. Signed-in listeners and creators only; a failure never affects playback. */
const recordView = (id: string) => {
  if (!store.getState().auth.accessToken) return;
  const request = store.dispatch(reelsApi.endpoints.recordClipView.initiate(id));
  void request
    .unwrap()
    .catch(() => undefined)
    .finally(() => request.reset()); // fire-and-forget: don't keep one cache entry per play
};

export const usePlayerStore = create<PlayerState>()((set, get) => {
  let lastSaved = 0;
  let feedPage = 0;

  engine.onProgress((position) => {
    set({ position });
    const np = get().nowPlaying;
    if (np?.kind === 'podcast' && Math.abs(position - lastSaved) >= SAVE_EVERY_SEC) {
      lastSaved = position;
      useLibraryStore.getState().saveProgress(np.podcast._id, position);
    }
  });
  // Lock screen / headphones / a phone call paused or resumed playback.
  engine.onPlayingChange((playing) => {
    if (get().nowPlaying?.kind === 'podcast' && get().isPlaying !== playing) set({ isPlaying: playing });
  });
  engine.onDuration((duration) => {
    if (get().nowPlaying?.kind === 'podcast') set({ duration });
  });
  engine.onEnded(() => {
    const np = get().nowPlaying;
    if (np?.kind === 'podcast') useLibraryStore.getState().saveProgress(np.podcast._id, 0);
    set({ isPlaying: false });
    get().next(); // autoplay the next podcast
  });

  /** Append the next feed page, skipping clips and anything already queued. */
  const loadMore = async () => {
    const { loadingMore, hasMore } = get();
    if (loadingMore || !hasMore) return;
    set({ loadingMore: true });
    try {
      // Keep paging until something new turns up or the feed runs out.
      for (let tries = 0; tries < 5; tries++) {
        feedPage += 1;
        const request = store.dispatch(episodesApi.endpoints.getEpisodePage.initiate({ sort: 'newest', page: feedPage }));
        const page = await request.unwrap().finally(() => request.unsubscribe());
        const queued = new Set(get().queue.map((p) => p._id));
        const fresh = page.result.filter((p) => !isClip(p) && !queued.has(p._id));
        const exhausted = feedPage >= page.meta.totalPage;
        if (fresh.length) {
          set((s) => ({ queue: [...s.queue, ...fresh], hasMore: !exhausted }));
          break;
        }
        if (exhausted) {
          set({ hasMore: false });
          break;
        }
      }
    } catch {
      feedPage = Math.max(0, feedPage - 1); // retry this page next time
    } finally {
      set({ loadingMore: false });
    }
  };

  const maybeLoadMore = () => {
    const { queue, index } = get();
    if (queue.length - 1 - index <= PREFETCH_AT) void loadMore();
  };

  const startAt = (index: number, countView = true) => {
    const podcast = get().queue[index];
    if (!podcast) return;
    const duration = podcastSeconds(podcast);
    const saved = useLibraryStore.getState().progress[podcast._id] ?? 0;
    const from = saved > 0 && saved < duration - 10 ? saved : 0;
    lastSaved = from;
    engine.load({
      url: playbackUrl(podcast),
      durationSec: duration,
      isLive: false,
      video: isVideo(podcast),
      startAt: from,
      meta: { title: podcast.title, artist: ownerName(podcast), artworkUrl: podcast.coverImage ?? undefined },
    });
    engine.setRate(get().rate);
    engine.play();
    useLibraryStore.getState().recordPlay(podcast._id);
    if (countView) recordView(podcast._id);
    set({ nowPlaying: { kind: 'podcast', podcast }, index, duration, position: from, isPlaying: true });
    maybeLoadMore();
  };

  return {
    nowPlaying: null,
    queue: [],
    index: -1,
    isPlaying: false,
    position: 0,
    duration: 0,
    rate: 1,
    loadingMore: false,
    hasMore: true,
    audioOnly: false,

    playPodcast: (podcast, queue) => {
      const current = get().nowPlaying;
      if (current?.kind === 'podcast' && current.podcast._id === podcast._id) {
        if (!get().isPlaying) get().toggle();
        return;
      }
      const list = (queue?.length ? queue : [podcast]).filter((p) => !isClip(p));
      const found = list.findIndex((p) => p._id === podcast._id);
      const nextQueue = found >= 0 ? list : [podcast, ...list];
      feedPage = 0;
      set({ queue: nextQueue, hasMore: true });
      startAt(found >= 0 ? found : 0);
    },
    playAt: (index) => {
      if (index === get().index) return;
      startAt(index);
    },
    playLive: (broadcaster) => {
      const current = get().nowPlaying;
      if (current?.kind === 'live' && current.broadcaster.id === broadcaster.id) {
        if (!get().isPlaying) get().toggle();
        return;
      }
      const elapsed = broadcaster.live ? (Date.now() - new Date(broadcaster.live.session_started_at).getTime()) / 1000 : 0;
      engine.load({ durationSec: 0, isLive: true, startAt: elapsed });
      engine.play();
      set({ nowPlaying: { kind: 'live', broadcaster }, queue: [], index: -1, duration: 0, position: elapsed, isPlaying: true });
    },
    toggle: () => {
      if (!get().nowPlaying) return;
      if (get().isPlaying) engine.pause();
      else engine.play();
      set((s) => ({ isPlaying: !s.isPlaying }));
    },
    pause: () => {
      engine.pause();
      set({ isPlaying: false });
    },
    seek: (seconds) => engine.seek(seconds),
    skipBy: (seconds) => engine.seek(get().position + seconds),
    next: () => {
      const { nowPlaying, queue, index } = get();
      if (nowPlaying?.kind !== 'podcast') return;
      if (index + 1 < queue.length) startAt(index + 1);
      else void loadMore().then(() => get().index + 1 < get().queue.length && startAt(get().index + 1));
    },
    previous: () => {
      const { nowPlaying, index, position } = get();
      if (nowPlaying?.kind !== 'podcast') return;
      // Like most players: restart the current podcast first, then step back.
      if (position > 5 || index <= 0) engine.seek(0);
      else startAt(index - 1);
    },
    setRate: (rate) => {
      engine.setRate(rate);
      set({ rate });
    },
    // Same player either way (see expoVideoEngine), so switching is instant and keeps the position.
    setAudioOnly: (audioOnly) => set({ audioOnly }),
    retry: () => {
      const { nowPlaying, index, position } = get();
      if (nowPlaying?.kind !== 'podcast') return;
      useLibraryStore.getState().saveProgress(nowPlaying.podcast._id, position);
      startAt(index, false);
    },
    stop: () => {
      engine.pause();
      set({ nowPlaying: null, isPlaying: false, position: 0, duration: 0, queue: [], index: -1 });
    },
  };
});

export const useIsCurrent = (id: string) =>
  usePlayerStore((s) => (s.nowPlaying?.kind === 'podcast' ? s.nowPlaying.podcast._id === id : s.nowPlaying?.kind === 'live' && s.nowPlaying.broadcaster.id === id));
