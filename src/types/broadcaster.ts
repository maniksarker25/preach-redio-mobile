import type { ID, LiveSessionSummary, ProfileRef } from './models';

/**
 * UI view-model for the "Radio" experience.
 *
 * The backend has two kinds of broadcaster: the official `Station` and approved
 * `Creator` channels (both have a profile, a cover, podcasts and live rooms).
 * Repositories map both into this shape so radio screens don't care which it is.
 */
export interface Broadcaster {
  id: ID;
  kind: 'station' | 'creator';
  name: string;
  tagline?: string;
  description?: string;
  avatar?: string;
  cover?: string;
  address?: string;
  donationUrl?: string;
  isLive: boolean;
  live?: LiveSessionSummary;
  totalViews: number;
  podcastCount: number;
}

export const toProfileRef = (b: Broadcaster): ProfileRef => ({ _id: b.id, name: b.name, profile_image: b.avatar });
