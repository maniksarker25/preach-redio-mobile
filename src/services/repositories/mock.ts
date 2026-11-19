import { ApiError, type Paginated } from '@/types/api';
import type { Broadcaster } from '@/types/broadcaster';
import type { Comment, Podcast } from '@/types/models';
import { categories, subCategories } from '../mock/catalog';
import { albums, banners } from '../mock/collections';
import { commentsFor, contentPages, faqs, notifications } from '../mock/engagement';
import { latency } from '../mock/helpers';
import { previousLives, stationLive, stationTotalViews, topCreators } from '../mock/live';
import { creatorById, currentProfile, currentUser, station } from '../mock/people';
import { podcastById, podcasts } from '../mock/podcasts';
import { stationToBroadcaster, topCreatorToBroadcaster } from './mappers';
import type {
  AlbumRepository,
  AuthRepository,
  BroadcasterRepository,
  CatalogRepository,
  ContentRepository,
  EngagementRepository,
  HomeRepository,
  NotificationRepository,
  PodcastDetail,
  PodcastQuery,
  PodcastRepository,
  Session,
} from './types';

/* Hidden podcasts never leave the API; mirror that rule here. */
const visible = () => podcasts.filter((p) => p.status !== 'hidden');
const isClip = (p: Podcast) => p.type === 'clip';
const ownerId = (p: Podcast) => p.creator?._id ?? p.station?._id;
const notFound = (what: string) => new ApiError(`${what} not found`, 404);

const paginate = <T>(items: T[], page = 1, limit = 20): Paginated<T> => ({
  meta: { page, limit, total: items.length, totalPage: Math.max(1, Math.ceil(items.length / limit)) },
  result: items.slice((page - 1) * limit, page * limit),
});

const matches = (p: Podcast, term: string) => {
  const t = term.toLowerCase();
  return (
    p.title.toLowerCase().includes(t) ||
    p.description.toLowerCase().includes(t) ||
    p.tags.some((tag) => tag.toLowerCase().includes(t)) ||
    (p.creator?.name ?? p.station?.name ?? '').toLowerCase().includes(t)
  );
};

/* ------------------------------------------------------------ podcasts */

const filterPodcasts = (q: PodcastQuery = {}) => {
  let list = visible();
  if (q.type) list = list.filter((p) => (p.type ?? 'episode') === q.type);
  if (q.mediaType) list = list.filter((p) => p.mediaType === q.mediaType);
  if (q.category) list = list.filter((p) => p.category._id === q.category);
  if (q.subCategory) list = list.filter((p) => p.subCategory._id === q.subCategory);
  if (q.owner) list = list.filter((p) => ownerId(p) === q.owner);
  if (q.searchTerm) list = list.filter((p) => matches(p, q.searchTerm!));
  return [...list].sort((a, b) =>
    q.sort === 'popular' ? b.totalView - a.totalView : b.createdAt.localeCompare(a.createdAt),
  );
};

const podcastCountBy = (id: string) => visible().filter((p) => ownerId(p) === id && !isClip(p)).length;

const broadcasters = (): Broadcaster[] => [
  stationToBroadcaster(station, { live: stationLive, totalViews: stationTotalViews, podcastCount: podcastCountBy(station._id) }),
  ...topCreators.map((c) => topCreatorToBroadcaster(c, podcastCountBy(c.creatorId), undefined, creatorById(c.creatorId)?.address)),
];

/** The demo creator account owns these uploads. */
export const DEMO_CREATOR_ID = 'cr_elijah';

export const mockPodcastRepository: PodcastRepository = {
  async mine(type) {
    await latency();
    return filterPodcasts({ owner: DEMO_CREATOR_ID, type });
  },
  async create(input) {
    await latency(900);
    if (input.type === 'clip' && input.durationSeconds > 120) throw new ApiError('Clips can be at most 2 minutes long', 400);
    if (input.type === 'episode' && !input.address?.trim()) throw new ApiError('Add a location for full episodes', 400);
    const creator = creatorById(DEMO_CREATOR_ID)!;
    const sub = subCategories.find((s) => s._id === input.subCategory);
    const cat = categories.find((c) => c._id === input.category);
    const now = new Date().toISOString();
    const podcast: Podcast = {
      _id: `pod_local_${Date.now()}`,
      creator: { _id: creator._id, name: creator.name, profile_image: creator.profile_image },
      station: null,
      category: { _id: input.category, name: cat?.name ?? '' },
      subCategory: { _id: input.subCategory, name: sub?.name ?? '' },
      coverImage: input.coverUri ?? null,
      podcast_url: input.fileUri,
      hlsUrl: null,
      processing: { status: 'processing' },
      mediaType: input.mediaType,
      type: input.type,
      sourcePodcast: input.sourcePodcast ?? null,
      status: 'published',
      title: input.title,
      description: input.description,
      address: input.address,
      tags: input.tags,
      totalView: 0,
      totalLikes: 0,
      duration: Number(`${Math.floor(input.durationSeconds / 60)}.${String(input.durationSeconds % 60).padStart(2, '0')}`),
      durationSeconds: input.durationSeconds,
      createdAt: now,
      updatedAt: now,
    };
    podcasts.unshift(podcast);
    return podcast;
  },
  async remove(id) {
    await latency(400);
    const i = podcasts.findIndex((p) => p._id === id);
    if (i >= 0) podcasts.splice(i, 1);
  },
  async list(query) {
    await latency();
    return paginate(filterPodcasts(query), query?.page, query?.limit);
  },
  async getById(id) {
    await latency(250);
    const p = podcastById(id);
    if (!p || p.status === 'hidden') throw notFound('Podcast');
    const sourceId = typeof p.sourcePodcast === 'string' ? p.sourcePodcast : null;
    const source = sourceId ? podcastById(sourceId) : undefined;
    const detail: PodcastDetail = {
      ...p,
      sourcePodcast: source
        ? {
            _id: source._id,
            title: source.title,
            coverImage: source.coverImage,
            mediaType: source.mediaType,
            duration: source.duration,
            durationSeconds: source.durationSeconds,
          }
        : null,
    };
    return detail;
  },
  async getMany(ids) {
    await latency(200);
    return ids.map((id) => podcastById(id)).filter((p): p is Podcast => Boolean(p && p.status !== 'hidden'));
  },
  async related(id, limit = 8) {
    await latency(250);
    const p = podcastById(id);
    if (!p) return [];
    return visible()
      .filter((o) => o._id !== id && !isClip(o) && (ownerId(o) === ownerId(p) || o.category._id === p.category._id))
      .slice(0, limit);
  },
  async search(term) {
    await latency(300);
    const t = term.trim().toLowerCase();
    if (!t) return { podcasts: [], broadcasters: [], albums: [] };
    return {
      podcasts: visible().filter((p) => matches(p, t)),
      broadcasters: broadcasters().filter((b) => b.name.toLowerCase().includes(t)),
      albums: albums.filter((a) => a.name.toLowerCase().includes(t) || a.tags.some((tag) => tag.includes(t))),
    };
  },
};

/* ---------------------------------------------------------------- home */

export const mockHomeRepository: HomeRepository = {
  async getFeed() {
    await latency(600);
    const episodes = filterPodcasts({ type: 'episode' });
    return {
      categories: categories.slice(0, 10),
      newestPodcasts: episodes.slice(0, 10),
      popularPodcasts: [...episodes].sort((a, b) => b.totalView - a.totalView).slice(0, 10),
      reels: filterPodcasts({ type: 'clip' }).slice(0, 10),
      albums,
      topCreators,
      banners,
      liveNow: broadcasters().filter((b) => b.isLive),
      sermons: episodes.filter((p) => p.mediaType === 'video').slice(0, 10),
    };
  },
};

/* ------------------------------------------------------------- catalog */

export const mockCatalogRepository: CatalogRepository = {
  async categories() {
    await latency(200);
    return categories;
  },
  async subCategories(categoryId) {
    await latency(150);
    return categoryId ? subCategories.filter((s) => s.category === categoryId) : subCategories;
  },
  async category(id) {
    await latency(150);
    const c = categories.find((x) => x._id === id);
    if (!c) throw notFound('Category');
    return c;
  },
};

export const mockAlbumRepository: AlbumRepository = {
  async list() {
    await latency(250);
    return albums;
  },
  async getById(id) {
    await latency(300);
    const a = albums.find((x) => x._id === id);
    if (!a) throw notFound('Album');
    return { ...a, podcasts: a.podcasts.map((pid) => podcastById(pid)).filter((p): p is Podcast => Boolean(p)) };
  },
};

export const mockBroadcasterRepository: BroadcasterRepository = {
  async list() {
    await latency(300);
    return broadcasters();
  },
  async getById(id) {
    await latency(250);
    const b = broadcasters().find((x) => x.id === id);
    if (!b) throw notFound('Station');
    return b;
  },
  async previousLives(id) {
    await latency(250);
    return id ? previousLives.filter((r) => r.creator === id || r.station === id) : previousLives;
  },
};

/* ----------------------------------------------------------- engagement */

const addedComments: Record<string, Comment[]> = {};

export const mockEngagementRepository: EngagementRepository = {
  async comments(podcastId) {
    await latency(300);
    return [...(addedComments[podcastId] ?? []), ...commentsFor(podcastId)];
  },
  async addComment(podcastId, text, author) {
    await latency(250);
    const comment: Comment = {
      _id: `cmt_local_${Date.now()}`,
      podcast: podcastId,
      text,
      likers: [],
      parent: null,
      commentor: author,
      commentorType: 'NormalUser',
      createdAt: new Date().toISOString(),
      replies: [],
    };
    addedComments[podcastId] = [comment, ...(addedComments[podcastId] ?? [])];
    return comment;
  },
};

export const mockNotificationRepository: NotificationRepository = {
  async list() {
    await latency(300);
    return notifications;
  },
};

export const mockContentRepository: ContentRepository = {
  async page(key) {
    await latency(200);
    return contentPages[key];
  },
  async faqs() {
    await latency(200);
    return faqs;
  },
};

/* ----------------------------------------------------------------- auth */

const session = (email: string, role: 'user' | 'creator' = 'user'): Session => ({
  accessToken: `mock.${Date.now()}`,
  user: { ...currentUser, email, role },
  profile: { ...currentProfile, email },
});

const requireEmail = (email: string) => {
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new ApiError('Enter a valid email address', 400);
};

/** Accepts any well-formed input; code `000000` simulates a wrong OTP. */
export const mockAuthRepository: AuthRepository = {
  async login(email, password) {
    await latency(700);
    requireEmail(email);
    if (password.length < 6) throw new ApiError('Incorrect email or password', 401);
    return session(email, email.startsWith('creator') ? 'creator' : 'user');
  },
  async register({ email, password }) {
    await latency(700);
    requireEmail(email);
    if (password.length < 8) throw new ApiError('Password must be at least 8 characters', 400);
    return { email };
  },
  async verifyCode(email, code) {
    await latency(600);
    if (code === '000000' || code.length !== 6) throw new ApiError('That code is not correct', 400);
    return session(email);
  },
  async forgotPassword(email) {
    await latency(600);
    requireEmail(email);
  },
  async verifyResetCode(_email, code) {
    await latency(500);
    if (code === '000000' || code.length !== 6) throw new ApiError('That code is not correct', 400);
  },
  async resetPassword(_email, password) {
    await latency(600);
    if (password.length < 8) throw new ApiError('Password must be at least 8 characters', 400);
  },
  async changePassword(_old, next) {
    await latency(600);
    if (next.length < 8) throw new ApiError('Password must be at least 8 characters', 400);
  },
};
