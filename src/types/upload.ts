import type { GeoPoint, ID, PodcastMediaType, PodcastType } from './models';

/** `fileCategory` values the presign route maps to S3 folders. */
export type UploadFileCategory = 'podcast_audio' | 'podcast_video' | 'podcast_cover';

export interface PresignResult {
  uploadURL: string;
  fileName: string;
}

/** JSON body of `POST /podcast/create` (media is already on S3). */
export interface CreatePodcastBody {
  type: PodcastType;
  mediaType: PodcastMediaType;
  title: string;
  description: string;
  category: ID;
  subCategory: ID;
  podcast_url: string;
  coverImage?: string;
  tags: string[];
  /** Legacy "minutes.seconds" (4m 07s → 4.07). */
  duration: number;
  durationSeconds: number;
  /** Required for episodes. */
  location?: GeoPoint;
  address?: string;
  videoWidth?: number;
  videoHeight?: number;
}

/** A category the creator can publish into, with the sub-categories the API still requires. */
export interface UploadCategory {
  _id: ID;
  name: string;
  subcategories: { _id: ID; name: string }[];
}
