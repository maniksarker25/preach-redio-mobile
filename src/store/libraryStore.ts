import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { playlists as seedPlaylists } from '@/services/mock/collections';
import type { Playlist } from '@/types/models';

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
  playlists: Playlist[];
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
  createPlaylist: (input: { name: string; description: string; podcastIds?: string[] }) => Playlist;
  updatePlaylist: (id: string, patch: Partial<Pick<Playlist, 'name' | 'description'>>) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (playlistId: string, podcastId: string) => void;
  removeFromPlaylist: (playlistId: string, podcastId: string) => void;
}

const toggle = (map: Record<string, true>, id: string) => {
  const next = { ...map };
  if (next[id]) delete next[id];
  else next[id] = true;
  return next;
};

const HISTORY_LIMIT = 100;

/**
 * Listener's library. Optimistic local state today; each action maps 1:1 to an
 * endpoint (like-unlike, add-delete-bookmark, playlist CRUD) for later sync.
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
      playlists: seedPlaylists,
      recentSearches: [],

      toggleLike: (id) => set((s) => ({ liked: toggle(s.liked, id) })),
      toggleBookmark: (id) => set((s) => ({ bookmarked: toggle(s.bookmarked, id) })),
      recordPlay: (id) =>
        set((s) => ({
          history: [{ podcastId: id, playedAt: new Date().toISOString() }, ...s.history.filter((h) => h.podcastId !== id)].slice(
            0,
            HISTORY_LIMIT,
          ),
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
      createPlaylist: ({ name, description, podcastIds = [] }) => {
        const playlist: Playlist = {
          _id: `pl_${Date.now()}`,
          user: 'nu_me',
          userType: 'NormalUser',
          name,
          description,
          tags: [],
          podcasts: podcastIds,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ playlists: [playlist, ...s.playlists] }));
        return playlist;
      },
      updatePlaylist: (id, patch) =>
        set((s) => ({ playlists: s.playlists.map((p) => (p._id === id ? { ...p, ...patch } : p)) })),
      deletePlaylist: (id) => set((s) => ({ playlists: s.playlists.filter((p) => p._id !== id) })),
      addToPlaylist: (playlistId, podcastId) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p._id === playlistId && !p.podcasts.includes(podcastId) ? { ...p, podcasts: [...p.podcasts, podcastId] } : p,
          ),
        })),
      removeFromPlaylist: (playlistId, podcastId) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p._id === playlistId ? { ...p, podcasts: p.podcasts.filter((id) => id !== podcastId) } : p,
          ),
        })),
    }),
    { name: 'library-v1', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
