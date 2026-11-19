import type { StreamRoom, TopCreator } from '@/types/models';
import { artwork, daysAgo } from './helpers';
import { creators, station } from './people';
import { podcasts } from './podcasts';

/** Who is broadcasting right now (`liveSession.status === 'active'`). */
const liveNow: Record<string, { name: string; description: string; minutesIn: number }> = {
  cr_rachel: { name: 'Friday Night Worship', description: 'Live from Los Angeles. Bring your requests.', minutesIn: 42 },
  cr_elijah: { name: 'Midweek Word: Hebrews 11', description: 'Bible study and Q&A, live from Accra.', minutesIn: 18 },
  [station._id]: { name: 'Preach Radio Live: Evening Prayer', description: 'The official station. Prayer, worship and the Word.', minutesIn: 65 },
};

const latestBy = (id: string) =>
  podcasts
    .filter((p) => p.creator?._id === id || p.station?._id === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

const totalViewsBy = (id: string) =>
  podcasts.filter((p) => p.creator?._id === id || p.station?._id === id).reduce((sum, p) => sum + p.totalView, 0);

const liveSessionFor = (id: string) => {
  const live = liveNow[id];
  if (!live) return undefined;
  return {
    session_id: `ses_${id}`,
    name: live.name,
    description: live.description,
    coverImage: artwork(`live-${id}`, 800, 450),
    session_started_at: new Date(Date.now() - live.minutesIn * 60_000).toISOString(),
  };
};

/** Mirrors the `topCreators` aggregation on `get-home-data`: live first, then by views. */
export const topCreators: TopCreator[] = creators
  .map((c): TopCreator => {
    const latest = latestBy(c._id);
    return {
      creatorId: c._id,
      name: c.name,
      email: c.email,
      profile_image: c.profile_image,
      profile_cover: c.profile_cover,
      location: c.location,
      donationLink: c.donationLink,
      isLive: Boolean(liveNow[c._id]),
      totalViews: totalViewsBy(c._id),
      liveSession: liveSessionFor(c._id),
      latestPodcast: latest && {
        _id: latest._id,
        title: latest.title,
        description: latest.description,
        podcast_url: latest.podcast_url,
        hlsUrl: latest.hlsUrl,
        coverImage: latest.coverImage,
      },
    };
  })
  .sort((a, b) => Number(b.isLive) - Number(a.isLive) || b.totalViews - a.totalViews);

export const stationLive = liveSessionFor(station._id);
export const stationTotalViews = totalViewsBy(station._id);

/** Past broadcasts with recordings (`/live-streaming/get-previous-live`). */
export const previousLives: StreamRoom[] = [
  {
    _id: 'room_sunday-1',
    station: station._id,
    name: 'Sunday Service, Live',
    description: 'Full Sunday service with worship and the message.',
    status: 'ended',
    startTime: daysAgo(3, 4),
    endTime: daysAgo(3, 2),
    recordings: [{ session_id: 'ses_old_1', duration: 6840, url: 'https://cdn.preachradio.com/mock/rec/sunday-1.mp4' }],
  },
  {
    _id: 'room_prayer-1',
    creator: 'cr_ruth',
    name: 'Prayer Watch',
    description: 'An hour of intercession for the nations.',
    status: 'ended',
    startTime: daysAgo(5, 10),
    endTime: daysAgo(5, 9),
    recordings: [{ session_id: 'ses_old_2', duration: 3620, url: 'https://cdn.preachradio.com/mock/rec/prayer-1.mp4' }],
  },
  {
    _id: 'room_worship-1',
    creator: 'cr_rachel',
    name: 'Acoustic Worship Live',
    description: 'Unplugged worship session.',
    status: 'ended',
    startTime: daysAgo(8, 6),
    endTime: daysAgo(8, 5),
    recordings: [{ session_id: 'ses_old_3', duration: 4110, url: 'https://cdn.preachradio.com/mock/rec/worship-1.mp4' }],
  },
];
