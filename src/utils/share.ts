import { Share } from 'react-native';
import type { Podcast } from '@/types/models';
import { ownerName } from './podcast';

/** Native share sheet. Links point at the website until per-episode web pages exist. */
export const sharePodcast = (p: Pick<Podcast, 'title' | 'creator' | 'station'>) =>
  Share.share({ message: `“${p.title}” by ${ownerName(p)} on Preach Radio\nhttps://preachradio.com` }).catch(() => undefined);

export const shareText = (message: string) => Share.share({ message }).catch(() => undefined);
