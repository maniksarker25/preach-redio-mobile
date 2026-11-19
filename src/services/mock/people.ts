import type { Creator, NormalUserProfile, Station, User } from '@/types/models';
import { artwork, daysAgo, portrait } from './helpers';

/** The official broadcaster, seeded once by the backend (`DB/station.ts`). */
export const station: Station = {
  _id: 'stn_preachradio',
  name: 'Preach Radio',
  description:
    'The official Preach Radio station. Sunday services, midweek Bible study and worship nights, broadcast live and on demand.',
  address: 'Atlanta, Georgia, USA',
  location: { type: 'Point', coordinates: [-84.388, 33.749] },
  donationUrl: 'https://preachradio.com/give',
  profile_image: artwork('station-avatar', 300),
  cover_image: artwork('station-cover', 1200, 600),
  createdAt: daysAgo(420),
};

type CreatorSeed = [id: string, name: string, address: string, portraitNo: number, coords: [number, number]];

const creatorSeeds: CreatorSeed[] = [
  ['cr_elijah', 'Pastor Elijah Mensah', 'Accra, Ghana', 12, [-0.187, 5.603]],
  ['cr_grace', 'Rev. Grace Thompson', 'Atlanta, GA', 47, [-84.39, 33.75]],
  ['cr_daniel', 'Pastor Daniel Okoro', 'Lagos, Nigeria', 13, [3.379, 6.524]],
  ['cr_rachel', 'Rachel Kim Worship', 'Los Angeles, CA', 45, [-118.244, 34.052]],
  ['cr_marcus', 'Pastor Marcus Reid', 'Houston, TX', 59, [-95.369, 29.76]],
  ['cr_ruth', 'Evangelist Ruth Adeleke', 'London, UK', 44, [-0.128, 51.507]],
  ['cr_thomas', 'Bishop Thomas Hale', 'Dallas, TX', 68, [-96.797, 32.777]],
];

export const creators: Creator[] = creatorSeeds.map(([_id, name, address, n, coordinates], i) => ({
  _id,
  user: `usr_${_id}`,
  name,
  email: `${_id.replace('cr_', '')}@example.com`,
  address,
  profile_image: portrait(n),
  profile_cover: artwork(`${_id}-cover`, 1200, 600),
  location: { type: 'Point', coordinates },
  isApproved: true,
  donationLink: i % 2 === 0 ? `https://preachradio.com/give/${_id}` : undefined,
  createdAt: daysAgo(300 - i * 20),
}));

export const creatorById = (id: string) => creators.find((c) => c._id === id);

/** The signed-in listener used by the mock session. */
export const currentUser: User = {
  _id: 'usr_me',
  profileId: 'nu_me',
  email: 'listener@example.com',
  role: 'user',
  isVerified: true,
  isBlocked: false,
  isRegistrationCompleted: true,
};

export const currentProfile: NormalUserProfile = {
  _id: 'nu_me',
  user: 'usr_me',
  name: 'Jordan Hayes',
  email: 'listener@example.com',
  phone: '+1 404 555 0142',
  profile_image: portrait(33),
  profile_cover: artwork('me-cover', 1200, 600),
  address: 'Atlanta, GA',
  gender: 'Male',
  dateOfBirth: '1994-05-14T00:00:00.000Z',
};
