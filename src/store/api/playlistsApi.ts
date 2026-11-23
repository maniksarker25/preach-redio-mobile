import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { endpoints } from '@/services/api/endpoints';
import type { Paginated } from '@/types/api';
import type { Playlist, PlaylistDetail, Podcast } from '@/types/models';
import { fromPopulatedPodcast } from '@/utils/podcast';
import { baseApi } from './baseApi';

/** Playlists per page in "My playlist" and the add-to sheet. */
export const PLAYLISTS_PAGE_SIZE = 30;
/** Server-side cap (playlist.model.ts). */
export const PLAYLIST_MAX_PODCASTS = 500;

export interface PlaylistInput {
  name: string;
  description?: string;
  isPublic?: boolean;
  /** Public URL (already uploaded to S3). `null` is not sent: the server keeps the old cover. */
  cover_image?: string;
}

const LIST = { type: 'Playlist' as const, id: 'LIST' };
const one = (id: string) => ({ type: 'Playlist' as const, id });

/**
 * Playlists — live backend (owner-only; all writes are optimistic where the result is predictable).
 *
 * - `getMyPlaylists`        GET    /playlist/my-playlists?sort=-updatedAt&page=   (infinite; podcast ids)
 * - `getPlaylist`           GET    /playlist/get-single/:id                       (podcasts populated)
 * - `createPlaylist`        POST   /playlist/create            JSON { name, description?, isPublic?, cover_image?, podcasts? }
 * - `updatePlaylist`        PATCH  /playlist/update/:id        JSON (any of the above)
 * - `deletePlaylist`        DELETE /playlist/delete/:id
 * - `addToPlaylist`         POST   /playlist/add-podcast/:id   { podcastId }   — atomic, never duplicates
 * - `removeFromPlaylist`    DELETE /playlist/remove-podcast/:id/:podcastId      — atomic
 */
export const playlistsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMyPlaylists: build.infiniteQuery<Paginated<Playlist>, void, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (last) => (last.meta.page < last.meta.totalPage ? last.meta.page + 1 : undefined),
      },
      query: ({ pageParam }) => ({ url: endpoints.playlist.mine, params: { sort: '-updatedAt', page: pageParam, limit: PLAYLISTS_PAGE_SIZE } }),
      transformResponse: (res: Paginated<Playlist>) => ({ meta: res.meta, result: res.result.map((p) => ({ ...p, podcasts: p.podcasts.map(String) })) }),
      providesTags: [LIST],
    }),

    getPlaylist: build.query<PlaylistDetail, string>({
      query: (id) => endpoints.playlist.single(id),
      transformResponse: (res: PlaylistDetail): PlaylistDetail => ({
        ...res,
        // Populate drops deleted/hidden podcasts; guard against null entries anyway.
        podcasts: (res.podcasts ?? []).filter(Boolean).map(fromPopulatedPodcast),
      }),
      providesTags: (_r, _e, id) => [one(id)],
    }),

    createPlaylist: build.mutation<Playlist, PlaylistInput & { podcastIds?: string[] }>({
      query: ({ podcastIds, ...body }) => ({ url: endpoints.playlist.create, method: 'POST', body: { ...body, podcasts: podcastIds ?? [] } }),
      invalidatesTags: [LIST],
    }),

    updatePlaylist: build.mutation<Playlist, { id: string; patch: PlaylistInput }>({
      query: ({ id, patch }) => ({ url: endpoints.playlist.update(id), method: 'PATCH', body: patch }),
      async onQueryStarted({ id, patch }, { dispatch, queryFulfilled }) {
        const undo = patchEverywhere(dispatch, id, (p) => Object.assign(p, patch));
        try {
          await queryFulfilled;
        } catch {
          undo();
        }
      },
      // Moves to the top of "My playlist" (sorted by updatedAt).
      invalidatesTags: (_r, _e, { id }) => [LIST, one(id)],
    }),

    deletePlaylist: build.mutation<unknown, string>({
      query: (id) => ({ url: endpoints.playlist.remove(id), method: 'DELETE' }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          playlistsApi.util.updateQueryData('getMyPlaylists', undefined, (draft) => {
            for (const page of draft.pages) page.result = page.result.filter((p) => p._id !== id);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    /** `podcast` (when the caller has it) lets the open playlist show it at once, without a refetch. */
    addToPlaylist: build.mutation<Playlist, { playlistId: string; podcastId: string; podcast?: Podcast }>({
      query: ({ playlistId, podcastId }) => ({ url: endpoints.playlist.addPodcast(playlistId), method: 'POST', body: { podcastId } }),
      async onQueryStarted({ playlistId, podcastId, podcast }, { dispatch, queryFulfilled }) {
        const patches = [
          dispatch(
            playlistsApi.util.updateQueryData('getMyPlaylists', undefined, (draft) => {
              for (const page of draft.pages) for (const p of page.result) if (p._id === playlistId && !p.podcasts.includes(podcastId)) p.podcasts.push(podcastId);
            }),
          ),
          dispatch(
            playlistsApi.util.updateQueryData('getPlaylist', playlistId, (d) => {
              if (podcast && !d.podcasts.some((p) => p._id === podcastId)) d.podcasts.push(podcast);
            }),
          ),
        ];
        try {
          const { data } = await queryFulfilled;
          syncIds(dispatch, data);
          if (!podcast) dispatch(playlistsApi.util.invalidateTags([one(playlistId)]));
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
    }),

    removeFromPlaylist: build.mutation<Playlist, { playlistId: string; podcastId: string }>({
      query: ({ playlistId, podcastId }) => ({ url: endpoints.playlist.removePodcast(playlistId, podcastId), method: 'DELETE' }),
      async onQueryStarted({ playlistId, podcastId }, { dispatch, queryFulfilled }) {
        const patches = [
          dispatch(
            playlistsApi.util.updateQueryData('getMyPlaylists', undefined, (draft) => {
              for (const page of draft.pages) for (const p of page.result) if (p._id === playlistId) p.podcasts = p.podcasts.filter((id) => id !== podcastId);
            }),
          ),
          dispatch(playlistsApi.util.updateQueryData('getPlaylist', playlistId, (d) => void (d.podcasts = d.podcasts.filter((p) => p._id !== podcastId)))),
        ];
        try {
          const { data } = await queryFulfilled;
          syncIds(dispatch, data);
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
    }),
  }),
});

type Dispatch = ThunkDispatch<any, any, UnknownAction>;

/** Apply the same change to a playlist in the list cache and its detail cache; returns undo. */
const patchEverywhere = (dispatch: Dispatch, id: string, change: (p: { name: string; description?: string; isPublic?: boolean; cover_image?: string | null }) => void) => {
  const a = dispatch(
    playlistsApi.util.updateQueryData('getMyPlaylists', undefined, (draft) => {
      for (const page of draft.pages) for (const p of page.result) if (p._id === id) change(p);
    }),
  );
  const b = dispatch(playlistsApi.util.updateQueryData('getPlaylist', id, (d) => void change(d)));
  return () => {
    a.undo();
    b.undo();
  };
};

/** The server's answer is the truth for the id list (another device may have changed it too). */
const syncIds = (dispatch: Dispatch, server: Playlist | undefined) => {
  if (!server?._id || !Array.isArray(server.podcasts)) return;
  const ids = server.podcasts.map(String);
  dispatch(
    playlistsApi.util.updateQueryData('getMyPlaylists', undefined, (draft) => {
      for (const page of draft.pages) for (const p of page.result) if (p._id === server._id) p.podcasts = ids;
    }),
  );
};

export const {
  useGetMyPlaylistsInfiniteQuery,
  useGetPlaylistQuery,
  useCreatePlaylistMutation,
  useUpdatePlaylistMutation,
  useDeletePlaylistMutation,
  useAddToPlaylistMutation,
  useRemoveFromPlaylistMutation,
} = playlistsApi;

/** All loaded pages as one list. */
export const flattenPlaylists = (pages: Paginated<Playlist>[] | undefined): Playlist[] => {
  const seen = new Set<string>();
  const out: Playlist[] = [];
  for (const page of pages ?? []) {
    for (const p of page.result) {
      if (seen.has(p._id)) continue;
      seen.add(p._id);
      out.push(p);
    }
  }
  return out;
};
