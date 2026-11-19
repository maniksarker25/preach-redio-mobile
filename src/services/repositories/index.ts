import { env } from '@/app/config/env';
import * as mock from './mock';
import type {
  AlbumRepository,
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
 * Mock content repositories, used by `store/api/contentApi.ts` until each
 * content endpoint is connected. Authentication uses the real API (`store/api/authApi.ts`).
 *
 * To connect the backend: add `./http.ts` implementing the same interfaces with
 * `apiRequest()` + `endpoints`, then return those here when `env.useMocks` is false.
 * Screens, hooks and query keys stay unchanged.
 */
if (!env.useMocks) {
  console.warn('[repositories] Content HTTP repositories are not implemented yet; serving mock content.');
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
} = {
  podcasts: mock.mockPodcastRepository,
  home: mock.mockHomeRepository,
  catalog: mock.mockCatalogRepository,
  albums: mock.mockAlbumRepository,
  broadcasters: mock.mockBroadcasterRepository,
  engagement: mock.mockEngagementRepository,
  notifications: mock.mockNotificationRepository,
  content: mock.mockContentRepository,
};
