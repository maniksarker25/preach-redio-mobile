import type { Broadcaster } from '@/types/broadcaster';
import type { LiveSessionSummary, Station, TopCreator } from '@/types/models';

/** `Station` → Broadcaster */
export const stationToBroadcaster = (
  s: Station,
  extra: { live?: LiveSessionSummary; totalViews: number; podcastCount: number },
): Broadcaster => ({
  id: s._id,
  kind: 'station',
  name: s.name,
  tagline: 'Official station',
  description: s.description,
  avatar: s.profile_image,
  cover: s.cover_image,
  address: s.address,
  donationUrl: s.donationUrl,
  isLive: Boolean(extra.live),
  live: extra.live,
  totalViews: extra.totalViews,
  podcastCount: extra.podcastCount,
});

/** `TopCreator` (home aggregation) → Broadcaster */
export const topCreatorToBroadcaster = (c: TopCreator, podcastCount: number, description?: string, address?: string): Broadcaster => ({
  id: c.creatorId,
  kind: 'creator',
  name: c.name,
  tagline: address,
  description,
  avatar: c.profile_image,
  cover: c.profile_cover,
  address,
  donationUrl: c.donationLink,
  isLive: c.isLive,
  live: c.liveSession,
  totalViews: c.totalViews,
  podcastCount,
});
