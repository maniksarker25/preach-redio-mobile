import type { Podcast } from '@/types/models';

/** Length in seconds. Prefers `durationSeconds`; falls back to the legacy "minutes.seconds" value. */
export const podcastSeconds = (p: Pick<Podcast, 'duration' | 'durationSeconds'>): number => {
  if (typeof p.durationSeconds === 'number') return p.durationSeconds;
  const minutes = Math.floor(p.duration);
  const seconds = Math.round((p.duration - minutes) * 100);
  return minutes * 60 + seconds;
};

/** 2724 → "45 min", 58 → "58 sec", 4210 → "1 hr 10 min" */
export const formatLength = (totalSeconds: number): string => {
  if (totalSeconds < 60) return `${Math.round(totalSeconds)} sec`;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
};

/** 125 → "2:05", 3725 → "1:02:05" */
export const formatClock = (totalSeconds: number): string => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
};

/** 48210 → "48.2K", 1_250_000 → "1.3M" */
export const formatCount = (n: number): string => {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, '')}K`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
};

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
];

/** ISO date → "3 days ago" / "just now" */
export const timeAgo = (iso: string): string => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  for (const [unit, secs] of UNITS) {
    if (diff >= secs) {
      const v = Math.floor(diff / secs);
      return `${v} ${unit}${v === 1 ? '' : 's'} ago`;
    }
  }
  return 'just now';
};

/** Minutes since a live session started → "Live for 42 min" */
export const liveFor = (startedAt: string): string => `Live for ${formatLength((Date.now() - new Date(startedAt).getTime()) / 1000)}`;

/** "Pastor Elijah Mensah" → "PE" */
export const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

export const greeting = (date = new Date()): string => {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};
