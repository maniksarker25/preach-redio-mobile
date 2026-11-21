import type { AppDispatch } from '@/store';
import { endpoints } from '@/services/api/endpoints';
import type { Paginated } from '@/types/api';
import type { CommentDeleteResult, CommentLikeResult, CommentView } from '@/types/comment';
import { baseApi } from './baseApi';
import { reelsApi } from './reelsApi';

/** Top-level comments per page. */
export const COMMENTS_PAGE_SIZE = 15;
/** Replies per "View more replies" tap. */
export const REPLIES_PAGE_SIZE = 10;

type Page = Paginated<CommentView>;
type Dispatch = AppDispatch;
type GetState = () => unknown;

/**
 * Tolerates the pre-update server shape (flat `commentorName`, no `isLiked`/`canDelete`),
 * so the screen works before and after the backend deploy.
 */
type RawComment = Partial<CommentView> & { _id: string; commentorName?: string; commentorProfileImage?: string; commentor?: CommentView['commentor'] | string };
const normalizeComment = (c: RawComment): CommentView => {
  const commentor = typeof c.commentor === 'object' && c.commentor ? c.commentor : undefined;
  return {
    _id: c._id,
    podcast: c.podcast ?? '',
    parent: c.parent ?? null,
    text: c.text ?? '',
    createdAt: c.createdAt ?? new Date().toISOString(),
    updatedAt: c.updatedAt ?? c.createdAt ?? new Date().toISOString(),
    editedAt: c.editedAt ?? null,
    isEdited: Boolean(c.isEdited),
    commentor: commentor ?? {
      _id: typeof c.commentor === 'string' ? c.commentor : '',
      type: 'NormalUser',
      name: c.commentorName ?? 'Listener',
      profile_image: c.commentorProfileImage ?? '',
    },
    totalLike: c.totalLike ?? 0,
    isLiked: Boolean(c.isLiked),
    totalReplies: c.totalReplies ?? 0,
    isMyComment: Boolean(c.isMyComment),
    isAuthor: Boolean(c.isAuthor),
    canDelete: c.canDelete ?? Boolean(c.isMyComment),
  };
};
const normalizePage = (res: Paginated<RawComment>): Page => ({ meta: res.meta, result: res.result.map(normalizeComment) });

const nextPage = (last: Page) => (last.meta.page < last.meta.totalPage ? last.meta.page + 1 : undefined);

/**
 * Comments — live backend. Works for any podcast id (clips use it today).
 *
 * - `getCommentThread`  GET /comment/get-podcast-comments/:podcastId  (infinite, newest first)
 * - `getCommentReplies`   GET /comment/get-replies/:commentId            (infinite, oldest first; replies can nest)
 * - add / reply / edit / delete / like update every cached thread in place, so nothing refetches.
 */
export const commentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCommentThread: build.infiniteQuery<Page, string, number>({
      infiniteQueryOptions: { initialPageParam: 1, getNextPageParam: nextPage },
      query: ({ queryArg, pageParam }) => ({ url: endpoints.comment.list(queryArg), params: { page: pageParam, limit: COMMENTS_PAGE_SIZE } }),
      transformResponse: normalizePage,
      providesTags: (_r, _e, podcastId) => [{ type: 'Comment', id: `podcast:${podcastId}` }],
    }),

    getCommentReplies: build.infiniteQuery<Page, string, number>({
      infiniteQueryOptions: { initialPageParam: 1, getNextPageParam: nextPage },
      query: ({ queryArg, pageParam }) => ({ url: endpoints.comment.replies(queryArg), params: { page: pageParam, limit: REPLIES_PAGE_SIZE } }),
      transformResponse: normalizePage,
      providesTags: (_r, _e, commentId) => [{ type: 'Comment', id: `replies:${commentId}` }],
    }),

    postComment: build.mutation<CommentView, { podcastId: string; text: string }>({
      query: ({ podcastId, text }) => ({ url: endpoints.comment.create, method: 'POST', body: { podcast: podcastId, text } }),
      transformResponse: normalizeComment,
      async onQueryStarted({ podcastId }, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(
          commentsApi.util.updateQueryData('getCommentThread', podcastId, (d) => {
            d.pages[0]?.result.unshift(data);
            d.pages.forEach((p) => void (p.meta.total += 1));
          }),
        );
        bumpPodcastCount(dispatch, podcastId, 1);
      },
    }),

    postCommentReply: build.mutation<CommentView, { podcastId: string; parentId: string; text: string }>({
      query: ({ parentId, text }) => ({ url: endpoints.comment.reply, method: 'POST', body: { parent: parentId, text } }),
      transformResponse: normalizeComment,
      async onQueryStarted({ podcastId, parentId }, { dispatch, getState, queryFulfilled }) {
        const { data } = await queryFulfilled;
        // Replies read oldest → newest, so the new one goes at the end of what's loaded.
        dispatch(
          commentsApi.util.updateQueryData('getCommentReplies', parentId, (d) => {
            d.pages[d.pages.length - 1]?.result.push(data);
            d.pages.forEach((p) => void (p.meta.total += 1));
          }),
        );
        patchComment(dispatch, getState, parentId, (c) => void (c.totalReplies += 1));
        bumpPodcastCount(dispatch, podcastId, 1);
      },
    }),

    editComment: build.mutation<CommentView, { id: string; text: string }>({
      query: ({ id, text }) => ({ url: endpoints.comment.update(id), method: 'PATCH', body: { text } }),
      transformResponse: normalizeComment,
      async onQueryStarted({ id }, { dispatch, getState, queryFulfilled }) {
        const { data } = await queryFulfilled;
        patchComment(dispatch, getState, id, (c) => {
          c.text = data.text;
          c.isEdited = data.isEdited;
          c.editedAt = data.editedAt;
        });
      },
    }),

    toggleCommentLike: build.mutation<CommentLikeResult, string>({
      query: (id) => ({ url: endpoints.comment.like(id), method: 'POST' }),
      async onQueryStarted(id, { dispatch, getState, queryFulfilled }) {
        const undo = patchComment(dispatch, getState, id, (c) => {
          c.isLiked = !c.isLiked;
          c.totalLike = Math.max(0, c.totalLike + (c.isLiked ? 1 : -1));
        });
        try {
          const { data } = await queryFulfilled;
          // Settle on the server's numbers (other people may have liked meanwhile).
          patchComment(dispatch, getState, id, (c) => {
            c.isLiked = data.liked;
            c.totalLike = data.totalLikes;
          });
        } catch {
          undo();
        }
      },
    }),

    deleteComment: build.mutation<CommentDeleteResult, { id: string; podcastId: string }>({
      query: ({ id }) => ({ url: endpoints.comment.remove(id), method: 'DELETE' }),
      async onQueryStarted({ id, podcastId }, { dispatch, getState, queryFulfilled }) {
        const { data } = await queryFulfilled;
        removeComment(dispatch, getState, id);
        if (data.parent) patchComment(dispatch, getState, data.parent, (c) => void (c.totalReplies = Math.max(0, c.totalReplies - 1)));
        bumpPodcastCount(dispatch, podcastId, -(data.deletedCount ?? 1)); // old server: no count
      },
    }),
  }),
});

export const {
  useGetCommentThreadInfiniteQuery,
  useGetCommentRepliesInfiniteQuery,
  usePostCommentMutation,
  usePostCommentReplyMutation,
  useEditCommentMutation,
  useToggleCommentLikeMutation,
  useDeleteCommentMutation,
} = commentsApi;

/* ------------------------------------------------------------ cache helpers */

/** Every cached thread (top-level lists and reply lists) that may hold a comment. */
const cachedThreads = (getState: GetState) => {
  const state = getState() as Parameters<typeof commentsApi.util.selectCachedArgsForQuery>[0];
  return {
    lists: commentsApi.util.selectCachedArgsForQuery(state, 'getCommentThread'),
    replies: commentsApi.util.selectCachedArgsForQuery(state, 'getCommentReplies'),
  };
};

/** Apply `recipe` to the comment wherever it's cached. Returns an undo. */
const patchComment = (dispatch: Dispatch, getState: GetState, id: string, recipe: (c: CommentView) => void) => {
  const edit = (d: { pages: Page[] }) => d.pages.forEach((p) => p.result.forEach((c) => c._id === id && recipe(c)));
  const { lists, replies } = cachedThreads(getState);
  const patches = [
    ...lists.map((arg) => dispatch(commentsApi.util.updateQueryData('getCommentThread', arg, edit))),
    ...replies.map((arg) => dispatch(commentsApi.util.updateQueryData('getCommentReplies', arg, edit))),
  ];
  return () => patches.forEach((p) => p.undo());
};

/** Drop a deleted comment from every cached thread and fix that thread's total. */
const removeComment = (dispatch: Dispatch, getState: GetState, id: string) => {
  const drop = (d: { pages: Page[] }) => {
    const had = d.pages.some((p) => p.result.some((c) => c._id === id));
    if (!had) return;
    d.pages.forEach((p) => {
      p.result = p.result.filter((c) => c._id !== id);
      p.meta.total = Math.max(0, p.meta.total - 1);
    });
  };
  const { lists, replies } = cachedThreads(getState);
  lists.forEach((arg) => dispatch(commentsApi.util.updateQueryData('getCommentThread', arg, drop)));
  replies.forEach((arg) => dispatch(commentsApi.util.updateQueryData('getCommentReplies', arg, drop)));
};

/** Keep the clip's comment counter (action rail / sheet header) in step. */
const bumpPodcastCount = (dispatch: Dispatch, podcastId: string, delta: number) => {
  dispatch(reelsApi.util.updateQueryData('getClip', podcastId, (d) => void (d.totalComments = Math.max(0, (d.totalComments ?? 0) + delta))));
};

/** Loaded pages as one list; de-duplicated because a fresh post can also arrive in a later page. */
export const flattenComments = (pages: Page[] | undefined): CommentView[] => {
  const seen = new Set<string>();
  const out: CommentView[] = [];
  for (const page of pages ?? []) {
    for (const c of page.result) {
      if (seen.has(c._id)) continue;
      seen.add(c._id);
      out.push(c);
    }
  }
  return out;
};
