import { endpoints } from '@/services/api/endpoints';
import type { Paginated } from '@/types/api';
import type { Podcast } from '@/types/models';
import { normalizePodcast } from '@/utils/podcast';
import { baseApi } from './baseApi';

/** Clips per page. Small pages keep the first clip on screen fast; the next page loads ahead of the user. */
export const CLIPS_PAGE_SIZE = 10;

/** Everything from the clip endpoint is a clip, including legacy records without a `type`. */
const normalizeClip = (p: Podcast): Podcast => normalizePodcast(p, 'clip');

/**
 * Preach Clips (reels) — live backend.
 *
 * - `getClips`     GET  /podcast/all?type=clip&page=  (infinite, newest first)
 * - `getClip`      GET  /podcast/get-single/:id       (adds isLike / isBookmark and the populated source episode)
 * - `toggleClipLike` / `toggleClipBookmark` — optimistic on the `getClip` cache
 * - `recordClipView` POST /podcast/view/:id           (view count + watch history)
 */
export const reelsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getClips: build.infiniteQuery<Paginated<Podcast>, void, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (last) => (last.meta.page < last.meta.totalPage ? last.meta.page + 1 : undefined),
      },
      query: ({ pageParam }) => ({ url: endpoints.podcast.all, params: { type: 'clip', page: pageParam, limit: CLIPS_PAGE_SIZE } }),
      transformResponse: (res: Paginated<Podcast>) => ({ meta: res.meta, result: res.result.map(normalizeClip) }),
      providesTags: [{ type: 'Clip', id: 'LIST' }],
    }),

    getClip: build.query<Podcast, string>({
      query: (id) => endpoints.podcast.single(id),
      transformResponse: normalizeClip,
      providesTags: (_r, _e, id) => [{ type: 'Clip', id }],
    }),

    toggleClipLike: build.mutation<{ isLike: boolean }, string>({
      query: (id) => ({ url: endpoints.like.toggle(id), method: 'POST' }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          reelsApi.util.updateQueryData('getClip', id, (d) => {
            d.isLike = !d.isLike;
            d.totalLikes = Math.max(0, d.totalLikes + (d.isLike ? 1 : -1));
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    toggleClipBookmark: build.mutation<unknown, string>({
      query: (id) => ({ url: endpoints.bookmark.toggle(id), method: 'POST' }),
      invalidatesTags: ['Favorite'], // the Favorite tab lists clips too
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(reelsApi.util.updateQueryData('getClip', id, (d) => void (d.isBookmark = !d.isBookmark)));
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    recordClipView: build.mutation<null, string>({
      query: (id) => ({ url: endpoints.podcast.view(id), method: 'POST' }),
    }),
  }),
});

export const { useGetClipsInfiniteQuery, useGetClipQuery, useToggleClipLikeMutation, useToggleClipBookmarkMutation, useRecordClipViewMutation } = reelsApi;

/** All loaded pages of a podcast feed as one de-duplicated list (pages can shift when new items are published). */
export const flattenPodcastPages = (pages: Paginated<Podcast>[] | undefined): Podcast[] => {
  const seen = new Set<string>();
  const out: Podcast[] = [];
  for (const page of pages ?? []) {
    for (const clip of page.result) {
      if (seen.has(clip._id)) continue;
      seen.add(clip._id);
      out.push(clip);
    }
  }
  return out;
};
