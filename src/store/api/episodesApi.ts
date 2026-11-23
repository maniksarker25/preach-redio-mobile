import { endpoints } from '@/services/api/endpoints';
import type { Paginated } from '@/types/api';
import type { Podcast } from '@/types/models';
import { normalizePodcast } from '@/utils/podcast';
import { baseApi } from './baseApi';

/** `newest` → home "Just In", `popular` → home "Faith Hits" (most viewed first). */
export type EpisodeSort = 'newest' | 'popular';

/** Episodes per page. The home rails show the first page; "See all" and the player queue page on from there. */
export const EPISODES_PAGE_SIZE = 10;

const episodeParams = (sort: EpisodeSort, page: number) => ({
  type: 'episode',
  page,
  limit: EPISODES_PAGE_SIZE,
  ...(sort === 'popular' ? { sort: 'popular' } : {}),
});

const normalizePage = (res: Paginated<Podcast>): Paginated<Podcast> => ({
  meta: res.meta,
  result: res.result.map((p) => normalizePodcast(p, 'episode')),
});

/**
 * Full episodes (not clips) — live backend.
 *
 * - `getEpisodeFeed`  GET /podcast/all?type=episode[&sort=popular]&page=  (infinite; home rails + "See all")
 * - `getEpisodePage`  same request for one page, used by the player to grow its queue outside React
 */
export const episodesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getEpisodeFeed: build.infiniteQuery<Paginated<Podcast>, EpisodeSort, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (last) => (last.meta.page < last.meta.totalPage ? last.meta.page + 1 : undefined),
      },
      query: ({ queryArg, pageParam }) => ({ url: endpoints.podcast.all, params: episodeParams(queryArg, pageParam) }),
      transformResponse: normalizePage,
      providesTags: (_r, _e, sort) => [{ type: 'Episode', id: sort }],
    }),

    getEpisodePage: build.query<Paginated<Podcast>, { sort: EpisodeSort; page: number }>({
      query: ({ sort, page }) => ({ url: endpoints.podcast.all, params: episodeParams(sort, page) }),
      transformResponse: normalizePage,
      providesTags: (_r, _e, { sort }) => [{ type: 'Episode', id: sort }],
    }),
  }),
});

export const { useGetEpisodeFeedInfiniteQuery } = episodesApi;
