import { createContext, useContext } from 'react';
import type { CommentView } from '@/types/comment';

/** Screen-level actions every comment row (at any depth) can reach without prop drilling. */
export interface ThreadActions {
  podcastId: string;
  isExpanded: (commentId: string) => boolean;
  toggleReplies: (commentId: string) => void;
  reply: (comment: CommentView) => void;
  openMenu: (comment: CommentView) => void;
}

export const ThreadContext = createContext<ThreadActions | null>(null);

export const useThread = () => {
  const ctx = useContext(ThreadContext);
  if (!ctx) throw new Error('useThread must be used inside <ThreadContext.Provider>');
  return ctx;
};

/** "1 reply" / "12 replies" */
export const repliesLabel = (n: number) => `${n} ${n === 1 ? 'reply' : 'replies'}`;
