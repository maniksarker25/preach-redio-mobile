import type { Podcast, ProfileRef } from '@/types/models';

/** The API rule: play `hlsUrl` when present, otherwise the original upload. */
export const playbackUrl = (p: Pick<Podcast, 'hlsUrl' | 'podcast_url'>): string | undefined => p.hlsUrl ?? p.podcast_url;

/** A podcast belongs to a creator OR the station. */
export const ownerOf = (p: Pick<Podcast, 'creator' | 'station'>): ProfileRef | null => p.creator ?? p.station ?? null;

export const ownerName = (p: Pick<Podcast, 'creator' | 'station'>): string => ownerOf(p)?.name ?? 'Preach Radio';

export const isClip = (p: Pick<Podcast, 'type'>) => p.type === 'clip';

export const isVideo = (p: Pick<Podcast, 'mediaType'>) => p.mediaType === 'video';

export const isVertical = (p: Pick<Podcast, 'videoWidth' | 'videoHeight'>) =>
  Boolean(p.videoWidth && p.videoHeight && p.videoHeight > p.videoWidth);

export const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');
