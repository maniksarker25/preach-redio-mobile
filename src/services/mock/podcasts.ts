import type { Podcast, PodcastMediaType, PodcastType, ProfileRef } from '@/types/models';
import { categoryById, subCategoryById } from './catalog';
import { artwork, daysAgo, hlsUrl, mediaUrl, toLegacyDuration } from './helpers';
import { creatorById, station } from './people';

interface Seed {
  id: string;
  title: string;
  /** creator id, or 'station' for platform uploads */
  by: string;
  sub: string;
  media: PodcastMediaType;
  type?: PodcastType;
  seconds: number;
  views: number;
  likes: number;
  age: number;
  tags: string[];
  description: string;
  /** clips: the episode they were cut from */
  source?: string;
  /** vertical video (clips) */
  vertical?: boolean;
  /** cover intentionally missing — exercises the fallback artwork */
  noCover?: boolean;
}

const seeds: Seed[] = [
  // ——— Sermons & full messages
  { id: 'pod_anchored', title: 'Anchored: Faith That Holds in the Storm', by: 'cr_elijah', sub: 'sub_faith', media: 'video', seconds: 2724, views: 48210, likes: 3920, age: 1, tags: ['faith', 'hope', 'hebrews'], description: 'Hebrews 6:19 calls hope an anchor for the soul. Pastor Elijah walks through what it means to stay steady when life refuses to be calm.' },
  { id: 'pod_grace-enough', title: 'Grace Is Enough', by: 'station', sub: 'sub_sunday', media: 'video', seconds: 3180, views: 61540, likes: 5210, age: 3, tags: ['grace', 'sunday service'], description: 'Sunday service recorded live at Preach Radio. A message on 2 Corinthians 12:9 and the strength that shows up in weakness.' },
  { id: 'pod_lead-like-shepherd', title: 'Lead Like a Shepherd', by: 'cr_thomas', sub: 'sub_leadership', media: 'audio', seconds: 2290, views: 18320, likes: 1240, age: 5, tags: ['leadership', 'psalm 23'], description: 'Bishop Thomas Hale on servant leadership at home, at work and in the church, drawn from Psalm 23 and John 10.' },
  { id: 'pod_mustard-seed', title: 'Mustard Seed Faith', by: 'cr_daniel', sub: 'sub_faith', media: 'audio', seconds: 1985, views: 22870, likes: 1890, age: 2, tags: ['faith', 'parables'], description: 'Small beginnings are not small to God. Pastor Daniel unpacks the parable of the mustard seed.' },
  { id: 'pod_new-mercies', title: 'New Mercies Every Morning', by: 'cr_grace', sub: 'sub_grace', media: 'video', seconds: 2460, views: 35110, likes: 2950, age: 6, tags: ['lamentations', 'mercy'], description: 'Rev. Grace Thompson preaches from Lamentations 3 on finding mercy on the other side of grief.' },
  { id: 'pod_valley', title: 'Through the Valley', by: 'cr_elijah', sub: 'sub_sunday', media: 'audio', seconds: 2875, views: 14980, likes: 1105, age: 9, tags: ['psalm 23', 'comfort'], description: 'A Sunday message for anyone walking through loss, illness or a season that feels too long.' },
  { id: 'pod_called-out', title: 'Called Out of the Boat', by: 'cr_marcus', sub: 'sub_identity', media: 'video', seconds: 1840, views: 27640, likes: 2680, age: 4, tags: ['youth', 'courage', 'matthew 14'], description: 'Pastor Marcus challenges students to step out like Peter, eyes on Jesus instead of the waves.' },
  { id: 'pod_romans-8', title: 'Romans 8: No Condemnation', by: 'cr_daniel', sub: 'sub_epistles', media: 'audio', seconds: 3320, views: 12450, likes: 990, age: 12, tags: ['romans', 'bible study'], description: 'A verse-by-verse study through Romans 8, the chapter that starts with "no condemnation" and ends with "no separation".' },
  { id: 'pod_genesis-1', title: 'In the Beginning: Genesis 1–3', by: 'station', sub: 'sub_old-testament', media: 'audio', seconds: 3610, views: 9870, likes: 640, age: 15, tags: ['genesis', 'bible study'], description: 'Midweek Bible study on creation, the fall and the first promise of redemption.' },
  { id: 'pod_sermon-mount', title: 'The Sermon on the Mount, Part 1', by: 'cr_grace', sub: 'sub_gospels', media: 'audio', seconds: 2940, views: 15630, likes: 1320, age: 8, tags: ['matthew 5', 'beatitudes'], description: 'Part one of a six-week walk through Matthew 5–7, starting with the Beatitudes.' },
  { id: 'pod_morning-prayer', title: 'Morning Prayer: Psalm 5', by: 'cr_ruth', sub: 'sub_morning-prayer', media: 'audio', seconds: 905, views: 20410, likes: 2210, age: 1, tags: ['prayer', 'psalms'], description: 'Fifteen minutes of guided prayer to start your day, led by Evangelist Ruth Adeleke.' },
  { id: 'pod_standing-gap', title: 'Standing in the Gap', by: 'cr_ruth', sub: 'sub_intercession', media: 'video', seconds: 2105, views: 11290, likes: 980, age: 11, tags: ['intercession', 'prayer'], description: 'A teaching on intercessory prayer and praying for your city, your family and the nations.' },
  { id: 'pod_worship-night', title: 'Worship Night: Holy Ground', by: 'cr_rachel', sub: 'sub_live-worship', media: 'video', seconds: 4210, views: 54320, likes: 6120, age: 7, tags: ['worship', 'live'], description: 'Recorded live: an hour of worship with Rachel Kim and band.' },
  { id: 'pod_acoustic-psalms', title: 'Acoustic Psalms, Vol. 2', by: 'cr_rachel', sub: 'sub_acoustic', media: 'audio', seconds: 1760, views: 19850, likes: 2440, age: 14, tags: ['worship', 'acoustic', 'psalms'], description: 'Stripped-back songs drawn straight from the Psalms. Ideal for quiet time.', noCover: true },
  { id: 'pod_covenant', title: 'Covenant Love in Marriage', by: 'cr_thomas', sub: 'sub_marriage', media: 'audio', seconds: 2580, views: 16720, likes: 1480, age: 10, tags: ['marriage', 'family'], description: 'Bishop Thomas and his wife Linda on covenant, conflict and staying in love for the long haul.' },
  { id: 'pod_raising-kids', title: 'Raising Kids Who Love God', by: 'cr_grace', sub: 'sub_parenting', media: 'audio', seconds: 2210, views: 13340, likes: 1150, age: 18, tags: ['parenting', 'family'], description: 'Practical, grace-filled parenting from Deuteronomy 6.' },
  { id: 'pod_healed', title: 'Healed: Amara’s Story', by: 'station', sub: 'sub_healing', media: 'video', seconds: 1320, views: 30980, likes: 3540, age: 2, tags: ['testimony', 'healing'], description: 'After three years of illness, Amara shares how faith and community carried her through.' },
  { id: 'pod_prodigal', title: 'The Prodigal Came Home', by: 'cr_marcus', sub: 'sub_restoration', media: 'audio', seconds: 1540, views: 10230, likes: 890, age: 20, tags: ['testimony', 'restoration'], description: 'A father and son on twelve years of distance and one phone call that changed everything.' },
  { id: 'pod_daily-word-1', title: 'Daily Word: Be Still', by: 'cr_ruth', sub: 'sub_daily-word', media: 'audio', seconds: 420, views: 8840, likes: 760, age: 0, tags: ['devotional', 'psalm 46'], description: 'A seven-minute devotional on Psalm 46:10.' },
  { id: 'pod_daily-word-2', title: 'Daily Word: Walk in Love', by: 'cr_ruth', sub: 'sub_daily-word', media: 'audio', seconds: 455, views: 7310, likes: 640, age: 1, tags: ['devotional', 'ephesians'], description: 'A short devotional on Ephesians 5:2.' },
  { id: 'pod_campus-revival', title: 'Campus Revival Night', by: 'cr_marcus', sub: 'sub_campus', media: 'video', seconds: 3050, views: 21470, likes: 2390, age: 16, tags: ['youth', 'campus', 'worship'], description: 'Hundreds of students, one night of worship and a message on first love.' },
  { id: 'pod_kingdom-first', title: 'Seek the Kingdom First', by: 'cr_daniel', sub: 'sub_sunday', media: 'video', seconds: 2635, views: 25960, likes: 2120, age: 6, tags: ['matthew 6', 'priorities'], description: 'Pastor Daniel on worry, provision and putting first things first.' },

  // ——— Preach Clips (reels, ≤ 2 minutes)
  { id: 'clip_anchor', title: 'Hope is an anchor, not a feeling', by: 'cr_elijah', sub: 'sub_faith', media: 'video', type: 'clip', seconds: 58, views: 128400, likes: 18320, age: 1, tags: ['faith'], description: 'From “Anchored”.', source: 'pod_anchored', vertical: true },
  { id: 'clip_weakness', title: 'His strength in your weakness', by: 'station', sub: 'sub_sunday', media: 'video', type: 'clip', seconds: 74, views: 98760, likes: 14210, age: 2, tags: ['grace'], description: 'A moment from Sunday service.', source: 'pod_grace-enough', vertical: true },
  { id: 'clip_step-out', title: 'Step out of the boat', by: 'cr_marcus', sub: 'sub_identity', media: 'video', type: 'clip', seconds: 46, views: 85420, likes: 12980, age: 3, tags: ['youth'], description: 'Pastor Marcus to students.', source: 'pod_called-out', vertical: true },
  { id: 'clip_mercy', title: 'Mercy meets you in the morning', by: 'cr_grace', sub: 'sub_grace', media: 'video', type: 'clip', seconds: 62, views: 66310, likes: 9870, age: 5, tags: ['mercy'], description: 'Lamentations 3:22–23.', source: 'pod_new-mercies', vertical: true },
  { id: 'clip_holy-ground', title: 'Holy Ground (live)', by: 'cr_rachel', sub: 'sub_live-worship', media: 'video', type: 'clip', seconds: 95, views: 143900, likes: 24110, age: 6, tags: ['worship'], description: 'The moment the room went quiet.', source: 'pod_worship-night', vertical: true },
  { id: 'clip_first', title: 'Put first things first', by: 'cr_daniel', sub: 'sub_sunday', media: 'video', type: 'clip', seconds: 51, views: 54280, likes: 7620, age: 6, tags: ['priorities'], description: 'Matthew 6:33.', source: 'pod_kingdom-first', vertical: true },
  { id: 'clip_amara', title: '“I was not alone”', by: 'station', sub: 'sub_healing', media: 'video', type: 'clip', seconds: 88, views: 71250, likes: 11340, age: 2, tags: ['testimony'], description: 'Amara’s testimony.', source: 'pod_healed', vertical: true },
  { id: 'clip_pray-city', title: 'Pray for your city', by: 'cr_ruth', sub: 'sub_intercession', media: 'video', type: 'clip', seconds: 39, views: 32940, likes: 5110, age: 10, tags: ['prayer'], description: 'Jeremiah 29:7.', source: 'pod_standing-gap', vertical: true },
];

const ref = (by: string): { creator: ProfileRef | null; station: ProfileRef | null } => {
  if (by === 'station') {
    return { creator: null, station: { _id: station._id, name: station.name, profile_image: station.profile_image } };
  }
  const c = creatorById(by);
  return { creator: c ? { _id: c._id, name: c.name, profile_image: c.profile_image } : null, station: null };
};

const build = (s: Seed): Podcast => {
  const subCategory = subCategoryById(s.sub);
  const category = categoryById(subCategory?.category ?? '');
  const created = daysAgo(s.age, (s.views % 20) + 1);
  return {
    _id: s.id,
    ...ref(s.by),
    category: { _id: category?._id ?? 'cat_sermons', name: category?.name ?? 'Sermons' },
    subCategory: { _id: subCategory?._id ?? s.sub, name: subCategory?.name ?? '' },
    coverImage: s.noCover ? null : artwork(s.id, s.vertical ? 540 : 800, s.vertical ? 960 : s.media === 'video' ? 450 : 800),
    podcast_url: mediaUrl(s.id, s.media),
    hlsUrl: hlsUrl(s.id),
    processing: { status: 'ready' },
    videoWidth: s.media === 'video' ? (s.vertical ? 1080 : 1920) : null,
    videoHeight: s.media === 'video' ? (s.vertical ? 1920 : 1080) : null,
    mediaType: s.media,
    type: s.type ?? 'episode',
    sourcePodcast: s.source ?? null,
    status: 'published',
    title: s.title,
    description: s.description,
    tags: s.tags,
    totalView: s.views,
    totalLikes: s.likes,
    duration: toLegacyDuration(s.seconds),
    durationSeconds: s.seconds,
    isLike: false,
    isBookmark: false,
    createdAt: created,
    updatedAt: created,
  };
};

export const podcasts: Podcast[] = seeds.map(build);

export const podcastById = (id: string) => podcasts.find((p) => p._id === id);
