import type { Album, Banner, Playlist } from '@/types/models';
import { artwork, daysAgo, daysAhead } from './helpers';

/** Albums are curated series built by admins in the dashboard. */
export const albums: Album[] = [
  {
    _id: 'alb_foundations',
    name: 'Foundations of Faith',
    description: 'A six-part series on the core of the Christian life: faith, grace, prayer and the Word.',
    tags: ['series', 'faith'],
    cover_image: artwork('alb-foundations'),
    podcasts: ['pod_anchored', 'pod_mustard-seed', 'pod_grace-enough', 'pod_romans-8', 'pod_kingdom-first', 'pod_valley'],
  },
  {
    _id: 'alb_sermon-mount',
    name: 'The Sermon on the Mount',
    description: 'Rev. Grace Thompson teaches through Matthew 5–7.',
    tags: ['bible study', 'gospels'],
    cover_image: artwork('alb-mount'),
    podcasts: ['pod_sermon-mount', 'pod_new-mercies', 'pod_raising-kids'],
  },
  {
    _id: 'alb_worship',
    name: 'Worship Sessions',
    description: 'Live and acoustic worship recorded across the Preach Radio community.',
    tags: ['worship'],
    cover_image: artwork('alb-worship'),
    podcasts: ['pod_worship-night', 'pod_acoustic-psalms', 'pod_campus-revival'],
  },
  {
    _id: 'alb_prayer',
    name: '30 Days of Prayer',
    description: 'Guided prayer and short devotionals for every morning of the month.',
    tags: ['prayer', 'devotional'],
    cover_image: artwork('alb-prayer'),
    podcasts: ['pod_morning-prayer', 'pod_daily-word-1', 'pod_daily-word-2', 'pod_standing-gap'],
  },
  {
    _id: 'alb_home',
    name: 'Faith at Home',
    description: 'Marriage, parenting and family life rooted in Scripture.',
    tags: ['family'],
    cover_image: artwork('alb-home'),
    podcasts: ['pod_covenant', 'pod_raising-kids', 'pod_lead-like-shepherd'],
  },
  {
    _id: 'alb_stories',
    name: 'Stories of Grace',
    description: 'Testimonies of healing, restoration and coming home.',
    tags: ['testimonies'],
    cover_image: artwork('alb-stories'),
    podcasts: ['pod_healed', 'pod_prodigal'],
  },
];

/** Home banners; `redirect_url` deep-links into the app or the web. */
export const banners: Banner[] = [
  {
    _id: 'bnr_worship-night',
    banner_url: artwork('banner-worship', 1200, 600),
    redirect_url: 'preachradio://podcast/pod_worship-night',
    startDate: daysAgo(3),
    endDate: daysAhead(10),
  },
  {
    _id: 'bnr_foundations',
    banner_url: artwork('banner-foundations', 1200, 600),
    redirect_url: 'preachradio://album/alb_foundations',
    startDate: daysAgo(10),
    endDate: daysAhead(20),
  },
  {
    _id: 'bnr_prayer',
    banner_url: artwork('banner-prayer', 1200, 600),
    redirect_url: 'preachradio://album/alb_prayer',
    startDate: daysAgo(1),
    endDate: daysAhead(30),
  },
];

export const playlists: Playlist[] = [
  {
    _id: 'pl_sunday',
    user: 'nu_me',
    userType: 'NormalUser',
    name: 'Sunday Drive',
    description: 'Messages for the ride to church.',
    tags: [],
    cover_image: artwork('pl-sunday'),
    podcasts: ['pod_grace-enough', 'pod_kingdom-first', 'pod_anchored'],
    createdAt: daysAgo(30),
  },
  {
    _id: 'pl_quiet',
    user: 'nu_me',
    userType: 'NormalUser',
    name: 'Quiet Time',
    description: 'Worship and prayer for the mornings.',
    tags: [],
    podcasts: ['pod_acoustic-psalms', 'pod_morning-prayer', 'pod_daily-word-1'],
    createdAt: daysAgo(12),
  },
];
