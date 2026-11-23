import type { AppNotification, Comment, ContentPage, FaqItem } from '@/types/models';
import { daysAgo, portrait } from './helpers';

const people = [
  { _id: 'nu_1', name: 'Esther Mwangi', profile_image: portrait(5) },
  { _id: 'nu_2', name: 'Caleb Johnson', profile_image: portrait(15) },
  { _id: 'nu_3', name: 'Naomi Park', profile_image: portrait(26) },
  { _id: 'nu_4', name: 'David Asante', profile_image: portrait(53) },
  { _id: 'nu_5', name: 'Priscilla Obi', profile_image: portrait(32) },
] as const;

const texts = [
  'This message came right on time. Thank you, Pastor.',
  'Listened twice on my commute. The part about the anchor really stayed with me.',
  'Sharing this with my small group tonight 🙏',
  'Amen! Such a clear word.',
  'Can you do a follow-up on this passage?',
  'My whole family watched this together. Blessed.',
];

/** Comments per podcast, generated so every podcast has a believable thread. */
export const commentsFor = (podcastId: string): Comment[] => {
  const n = (podcastId.length % 4) + 3;
  return Array.from({ length: n }, (_, i) => {
    const who = people[(i + podcastId.length) % people.length]!;
    return {
      _id: `cmt_${podcastId}_${i}`,
      podcast: podcastId,
      text: texts[(i + podcastId.length) % texts.length]!,
      likers: Array.from({ length: (i * 7 + 3) % 40 }, (_, k) => `nu_x${k}`),
      parent: null,
      commentor: { ...who },
      commentorType: 'NormalUser',
      createdAt: daysAgo(i, i * 3 + 1),
      replies:
        i === 0
          ? [
              {
                _id: `cmt_${podcastId}_${i}_r`,
                podcast: podcastId,
                text: 'Same here. God is good.',
                likers: [],
                parent: `cmt_${podcastId}_${i}`,
                commentor: { ...people[(i + 2) % people.length]! },
                commentorType: 'NormalUser',
                createdAt: daysAgo(0, 2),
              },
            ]
          : [],
    };
  });
};

export const notifications: AppNotification[] = [
  {
    _id: 'ntf_1',
    title: 'Rachel Kim Worship is live',
    message: 'Friday Night Worship just started. Join now.',
    type: 'LIVE_INVITATION',
    redirectId: 'cr_rachel',
    isSeen: false,
    createdAt: daysAgo(0, 1),
  },
  {
    _id: 'ntf_2',
    title: 'New message from Pastor Elijah Mensah',
    message: '“Anchored: Faith That Holds in the Storm” is now available.',
    type: 'GENERAL',
    redirectId: 'pod_anchored',
    isSeen: false,
    createdAt: daysAgo(1),
  },
  { _id: 'ntf_3', title: 'Preach Radio is live', message: 'Evening Prayer is on air now.', type: 'LIVE_INVITATION', redirectId: 'stn_preachradio', isSeen: true, createdAt: daysAgo(1, 6) },
  { _id: 'ntf_4', title: 'Your subscription is active', message: 'Thank you for supporting Preach Radio. Enjoy ad-free listening.', type: 'PAYMENT', isSeen: true, createdAt: daysAgo(6) },
  {
    _id: 'ntf_5',
    title: 'New series: Foundations of Faith',
    message: 'Six messages on the core of the Christian life.',
    type: 'GENERAL',
    redirectId: 'alb_foundations',
    isSeen: true,
    createdAt: daysAgo(9),
  },
];

export const contentPages: Record<ContentPage['key'], ContentPage> = {
  about: {
    key: 'about',
    title: 'About Preach Radio',
    updatedAt: daysAgo(40),
    body: 'Preach Radio brings radio stations, podcasts, video and live broadcasts together in one app, for listeners, creators and stations.\n\nWe believe the Word belongs everywhere people are: on the commute, in the kitchen, on a night shift. Preach Radio gives preachers, worship leaders and ministries one home to share their messages, and gives listeners one place to find them.\n\nListen. Watch. Go live.',
  },
  terms: {
    key: 'terms',
    title: 'Terms & Conditions',
    updatedAt: daysAgo(60),
    body: 'By using Preach Radio you agree to these terms. Content is provided by creators and the Preach Radio station for personal, non-commercial use.\n\nCreators are responsible for the content they upload and must hold the rights to it. We may hide or remove content that violates our community guidelines.\n\nSubscriptions renew automatically until cancelled through your app store account.',
  },
  privacy: {
    key: 'privacy',
    title: 'Privacy Policy',
    updatedAt: daysAgo(60),
    body: 'We collect the information you give us (name, email, profile details) and information about how you use the app (listening history, likes, bookmarks) to provide and improve the service.\n\nWe never sell your personal data. You can delete your account at any time from Settings; deleting a creator account also deletes that creator’s podcasts.\n\nContact privacy@preachradio.com with any questions.',
  },
};

export const faqs: FaqItem[] = [
  { _id: 'faq_1', question: 'Is Preach Radio free?', answer: 'Yes. Listening and watching are free with ads. A subscription removes ads and supports the ministry.' },
  { _id: 'faq_2', question: 'How do I become a creator?', answer: 'Sign up and choose “Creator”. Our team reviews every application; once approved you can upload messages and go live.' },
  { _id: 'faq_3', question: 'What are Preach Clips?', answer: 'Short videos of up to two minutes, often cut from a full message. Tap “Watch full message” to see the whole sermon.' },
  { _id: 'faq_4', question: 'Can I listen in the background?', answer: 'Yes. Audio keeps playing when you lock your phone or switch apps.' },
  { _id: 'faq_5', question: 'How do I cancel my subscription?', answer: 'Subscriptions are managed by the App Store or Google Play. Open your store account’s subscriptions page to cancel.' },
];
