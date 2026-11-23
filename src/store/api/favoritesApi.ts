import { endpoints } from '@/services/api/endpoints';
import type { Paginated } from '@/types/api';
import type { Podcast } from '@/types/models';
import { fromPopulatedPodcast } from '@/utils/podcast';
import { baseApi } from './baseApi';
import { reelsApi } from './reelsApi';

/** Favorites per page. */
export const FAVORITES_PAGE_SIZE = 20;

/** One `/bookmark/my-bookmarks` row. `podcast` is null when it was deleted or hidden since. */
interface BookmarkRow {
  _id: string;
  podcast: Podcast | null;
  /** When it was saved. */
  createdAt: string;
}

export interface FavoriteEntry {
  podcast: Podcast;
  savedAt: string;
}

/**
 * Favorites (bookmarks) — live backend.
 *
 * - `getFavorites`    GET  /bookmark/my-bookmarks?sort=-createdAt&page=  (infinite, newest saved first)
 * - `toggleFavorite`  POST /bookmark/add-delete-bookmark/:id  — the server toggles; `saved` is the state the
 *   UI wants. Optimistic on the Favorite list and on the podcast's `getClip` (get-single) `isBookmark`.
 */
export const favoritesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getFavorites: build.infiniteQuery<Paginated<FavoriteEntry>, void, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (last) => (last.meta.page < last.meta.totalPage ? last.meta.page + 1 : undefined),
      },
      query: ({ pageParam }) => ({ url: endpoints.bookmark.mine, params: { sort: '-createdAt', page: pageParam, limit: FAVORITES_PAGE_SIZE } }),
      transformResponse: (res: Paginated<BookmarkRow>): Paginated<FavoriteEntry> => ({
        meta: res.meta,
        result: res.result.flatMap((row) => (row.podcast ? [{ podcast: fromPopulatedPodcast(row.podcast), savedAt: row.createdAt }] : [])),
      }),
      providesTags: ['Favorite'],
    }),

    toggleFavorite: build.mutation<unknown, { podcast: Podcast; saved: boolean }>({
      query: ({ podcast }) => ({ url: endpoints.bookmark.toggle(podcast._id), method: 'POST' }),
      async onQueryStarted({ podcast, saved }, { dispatch, queryFulfilled }) {
        const patches = [
          dispatch(reelsApi.util.updateQueryData('getClip', podcast._id, (d) => void (d.isBookmark = saved))),
          dispatch(
            favoritesApi.util.updateQueryData('getFavorites', undefined, (draft) => {
              for (const page of draft.pages) page.result = page.result.filter((e) => e.podcast._id !== podcast._id);
              if (saved && draft.pages[0]) draft.pages[0].result.unshift({ podcast, savedAt: new Date().toISOString() });
            }),
          ),
        ];
        try {
          const { data } = await queryFulfilled;
          // The endpoint toggles: it returns the new bookmark, or null when it removed one. If that
          // disagrees with what we showed (stale UI, a tap on another device), reload the truth.
          if ((data != null) !== saved) dispatch(baseApi.util.invalidateTags(['Favorite', { type: 'Clip', id: podcast._id }]));
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
    }),
  }),
});

export const { useGetFavoritesInfiniteQuery, useToggleFavoriteMutation } = favoritesApi;

/** All loaded pages as one list, newest saved first, one entry per podcast. */
export const flattenFavorites = (pages: Paginated<FavoriteEntry>[] | undefined): FavoriteEntry[] => {
  const seen = new Set<string>();
  const out: FavoriteEntry[] = [];
  for (const page of pages ?? []) {
    for (const entry of page.result) {
      if (seen.has(entry.podcast._id)) continue;
      seen.add(entry.podcast._id);
      out.push(entry);
    }
  }
  return out;
};
