import { Heart } from 'lucide-react-native';
import { memo } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Avatar } from '@/components/common/Avatar';
import { AppText } from '@/components/common/AppText';
import { Touchable } from '@/components/common/Touchable';
import { useGetCommentRepliesInfiniteQuery, useToggleCommentLikeMutation, flattenComments } from '@/store/api/commentsApi';
import { colors } from '@/theme';
import type { CommentView } from '@/types/comment';
import { formatCount, timeAgo } from '@/utils/format';
import { repliesLabel, useThread } from '../threadContext';

/** Threads indent for this many levels; deeper replies line up with the last indented level. */
const MAX_INDENT_DEPTH = 2;
const avatarSize = (depth: number) => (depth === 0 ? 36 : 28);
const childIndent = (depth: number) => (depth < MAX_INDENT_DEPTH ? avatarSize(depth) + 12 : 0);

/** "—— View 12 replies" style link under a comment. */
function ThreadLink({ label, onPress, loading }: { label: string; onPress: () => void; loading?: boolean }) {
  return (
    <Touchable onPress={onPress} disabled={loading} scaleTo={1} className="mt-3 flex-row items-center self-start py-1" accessibilityLabel={label}>
      <View className="mr-2.5 h-px w-6 bg-ink-500" />
      <AppText variant="caption" tone="muted" className="font-semibold">
        {label}
      </AppText>
      {loading ? <ActivityIndicator size="small" color={colors.text.muted} style={{ marginLeft: 8, transform: [{ scale: 0.7 }] }} /> : null}
    </Touchable>
  );
}

/** Replies of one comment, loaded page by page ("View N more replies"). */
const ReplyThread = memo(function ReplyThread({ parentId, depth, knownTotal }: { parentId: string; depth: number; knownTotal: number }) {
  const q = useGetCommentRepliesInfiniteQuery(parentId);
  const replies = flattenComments(q.data?.pages);
  const total = q.data?.pages[q.data.pages.length - 1]?.meta.total ?? knownTotal;
  const remaining = Math.max(0, total - replies.length);

  return (
    <View>
      {replies.map((r) => (
        <View key={r._id} className="mt-4">
          <CommentRow comment={r} depth={depth} />
        </View>
      ))}
      {q.isLoading ? <ActivityIndicator size="small" color={colors.text.muted} style={{ marginTop: 14, alignSelf: 'flex-start' }} /> : null}
      {q.isError ? <ThreadLink label="Couldn’t load replies · Tap to retry" onPress={() => void q.refetch()} /> : null}
      {q.hasNextPage && remaining > 0 ? (
        <ThreadLink label={`View ${remaining} more ${remaining === 1 ? 'reply' : 'replies'}`} loading={q.isFetchingNextPage} onPress={() => void q.fetchNextPage()} />
      ) : null}
    </View>
  );
});

/**
 * One comment or reply: avatar, name (+ Author badge), time, text, Reply, like count,
 * and its own collapsible reply thread — which can nest further.
 * Long-press opens the menu (reply / edit / delete).
 */
export const CommentRow = memo(function CommentRow({ comment, depth = 0 }: { comment: CommentView; depth?: number }) {
  const thread = useThread();
  const [toggleLike] = useToggleCommentLikeMutation();
  const expanded = thread.isExpanded(comment._id);
  const size = avatarSize(depth);

  return (
    <View>
      <Pressable onLongPress={() => thread.openMenu(comment)} delayLongPress={350} className="flex-row" accessibilityHint="Long press for more options">
        <Avatar uri={comment.commentor.profile_image || undefined} name={comment.commentor.name} size={size} />
        <View className="ml-3 flex-1">
          <View className="flex-row flex-wrap items-center">
            <AppText variant="caption" className="font-semibold text-fg-primary" numberOfLines={1}>
              {comment.commentor.name}
            </AppText>
            {comment.isAuthor ? (
              <View className="ml-1.5 rounded-full bg-brand-400/15 px-1.5 py-px">
                <AppText className="text-[10px] font-bold leading-[13px] text-brand-400">Author</AppText>
              </View>
            ) : null}
            <AppText variant="caption" tone="faint" className="ml-2">
              {timeAgo(comment.createdAt)}
              {comment.isEdited ? ' · edited' : ''}
            </AppText>
          </View>
          <AppText variant="bodySm" className="mt-1 text-fg-primary" selectable>
            {comment.text}
          </AppText>
          <Touchable onPress={() => thread.reply(comment)} scaleTo={1} className="mt-2 self-start py-0.5" accessibilityLabel={`Reply to ${comment.commentor.name}`}>
            <AppText variant="caption" tone="muted" className="font-semibold">
              Reply
            </AppText>
          </Touchable>
        </View>
        <Touchable
          haptic
          scaleTo={0.85}
          onPress={() => void toggleLike(comment._id)}
          className="w-10 items-center pt-1"
          accessibilityLabel={comment.isLiked ? 'Unlike comment' : 'Like comment'}
          accessibilityState={{ selected: comment.isLiked }}
        >
          <Heart size={16} color={comment.isLiked ? colors.live : colors.text.muted} fill={comment.isLiked ? colors.live : 'none'} />
          <AppText variant="caption" tone="muted" className="mt-0.5 text-[11px]">
            {comment.totalLike ? formatCount(comment.totalLike) : ' '}
          </AppText>
        </Touchable>
      </Pressable>

      {comment.totalReplies > 0 ? (
        <View style={{ marginLeft: childIndent(depth) }}>
          {expanded ? (
            <>
              <ReplyThread parentId={comment._id} depth={depth + 1} knownTotal={comment.totalReplies} />
              <ThreadLink label="Hide replies" onPress={() => thread.toggleReplies(comment._id)} />
            </>
          ) : (
            <ThreadLink label={`View ${repliesLabel(comment.totalReplies)}`} onPress={() => thread.toggleReplies(comment._id)} />
          )}
        </View>
      ) : null}
    </View>
  );
});
