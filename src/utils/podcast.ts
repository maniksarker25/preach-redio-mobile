import type { Podcast, ProfileRef } from '@/types/models';
import { podcastSeconds } from './format';

/** The API rule: play `hlsUrl` when present, otherwise the original upload. */
export const playbackUrl = (p: Pick<Podcast, 'hlsUrl' | 'podcast_url'>): string | undefined => p.hlsUrl ?? p.podcast_url;

/** A podcast belongs to a creator OR the station. */
export const ownerOf = (p: Pick<Podcast, 'creator' | 'station'>): ProfileRef | null => p.creator ?? p.station ?? null;

export const ownerName = (p: Pick<Podcast, 'creator' | 'station'>): string => ownerOf(p)?.name ?? 'Preach Radio';

export const isClip = (p: Pick<Podcast, 'type'>) => p.type === 'clip';

export const isVideo = (p: Pick<Podcast, 'mediaType'>) => p.mediaType === 'video';

export const isVertical = (p: Pick<Podcast, 'videoWidth' | 'videoHeight'>) => Boolean(p.videoWidth && p.videoHeight && p.videoHeight > p.videoWidth);

export const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');

const VIDEO_EXT = /\.(mp4|m4v|mov|webm|m3u8)(\?|$)/i;

/**
 * Fill the fields legacy API records may omit, so cards and the player never see `undefined`.
 * `fallbackType` is what the endpoint guarantees (the clip feed only returns clips, `type=episode` only episodes).
 */
export const normalizePodcast = (p: Podcast, fallbackType: NonNullable<Podcast['type']>): Podcast => ({
  ...p,
  type: p.type ?? fallbackType,
  mediaType: p.mediaType ?? (p.hlsUrl || VIDEO_EXT.test(p.podcast_url ?? '') ? 'video' : 'audio'),
  tags: p.tags ?? [],
  totalLikes: p.totalLikes ?? 0,
  totalView: p.totalView ?? 0,
});

const CLIP_MAX_SECONDS = 120;

/**
 * A podcast populated inside another record (watch history, bookmarks). A category deleted since comes back
 * null (cards read `category.name`); legacy rows (and older servers) have no `type`, so ≤ 2 minutes means a clip.
 */
export const fromPopulatedPodcast = (p: Podcast): Podcast =>
  normalizePodcast(
    { ...p, category: p.category ?? { _id: '', name: 'Podcast' }, subCategory: p.subCategory ?? { _id: '', name: '' } },
    podcastSeconds({ duration: p.duration ?? 0, durationSeconds: p.durationSeconds }) <= CLIP_MAX_SECONDS ? 'clip' : 'episode',
  );
