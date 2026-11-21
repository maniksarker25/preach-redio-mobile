import type { ID, ISODate } from './models';

/** A comment or reply as returned by `/comment/get-podcast-comments` and `/comment/get-replies`. */
export interface CommentView {
  _id: ID;
  podcast: ID;
  /** null for a top-level comment. */
  parent: ID | null;
  text: string;
  createdAt: ISODate;
  updatedAt: ISODate;
  editedAt: ISODate | null;
  isEdited: boolean;
  commentor: {
    _id: ID;
    type: 'NormalUser' | 'Creator';
    name: string;
    profile_image: string;
  };
  totalLike: number;
  isLiked: boolean;
  /** Direct replies only. */
  totalReplies: number;
  isMyComment: boolean;
  /** Written by the podcast's creator. */
  isAuthor: boolean;
  /** Author, the podcast's creator, or an admin. */
  canDelete: boolean;
}

export interface CommentLikeResult {
  commentId: ID;
  liked: boolean;
  totalLikes: number;
}

export interface CommentDeleteResult {
  _id: ID;
  parent: ID | null;
  deletedCount: number;
}
