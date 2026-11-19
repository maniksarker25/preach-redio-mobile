import { env } from '@/app/config/env';
import * as mock from './mock';
import type {
  AlbumRepository,
  AuthRepository,
  BroadcasterRepository,
  CatalogRepository,
  ContentRepository,
  EngagementRepository,
  HomeRepository,
  NotificationRepository,
  PodcastRepository,
} from './types';

export type * from './types';

/**
 * Repository registry — the only place that knows where data comes from.
 *
 * To connect the backend: add `./http.ts` implementing the same interfaces with
 * `apiRequest()` + `endpoints`, then return those here when `env.useMocks` is false.
 * Screens, hooks and query keys stay unchanged.
 */
if (!env.useMocks) {
  console.warn('[repositories] HTTP repositories are not implemented yet; serving mock data.');
}

export const repositories: {
  podcasts: PodcastRepository;
  home: HomeRepository;
  catalog: CatalogRepository;
  albums: AlbumRepository;
  broadcasters: BroadcasterRepository;
  engagement: EngagementRepository;
  notifications: NotificationRepository;
  content: ContentRepository;
  auth: AuthRepository;
} = {
  podcasts: mock.mockPodcastRepository,
  home: mock.mockHomeRepository,
  catalog: mock.mockCatalogRepository,
  albums: mock.mockAlbumRepository,
  broadcasters: mock.mockBroadcasterRepository,
  engagement: mock.mockEngagementRepository,
  notifications: mock.mockNotificationRepository,
  content: mock.mockContentRepository,
  auth: mock.mockAuthRepository,
};
