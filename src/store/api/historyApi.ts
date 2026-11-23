import { endpoints } from '@/services/api/endpoints';
import type { Paginated } from '@/types/api';
import type { Podcast } from '@/types/models';
import { fromPopulatedPodcast } from '@/utils/podcast';
import { baseApi } from './baseApi';

/** Entries per page. The server keeps the last 50 plays per user. */
export const HISTORY_PAGE_SIZE = 20;

/** One `/watch-history/get-all` row. `podcast` is null when it was deleted or hidden since. */
interface WatchHistoryRow {
  _id: string;
  podcast: Podcast | null;
  createdAt: string;
  /** Last played (a replay bumps it). */
  updatedAt: string;
}

export interface HistoryEntry {
  podcast: Podcast;
  playedAt: string;
}

/**
 * Recently played — live backend. A play is recorded by `POST /podcast/view/:id` (player and reels),
 * so the History screen refetches when it gains focus rather than after every play.
 *
 * - `getWatchHistory`  GET /watch-history/get-all?sort=-updatedAt&page=  (infinite, last played first)
 */
export const historyApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getWatchHistory: build.infiniteQuery<Paginated<HistoryEntry>, void, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (last) => (last.meta.page < last.meta.totalPage ? last.meta.page + 1 : undefined),
      },
      query: ({ pageParam }) => ({ url: endpoints.watchHistory.mine, params: { sort: '-updatedAt', page: pageParam, limit: HISTORY_PAGE_SIZE } }),
      transformResponse: (res: Paginated<WatchHistoryRow>): Paginated<HistoryEntry> => ({
        meta: res.meta,
        result: res.result.flatMap((row) => (row.podcast ? [{ podcast: fromPopulatedPodcast(row.podcast), playedAt: row.updatedAt }] : [])),
      }),
      providesTags: ['History'],
    }),
  }),
});

export const { useGetWatchHistoryInfiniteQuery } = historyApi;

/** All loaded pages as one list, newest play first, one entry per podcast. */
export const flattenHistory = (pages: Paginated<HistoryEntry>[] | undefined): HistoryEntry[] => {
  const seen = new Set<string>();
  const out: HistoryEntry[] = [];
  for (const page of pages ?? []) {
    for (const entry of page.result) {
      if (seen.has(entry.podcast._id)) continue;
      seen.add(entry.podcast._id);
      out.push(entry);
    }
  }
  return out;
};
