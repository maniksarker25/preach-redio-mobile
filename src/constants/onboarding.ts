/** Onboarding copy and imagery. Swap the image URLs for bundled brand photography before release. */
const image = (seed: string) => `https://picsum.photos/seed/pr-${seed}/900/1200`;

export const ONBOARDING_SLIDES = [
  {
    key: 'listen',
    eyebrow: 'Listen',
    title: 'Messages that meet you where you are',
    body: 'Sermons, Bible studies and devotionals from preachers around the world.',
    image: image('onboard-listen'),
  },
  {
    key: 'watch',
    eyebrow: 'Watch',
    title: 'Full sermons and Preach Clips',
    body: 'Watch whole services, or catch a two-minute word between meetings.',
    image: image('onboard-watch'),
  },
  {
    key: 'live',
    eyebrow: 'Go live',
    title: 'Tune in to live radio',
    body: 'Join worship nights, prayer watches and Sunday services as they happen.',
    image: image('onboard-live'),
  },
] as const;
