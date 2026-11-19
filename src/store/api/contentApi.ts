import { repositories, type CreatePodcastInput, type HomeFeed, type PodcastDetail, type PodcastQuery } from '@/services/repositories';
import type { Broadcaster } from '@/types/broadcaster';
import type { Album, AlbumDetail, AppNotification, Category, Comment, ContentPage, ContentPageKey, FaqItem, Podcast, PodcastType, StreamRoom, SubCategory } from '@/types/models';
import { baseApi, type ApiErrorShape } from './baseApi';

/**
 * Wrap a repository call as an RTK Query result.
 *
 * Content still comes from the mock repositories. To connect an endpoint to the
 * backend, replace its `queryFn` with `query: () => endpoints.…` (+ `transformResponse`
 * if the shape differs) — hooks, tags and screens stay the same.
 */
const fromRepo = async <T>(load: () => Promise<T>): Promise<{ data: T } | { error: ApiErrorShape }> => {
  try {
    return { data: await load() };
  } catch (e) {
    const err = e as { status?: number; message?: string };
    return { error: { status: err.status ?? 0, message: err.message ?? 'Something went wrong. Please try again.' } };
  }
};

const { podcasts, home, catalog, albums, broadcasters, engagement, notifications, content } = repositories;

export const contentApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /* ------------------------------------------------------------ home */
    getHomeFeed: build.query<HomeFeed, void>({
      queryFn: () => fromRepo(home.getFeed),
      providesTags: ['Home'],
    }),

    /* -------------------------------------------------------- podcasts */
    getPodcasts: build.query<Podcast[], PodcastQuery>({
      queryFn: (q) => fromRepo(async () => (await podcasts.list(q)).result),
      providesTags: (res) => [...(res ?? []).map((p) => ({ type: 'Podcast' as const, id: p._id })), { type: 'Podcast', id: 'LIST' }],
    }),
    getPodcast: build.query<PodcastDetail, string>({
      queryFn: (id) => fromRepo(() => podcasts.getById(id)),
      providesTags: (_r, _e, id) => [{ type: 'Podcast', id }],
    }),
    getPodcastsByIds: build.query<Podcast[], string[]>({
      queryFn: (ids) => fromRepo(() => podcasts.getMany(ids)),
      providesTags: (res) => (res ?? []).map((p) => ({ type: 'Podcast' as const, id: p._id })),
    }),
    getRelatedPodcasts: build.query<Podcast[], string>({
      queryFn: (id) => fromRepo(() => podcasts.related(id)),
    }),
    search: build.query<{ podcasts: Podcast[]; broadcasters: Broadcaster[]; albums: Album[] }, string>({
      queryFn: (term) => fromRepo(() => podcasts.search(term)),
      keepUnusedDataFor: 30,
    }),
    getMyPodcasts: build.query<Podcast[], PodcastType | undefined>({
      queryFn: (type) => fromRepo(() => podcasts.mine(type)),
      providesTags: ['MyPodcasts'],
    }),
    createPodcast: build.mutation<Podcast, CreatePodcastInput>({
      queryFn: (input) => fromRepo(() => podcasts.create(input)),
      invalidatesTags: ['MyPodcasts', 'Home', { type: 'Podcast', id: 'LIST' }],
    }),
    deletePodcast: build.mutation<void, string>({
      queryFn: (id) => fromRepo(() => podcasts.remove(id)),
      invalidatesTags: (_r, _e, id) => ['MyPodcasts', 'Home', { type: 'Podcast', id }, { type: 'Podcast', id: 'LIST' }],
    }),

    /* --------------------------------------------------------- catalog */
    getCategories: build.query<Category[], void>({
      queryFn: () => fromRepo(catalog.categories),
      providesTags: ['Category'],
      keepUnusedDataFor: 600,
    }),
    getCategory: build.query<Category, string>({
      queryFn: (id) => fromRepo(() => catalog.category(id)),
      providesTags: (_r, _e, id) => [{ type: 'Category', id }],
    }),
    getSubCategories: build.query<SubCategory[], string | undefined>({
      queryFn: (categoryId) => fromRepo(() => catalog.subCategories(categoryId)),
      keepUnusedDataFor: 600,
    }),
    getAlbums: build.query<Album[], void>({
      queryFn: () => fromRepo(albums.list),
      providesTags: ['Album'],
    }),
    getAlbum: build.query<AlbumDetail, string>({
      queryFn: (id) => fromRepo(() => albums.getById(id)),
      providesTags: (_r, _e, id) => [{ type: 'Album', id }],
    }),

    /* ------------------------------------------------ stations / live */
    getBroadcasters: build.query<Broadcaster[], void>({
      queryFn: () => fromRepo(broadcasters.list),
      providesTags: ['Broadcaster'],
    }),
    getBroadcaster: build.query<Broadcaster, string>({
      queryFn: (id) => fromRepo(() => broadcasters.getById(id)),
      providesTags: (_r, _e, id) => [{ type: 'Broadcaster', id }],
    }),
    getPreviousLives: build.query<StreamRoom[], string | undefined>({
      queryFn: (id) => fromRepo(() => broadcasters.previousLives(id)),
    }),

    /* ------------------------------------------------------ engagement */
    getComments: build.query<Comment[], string>({
      queryFn: (podcastId) => fromRepo(() => engagement.comments(podcastId)),
      providesTags: (_r, _e, id) => [{ type: 'Comment', id }],
    }),
    addComment: build.mutation<Comment, { podcastId: string; text: string; author: Comment['commentor'] }>({
      queryFn: ({ podcastId, text, author }) => fromRepo(() => engagement.addComment(podcastId, text, author)),
      // Put the new comment at the top of the cached thread without refetching.
      async onQueryStarted({ podcastId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(contentApi.util.updateQueryData('getComments', podcastId, (draft) => void draft.unshift(data)));
        } catch {
          /* surfaced by the hook */
        }
      },
    }),
    getNotifications: build.query<AppNotification[], void>({
      queryFn: () => fromRepo(notifications.list),
      providesTags: ['Notification'],
    }),

    /* ------------------------------------------------------------- CMS */
    getContentPage: build.query<ContentPage, ContentPageKey>({
      queryFn: (key) => fromRepo(() => content.page(key)),
      providesTags: (_r, _e, key) => [{ type: 'Content', id: key }],
      keepUnusedDataFor: 600,
    }),
    getFaqs: build.query<FaqItem[], void>({
      queryFn: () => fromRepo(content.faqs),
      providesTags: [{ type: 'Content', id: 'FAQ' }],
      keepUnusedDataFor: 600,
    }),
  }),
});

export const {
  useGetHomeFeedQuery,
  useGetPodcastsQuery,
  useGetPodcastQuery,
  useGetPodcastsByIdsQuery,
  useGetRelatedPodcastsQuery,
  useSearchQuery,
  useGetMyPodcastsQuery,
  useCreatePodcastMutation,
  useDeletePodcastMutation,
  useGetCategoriesQuery,
  useGetCategoryQuery,
  useGetSubCategoriesQuery,
  useGetAlbumsQuery,
  useGetAlbumQuery,
  useGetBroadcastersQuery,
  useGetBroadcasterQuery,
  useGetPreviousLivesQuery,
  useGetCommentsQuery,
  useAddCommentMutation,
  useGetNotificationsQuery,
  useGetContentPageQuery,
  useGetFaqsQuery,
} = contentApi;
