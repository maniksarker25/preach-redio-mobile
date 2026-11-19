import type { ISODate } from '@/types/models';

/** Deterministic artwork. Seeds keep images stable between launches (and cacheable). */
export const artwork = (seed: string, w = 600, h = w) => `https://picsum.photos/seed/pr-${seed}/${w}/${h}`;

/** Placeholder portraits for mock people. */
export const portrait = (n: number) => `https://i.pravatar.cc/300?img=${n}`;

/** Fake CDN locations. Nothing is fetched while playback is mocked. */
export const mediaUrl = (id: string, kind: 'audio' | 'video') =>
  `https://cdn.preachradio.com/mock/${id}.${kind === 'audio' ? 'mp3' : 'mp4'}`;
export const hlsUrl = (id: string) => `https://cdn.preachradio.com/mock/media/${id}/master.m3u8`;

const DAY = 86_400_000;
export const daysAgo = (days: number, hours = 0): ISODate => new Date(Date.now() - days * DAY - hours * 3_600_000).toISOString();
export const daysAhead = (days: number): ISODate => new Date(Date.now() + days * DAY).toISOString();

/** Seconds → the backend's legacy "minutes.seconds" number (247s → 4.07). */
export const toLegacyDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return Number(`${m}.${String(s).padStart(2, '0')}`);
};

/** Simulated network latency so loading states are visible in the UI. */
export const latency = (ms = 350) => new Promise<void>((resolve) => setTimeout(resolve, ms));
