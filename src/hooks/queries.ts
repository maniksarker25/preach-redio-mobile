import type { PodcastQuery } from '@/services/repositories';
import type { PodcastType } from '@/types/models';
import * as api from '@/store/api/contentApi';

/**
 * Screen-facing data hooks — thin, intention-revealing names over the RTK Query
 * endpoints in `store/api/contentApi.ts`, with the skip rules each screen needs.
 */
export const useHomeFeed = () => api.useGetHomeFeedQuery();
export const usePodcasts = (q: PodcastQuery = {}) => api.useGetPodcastsQuery(q);
export const usePodcast = (id: string) => api.useGetPodcastQuery(id);
export const usePodcastsByIds = (ids: string[]) => api.useGetPodcastsByIdsQuery(ids, { skip: ids.length === 0 });
export const useRelatedPodcasts = (id: string) => api.useGetRelatedPodcastsQuery(id);
export const useSearch = (term: string) => api.useSearchQuery(term.trim(), { skip: term.trim().length < 2 });
export const useMyPodcasts = (type?: PodcastType) => api.useGetMyPodcastsQuery(type);
export const useCreatePodcast = api.useCreatePodcastMutation;
export const useDeletePodcast = api.useDeletePodcastMutation;

export const useCategories = () => api.useGetCategoriesQuery();
export const useCategory = (id: string) => api.useGetCategoryQuery(id);
export const useSubCategories = (categoryId?: string) => api.useGetSubCategoriesQuery(categoryId);
export const useAlbums = () => api.useGetAlbumsQuery();
export const useAlbum = (id: string) => api.useGetAlbumQuery(id);

export const useBroadcasters = () => api.useGetBroadcastersQuery();
export const useBroadcaster = (id: string) => api.useGetBroadcasterQuery(id, { skip: !id });
export const usePreviousLives = (id?: string) => api.useGetPreviousLivesQuery(id);

export const useComments = (podcastId: string) => api.useGetCommentsQuery(podcastId);
export const useAddComment = api.useAddCommentMutation;
