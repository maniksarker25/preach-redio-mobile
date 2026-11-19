import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { repositories, type CreatePodcastInput, type PodcastQuery } from '@/services/repositories';
import type { Comment, ContentPageKey, PodcastType } from '@/types/models';

/** Query keys in one place so invalidation stays exact. */
export const queryKeys = {
  home: ['home'] as const,
  podcasts: (q: PodcastQuery = {}) => ['podcasts', q] as const,
  podcast: (id: string) => ['podcast', id] as const,
  podcastsMany: (ids: string[]) => ['podcasts', 'many', ids] as const,
  related: (id: string) => ['podcast', id, 'related'] as const,
  search: (term: string) => ['search', term] as const,
  categories: ['categories'] as const,
  category: (id: string) => ['category', id] as const,
  subCategories: (categoryId?: string) => ['subCategories', categoryId ?? 'all'] as const,
  albums: ['albums'] as const,
  album: (id: string) => ['album', id] as const,
  broadcasters: ['broadcasters'] as const,
  broadcaster: (id: string) => ['broadcaster', id] as const,
  previousLives: (id?: string) => ['previousLives', id ?? 'all'] as const,
  comments: (podcastId: string) => ['comments', podcastId] as const,
  notifications: ['notifications'] as const,
  content: (key: ContentPageKey) => ['content', key] as const,
  faqs: ['faqs'] as const,
};

const { podcasts, home, catalog, albums, broadcasters, engagement, notifications, content } = repositories;

export const useHomeFeed = () => useQuery({ queryKey: queryKeys.home, queryFn: home.getFeed });

export const usePodcasts = (q: PodcastQuery = {}) =>
  useQuery({ queryKey: queryKeys.podcasts(q), queryFn: () => podcasts.list(q), select: (d) => d.result });

export const usePodcast = (id: string) => useQuery({ queryKey: queryKeys.podcast(id), queryFn: () => podcasts.getById(id) });

export const usePodcastsByIds = (ids: string[]) =>
  useQuery({ queryKey: queryKeys.podcastsMany(ids), queryFn: () => podcasts.getMany(ids), enabled: ids.length > 0, placeholderData: [] });

export const useRelatedPodcasts = (id: string) =>
  useQuery({ queryKey: queryKeys.related(id), queryFn: () => podcasts.related(id) });

export const useSearch = (term: string) =>
  useQuery({ queryKey: queryKeys.search(term), queryFn: () => podcasts.search(term), enabled: term.trim().length > 1 });

export const useCategories = () => useQuery({ queryKey: queryKeys.categories, queryFn: catalog.categories });
export const useCategory = (id: string) => useQuery({ queryKey: queryKeys.category(id), queryFn: () => catalog.category(id) });
export const useSubCategories = (categoryId?: string) =>
  useQuery({ queryKey: queryKeys.subCategories(categoryId), queryFn: () => catalog.subCategories(categoryId) });

export const useAlbums = () => useQuery({ queryKey: queryKeys.albums, queryFn: albums.list });
export const useAlbum = (id: string) => useQuery({ queryKey: queryKeys.album(id), queryFn: () => albums.getById(id) });

export const useBroadcasters = () => useQuery({ queryKey: queryKeys.broadcasters, queryFn: broadcasters.list });
export const useBroadcaster = (id: string) =>
  useQuery({ queryKey: queryKeys.broadcaster(id), queryFn: () => broadcasters.getById(id), enabled: Boolean(id) });
export const usePreviousLives = (id?: string) =>
  useQuery({ queryKey: queryKeys.previousLives(id), queryFn: () => broadcasters.previousLives(id) });

export const useMyPodcasts = (type?: PodcastType) =>
  useQuery({ queryKey: ['myPodcasts', type ?? 'all'] as const, queryFn: () => podcasts.mine(type) });

/** Invalidate everything that lists podcasts after a creator changes one. */
const useInvalidatePodcasts = () => {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ['myPodcasts'] });
    void qc.invalidateQueries({ queryKey: ['podcasts'] });
    void qc.invalidateQueries({ queryKey: queryKeys.home });
  };
};

export const useCreatePodcast = () => {
  const invalidate = useInvalidatePodcasts();
  return useMutation({ mutationFn: (input: CreatePodcastInput) => podcasts.create(input), onSuccess: invalidate });
};

export const useDeletePodcast = () => {
  const invalidate = useInvalidatePodcasts();
  return useMutation({ mutationFn: (id: string) => podcasts.remove(id), onSuccess: invalidate });
};

export const useComments = (podcastId: string) =>
  useQuery({ queryKey: queryKeys.comments(podcastId), queryFn: () => engagement.comments(podcastId) });

export const useAddComment = (podcastId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ text, author }: { text: string; author: Comment['commentor'] }) => engagement.addComment(podcastId, text, author),
    onSuccess: (comment) => qc.setQueryData<Comment[]>(queryKeys.comments(podcastId), (old = []) => [comment, ...old]),
  });
};

export const useNotifications = () => useQuery({ queryKey: queryKeys.notifications, queryFn: notifications.list });

export const useContentPage = (key: ContentPageKey) =>
  useQuery({ queryKey: queryKeys.content(key), queryFn: () => content.page(key) });
export const useFaqs = () => useQuery({ queryKey: queryKeys.faqs, queryFn: content.faqs });
