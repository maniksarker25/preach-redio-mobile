/**
 * Domain models mirroring preach-radio-backend (src/app/modules/**).
 * Shapes follow what the API *returns* (populated references, ISO date strings),
 * so the mock layer and the future HTTP layer share one contract.
 */

export type ID = string;
/** ISO-8601 timestamp as serialised by the API. */
export type ISODate = string;

export interface GeoPoint {
  type: 'Point';
  /** [longitude, latitude] */
  coordinates: [number, number];
}

/* ------------------------------------------------------------------ users */

export type UserRole = 'user' | 'creator' | 'admin' | 'superAdmin';
/** Backend `ENUM_GENDER` values. */
export type Gender = 'Male' | 'Female' | 'Other';

/** `user` module — the account record. */
export interface User {
  _id: ID;
  profileId: ID;
  email: string;
  phone?: string;
  role: UserRole;
  isVerified: boolean;
  isBlocked: boolean;
  isRegistrationCompleted: boolean;
}

/** `normalUser` module — listener profile. */
export interface NormalUserProfile {
  _id: ID;
  user: ID;
  name: string;
  email: string;
  phone?: string;
  profile_image?: string;
  profile_cover?: string;
  address?: string;
  dateOfBirth?: ISODate;
  gender?: Gender;
  location?: GeoPoint;
}

/** `creator` module — preacher / ministry profile. */
export interface Creator {
  _id: ID;
  user: ID;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  profile_image?: string;
  profile_cover?: string;
  location?: GeoPoint;
  dateOfBirth?: ISODate;
  gender?: Gender;
  isApproved: boolean;
  donationLink?: string;
  createdAt: ISODate;
}

/** Minimal populated reference (`populate('creator', 'name profile_image')`). */
export interface ProfileRef {
  _id: ID;
  name: string;
  profile_image?: string;
}

/* --------------------------------------------------------------- station */

/** `station` module — the official broadcaster profile. */
export interface Station {
  _id: ID;
  name: string;
  description?: string;
  location?: GeoPoint;
  address?: string;
  donationUrl?: string;
  profile_image?: string;
  cover_image?: string;
  createdAt: ISODate;
}

/* ------------------------------------------------------------ catalogue */

export interface Category {
  _id: ID;
  name: string;
  category_image: string;
}

export interface SubCategory {
  _id: ID;
  category: ID;
  name: string;
  image: string;
}

export type PodcastMediaType = 'audio' | 'video';
/** `episode` = full message, `clip` = Preach Clip / reel (≤ 2 minutes). */
export type PodcastType = 'episode' | 'clip';
export type PodcastStatus = 'published' | 'hidden';
export type MediaProcessingStatus = 'queued' | 'processing' | 'ready' | 'failed' | 'skipped';

/** Shape of `sourcePodcast` on `get-single` for a clip ("Watch full message"). */
export interface SourcePodcastRef {
  _id: ID;
  title: string;
  coverImage?: string | null;
  mediaType: PodcastMediaType;
  duration: number;
  durationSeconds?: number;
}

/** `podcast` module — one episode or one clip. */
export interface Podcast {
  _id: ID;
  /** Set for creator uploads. A podcast belongs to a creator OR the station. */
  creator?: ProfileRef | null;
  /** Set for platform (admin) uploads. */
  station?: ProfileRef | null;
  category: Pick<Category, '_id' | 'name'>;
  subCategory: Pick<SubCategory, '_id' | 'name'>;
  /** Optional since the cover became optional — always render a fallback. */
  coverImage?: string | null;
  /** Original upload, always playable. */
  podcast_url?: string;
  /** HLS master playlist; prefer it over `podcast_url` when present. */
  hlsUrl?: string | null;
  processing?: { status: MediaProcessingStatus } | null;
  videoWidth?: number | null;
  videoHeight?: number | null;
  mediaType: PodcastMediaType;
  /** Missing on legacy records — treat as `episode` for a single item. */
  type?: PodcastType;
  sourcePodcast?: SourcePodcastRef | ID | null;
  status?: PodcastStatus;
  title: string;
  description: string;
  location?: GeoPoint;
  address?: string;
  tags: string[];
  totalView: number;
  totalLikes: number;
  /** All comments including replies (list and get-single responses). */
  totalComments?: number;
  /** Legacy "minutes.seconds" format (4m 07s → 4.07). Prefer `durationSeconds`. */
  duration: number;
  durationSeconds?: number;
  /** Present when the request carries a token. */
  isLike?: boolean;
  isBookmark?: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

/** `album` module — a curated series of podcasts. */
export interface Album {
  _id: ID;
  name: string;
  description: string;
  tags: string[];
  cover_image: string;
  podcasts: ID[];
}

/** `album/get-single` populates the podcasts. */
export interface AlbumDetail extends Omit<Album, 'podcasts'> {
  podcasts: Podcast[];
}

/** `playlist` module — a user's own collection. */
/** `playlist` module. Lists return podcast ids; `get-single` returns `PlaylistDetail`. */
export interface Playlist {
  _id: ID;
  user: ID;
  userType: 'NormalUser' | 'Creator';
  name: string;
  description?: string;
  tags: string[];
  /** Optional; the app falls back to the podcasts' covers. */
  cover_image?: string | null;
  /** false → only the owner can open it. */
  isPublic?: boolean;
  /** Ordered, unique, max 500. */
  podcasts: ID[];
  createdAt: ISODate;
  updatedAt?: ISODate;
}

/** `GET /playlist/get-single/:id` — owner and podcasts populated (deleted / hidden podcasts are left out). */
export interface PlaylistDetail extends Omit<Playlist, 'user' | 'podcasts'> {
  user: { _id: ID; name: string; profile_image?: string } | null;
  podcasts: Podcast[];
}

/* ------------------------------------------------------------------ live */

export type LiveStreamStatus = 'waiting' | 'live' | 'ended';

export interface LiveSessionSummary {
  session_id: string;
  name: string;
  description?: string;
  coverImage?: string;
  session_started_at: ISODate;
  duration?: number;
}

export interface LiveRecording {
  session_id: string;
  started_at?: ISODate;
  ended_at?: ISODate;
  /** seconds */
  duration?: number;
  url: string;
}

/** `liveStreaming` module — a 100ms room. */
export interface StreamRoom {
  _id: ID;
  creator?: ID;
  station?: ID;
  name: string;
  description: string;
  status: LiveStreamStatus;
  startTime?: ISODate;
  endTime?: ISODate;
  recordings: LiveRecording[];
}

/** `podcast/get-home-data` → `topCreators[]`. */
export interface TopCreator {
  creatorId: ID;
  name: string;
  email?: string;
  profile_image?: string;
  profile_cover?: string;
  location?: GeoPoint;
  donationLink?: string;
  isLive: boolean;
  totalViews: number;
  liveSession?: LiveSessionSummary;
  latestPodcast?: Pick<Podcast, '_id' | 'title' | 'description' | 'podcast_url' | 'hlsUrl' | 'coverImage'>;
}

/* ------------------------------------------------------------- engagement */

export interface Comment {
  _id: ID;
  podcast: ID;
  text: string;
  likers: ID[];
  parent?: ID | null;
  commentor: ProfileRef;
  commentorType: 'NormalUser' | 'Creator';
  createdAt: ISODate;
  replies?: Comment[];
}

export type NotificationType = 'GENERAL' | 'LIVE_INVITATION' | 'PAYMENT' | 'FEEDBACK' | 'COMMENT' | 'CREATOR_APPROVED' | 'REPORT' | 'COURSE' | 'CLASS' | 'ORDER';

/** What a notification (or its push) opens. */
export type NotificationEntity = 'PODCAST' | 'LIVE_ROOM' | 'FEEDBACK' | 'CREATOR' | 'REPORT' | 'NONE';
export interface NotificationData {
  entity: NotificationEntity;
  entityId?: string | null;
  meta?: Record<string, unknown>;
}

export interface AppNotification {
  _id: ID;
  title: string;
  message: string;
  type: NotificationType;
  /** Deep link (entity + id). */
  data?: NotificationData;
  /** @deprecated same as `data.entityId` (older servers). */
  redirectId?: string | null;
  /** Seen by the signed-in user. */
  isSeen: boolean;
  createdAt: ISODate;
}

export interface Banner {
  _id: ID;
  banner_url: string;
  redirect_url?: string;
  startDate: ISODate;
  endDate: ISODate;
}

export interface WatchHistoryEntry {
  _id: ID;
  /** `null` when the podcast was deleted or hidden. */
  podcast: Podcast | null;
  createdAt: ISODate;
}

/* ------------------------------------------------------------ aggregates */

/** `GET /podcast/get-home-data` */
export interface HomeData {
  categories: Category[];
  newestPodcasts: Podcast[];
  popularPodcasts: Podcast[];
  reels: Podcast[];
  albums: Album[];
  topCreators: TopCreator[];
}

/** CMS pages managed from the dashboard (`manage-web`). */
export type ContentPageKey = 'about' | 'terms' | 'privacy';

export interface ContentPage {
  key: ContentPageKey;
  title: string;
  /** HTML from the dashboard editor (render with `htmlToBlocks`). */
  body: string;
  updatedAt: ISODate;
}

/** `/manage/get-contact-us` — set from the dashboard. */
export interface SupportContact {
  email?: string;
  phone_number?: string;
}

export interface FaqItem {
  _id: ID;
  question: string;
  answer: string;
}
