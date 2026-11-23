import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface HistoryEntry {
  podcastId: string;
  playedAt: string;
}

interface LibraryState {
  liked: Record<string, true>;
  bookmarked: Record<string, true>;
  history: HistoryEntry[];
  /** Saved playback position (seconds) per podcast, for "Continue listening". */
  progress: Record<string, number>;
  /** Most recent first, max 8. */
  recentSearches: string[];

  toggleLike: (id: string) => void;
  toggleBookmark: (id: string) => void;
  recordPlay: (id: string) => void;
  saveProgress: (id: string, seconds: number) => void;
  clearHistory: () => void;
  addRecentSearch: (term: string) => void;
  removeRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
}

const toggle = (map: Record<string, true>, id: string) => {
  const next = { ...map };
  if (next[id]) delete next[id];
  else next[id] = true;
  return next;
};

const HISTORY_LIMIT = 100;

/**
 * Listener's on-device library: likes and bookmarks for screens still on mock data, the local play log,
 * resume positions and recent searches. Playlists, favorites and history live on the server
 * (`store/api/playlistsApi.ts`, `favoritesApi.ts`, `historyApi.ts`).
 */
export const useLibraryStore = create<LibraryState>()(
  persist(
    (set) => ({
      liked: { 'pod_grace-enough': true, 'clip_holy-ground': true },
      bookmarked: { pod_anchored: true, 'pod_worship-night': true, 'pod_romans-8': true },
      history: [
        { podcastId: 'pod_mustard-seed', playedAt: new Date(Date.now() - 3_600_000).toISOString() },
        { podcastId: 'pod_anchored', playedAt: new Date(Date.now() - 5_400_000).toISOString() },
        { podcastId: 'pod_morning-prayer', playedAt: new Date(Date.now() - 86_400_000).toISOString() },
        { podcastId: 'pod_lead-like-shepherd', playedAt: new Date(Date.now() - 2 * 86_400_000).toISOString() },
      ],
      progress: { 'pod_mustard-seed': 742, 'pod_lead-like-shepherd': 860, 'pod_morning-prayer': 310 },
      recentSearches: [],

      toggleLike: (id) => set((s) => ({ liked: toggle(s.liked, id) })),
      toggleBookmark: (id) => set((s) => ({ bookmarked: toggle(s.bookmarked, id) })),
      recordPlay: (id) =>
        set((s) => ({
          history: [{ podcastId: id, playedAt: new Date().toISOString() }, ...s.history.filter((h) => h.podcastId !== id)].slice(0, HISTORY_LIMIT),
        })),
      saveProgress: (id, seconds) => set((s) => ({ progress: { ...s.progress, [id]: Math.floor(seconds) } })),
      clearHistory: () => set({ history: [] }),
      addRecentSearch: (term) =>
        set((s) => {
          const t = term.trim();
          if (t.length < 2) return s;
          return { recentSearches: [t, ...s.recentSearches.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 8) };
        }),
      removeRecentSearch: (term) => set((s) => ({ recentSearches: s.recentSearches.filter((x) => x !== term) })),
      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    { name: 'library-v1', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
