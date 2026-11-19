import type { Broadcaster } from '@/types/broadcaster';
import type { ListParams, Paginated } from '@/types/api';
import type {
  AlbumDetail,
  Album,
  AppNotification,
  Banner,
  Category,
  Comment,
  ContentPage,
  ContentPageKey,
  FaqItem,
  HomeData,
  NormalUserProfile,
  Podcast,
  PodcastMediaType,
  PodcastType,
  SourcePodcastRef,
  StreamRoom,
  SubCategory,
  User,
} from '@/types/models';

/**
 * Data-access contracts. Screens and hooks depend on these interfaces only;
 * `./index.ts` decides whether the mock or HTTP implementation is used.
 */

export interface PodcastQuery extends ListParams {
  type?: PodcastType;
  mediaType?: PodcastMediaType;
  category?: string;
  subCategory?: string;
  /** creator or station id */
  owner?: string;
  sort?: 'newest' | 'popular';
}

/** `get-single` returns a clip's source episode populated. */
export type PodcastDetail = Omit<Podcast, 'sourcePodcast'> & { sourcePodcast: SourcePodcastRef | null };

export interface HomeFeed extends HomeData {
  banners: Banner[];
  liveNow: Broadcaster[];
  /** Full-length sermon videos (episodes with `mediaType: video`). */
  sermons: Podcast[];
}

export interface CreatePodcastInput {
  type: PodcastType;
  mediaType: PodcastMediaType;
  title: string;
  description: string;
  category: string;
  subCategory: string;
  tags: string[];
  durationSeconds: number;
  address?: string;
  /** local file URI; the real flow uploads to S3 via a presigned URL first */
  fileUri: string;
  coverUri?: string;
  sourcePodcast?: string;
}

export interface PodcastRepository {
  /** `/podcast/my-podcasts` (creator) */
  mine(type?: PodcastType): Promise<Podcast[]>;
  create(input: CreatePodcastInput): Promise<Podcast>;
  remove(id: string): Promise<void>;
  list(query?: PodcastQuery): Promise<Paginated<Podcast>>;
  getById(id: string): Promise<PodcastDetail>;
  getMany(ids: string[]): Promise<Podcast[]>;
  related(id: string, limit?: number): Promise<Podcast[]>;
  search(term: string): Promise<{ podcasts: Podcast[]; broadcasters: Broadcaster[]; albums: Album[] }>;
}

export interface HomeRepository {
  getFeed(): Promise<HomeFeed>;
}

export interface CatalogRepository {
  categories(): Promise<Category[]>;
  subCategories(categoryId?: string): Promise<SubCategory[]>;
  category(id: string): Promise<Category>;
}

export interface AlbumRepository {
  list(): Promise<Album[]>;
  getById(id: string): Promise<AlbumDetail>;
}

export interface BroadcasterRepository {
  list(): Promise<Broadcaster[]>;
  getById(id: string): Promise<Broadcaster>;
  previousLives(id?: string): Promise<StreamRoom[]>;
}

export interface EngagementRepository {
  comments(podcastId: string): Promise<Comment[]>;
  addComment(podcastId: string, text: string, author: Comment['commentor']): Promise<Comment>;
}

export interface NotificationRepository {
  list(): Promise<AppNotification[]>;
}

export interface ContentRepository {
  page(key: ContentPageKey): Promise<ContentPage>;
  faqs(): Promise<FaqItem[]>;
}

export interface Session {
  accessToken: string;
  user: User;
  profile: NormalUserProfile;
}

export interface AuthRepository {
  login(email: string, password: string): Promise<Session>;
  register(input: { name: string; email: string; password: string; role: 'user' | 'creator' }): Promise<{ email: string }>;
  verifyCode(email: string, code: string): Promise<Session>;
  forgotPassword(email: string): Promise<void>;
  verifyResetCode(email: string, code: string): Promise<void>;
  resetPassword(email: string, password: string): Promise<void>;
  changePassword(oldPassword: string, newPassword: string): Promise<void>;
}
