import { MessageCircle, Send, X } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, RefreshControl, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootScreenProps } from '@/app/navigation/types';
import { Avatar } from '@/components/common/Avatar';
import { AppText } from '@/components/common/AppText';
import { EmptyState, ErrorState, Skeleton } from '@/components/common/States';
import { Touchable } from '@/components/common/Touchable';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import type { ApiErrorShape } from '@/store/api/baseApi';
import { flattenComments, usePostCommentMutation, usePostCommentReplyMutation, useDeleteCommentMutation, useEditCommentMutation, useGetCommentThreadInfiniteQuery } from '@/store/api/commentsApi';
import { useGetClipQuery } from '@/store/api/reelsApi';
import { useAppSelector } from '@/store/hooks';
import { selectProfile } from '@/store/slices/authSlice';
import { colors, fonts, GUTTER } from '@/theme';
import type { CommentView } from '@/types/comment';
import { formatCount } from '@/utils/format';
import { CommentMenu } from '../components/CommentMenu';
import { CommentRow } from '../components/CommentRow';
import { ThreadContext, type ThreadActions } from '../threadContext';

const MAX_LENGTH = 500;
/** Share of the screen the sheet takes (the clip stays visible above). */
const SHEET_RATIO = 0.75;

type ComposerMode = { kind: 'new' } | { kind: 'reply'; target: CommentView } | { kind: 'edit'; target: CommentView };

const errorMessage = (e: unknown) => (e as Partial<ApiErrorShape>)?.message ?? 'Something went wrong. Please try again.';

function ListSkeleton() {
  return (
    <View style={{ padding: GUTTER, gap: 24 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} className="flex-row">
          <Skeleton width={36} height={36} radius={18} />
          <View className="ml-3 flex-1 gap-2">
            <Skeleton width={110} height={11} />
            <Skeleton width="88%" height={12} />
            <Skeleton width={40} height={10} />
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Live comments for a podcast/clip: paginated top-level comments, like counts,
 * reply counts, and expandable reply threads that paginate and nest.
 */
export function CommentThreadScreen({ route, navigation }: RootScreenProps<'ClipComments'>) {
  const { podcastId } = route.params;
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const profile = useAppSelector(selectProfile);

  const comments = useGetCommentThreadInfiniteQuery(podcastId);
  const list = useMemo(() => flattenComments(comments.data?.pages), [comments.data]);
  const lastMeta = comments.data?.pages[comments.data.pages.length - 1]?.meta;
  // The clip is already cached by the reel; its counter includes replies.
  const total = useGetClipQuery(podcastId).data?.totalComments ?? lastMeta?.total;

  const [addComment, addState] = usePostCommentMutation();
  const [addReply, replyState] = usePostCommentReplyMutation();
  const [editComment, editState] = useEditCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const sending = addState.isLoading || replyState.isLoading || editState.isLoading;

  const listRef = useRef<FlatList<CommentView>>(null);
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [text, setText] = useState('');
  const [mode, setMode] = useState<ComposerMode>({ kind: 'new' });
  const [menuFor, setMenuFor] = useState<CommentView | null>(null);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const [refreshing, setRefreshing] = useState(false);

  const expand = useCallback((id: string) => setExpanded((s) => (s.has(id) ? s : new Set(s).add(id))), []);

  const startReply = useCallback((c: CommentView) => {
    setMode({ kind: 'reply', target: c });
    inputRef.current?.focus();
  }, []);

  const startEdit = useCallback((c: CommentView) => {
    setMode({ kind: 'edit', target: c });
    setText(c.text);
    inputRef.current?.focus();
  }, []);

  const resetComposer = () => {
    if (mode.kind === 'edit') setText('');
    setMode({ kind: 'new' });
  };

  const confirmDelete = useCallback(
    (c: CommentView) => {
      Alert.alert('Delete comment?', c.totalReplies ? `Its ${c.totalReplies === 1 ? 'reply' : 'replies'} will be deleted too.` : 'This can’t be undone.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteComment({ id: c._id, podcastId })
              .unwrap()
              .catch((e: unknown) => Alert.alert('Couldn’t delete', errorMessage(e)));
            setMode((m) => (m.kind !== 'new' && m.target._id === c._id ? { kind: 'new' } : m));
          },
        },
      ]);
    },
    [deleteComment, podcastId],
  );

  const thread = useMemo<ThreadActions>(
    () => ({
      podcastId,
      isExpanded: (id) => expanded.has(id),
      toggleReplies: (id) =>
        setExpanded((s) => {
          const next = new Set(s);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        }),
      reply: startReply,
      openMenu: setMenuFor,
    }),
    [expanded, podcastId, startReply],
  );

  const submit = async () => {
    const value = text.trim();
    if (!value || sending) return;
    try {
      if (mode.kind === 'reply') {
        await addReply({
          podcastId,
          parentId: mode.target._id,
          text: value,
        }).unwrap();
        expand(mode.target._id); // show the new reply in its thread
      } else if (mode.kind === 'edit') {
        await editComment({ id: mode.target._id, text: value }).unwrap();
      } else {
        await addComment({ podcastId, text: value }).unwrap();
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
      setText('');
      setMode({ kind: 'new' });
    } catch (e) {
      Alert.alert('Couldn’t send', errorMessage(e));
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      await comments.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const canSend = text.trim().length > 0 && !sending;
  const placeholder = mode.kind === 'reply' ? `Reply to ${mode.target.commentor.name}…` : 'Add a comment…';

  return (
    <ThreadContext.Provider value={thread}>
      {/* A custom sheet (not the native form sheet): the native one lays the screen out at full
          height and shows only the top part, which pushed the comment box off-screen. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={{ flex: 1 }} onPress={() => navigation.goBack()} accessibilityLabel="Close comments" />
        <View
          className="overflow-hidden rounded-t-[28px] bg-ink-850"
          style={{
            height: Math.round(windowHeight * SHEET_RATIO),
            maxHeight: '100%',
          }}
        >
          <View className="items-center pt-2.5">
            <View className="h-1 w-10 rounded-full bg-ink-500" />
          </View>
          <ScreenHeader back="down" title="Comments" subtitle={total ? `${formatCount(total)} ${total === 1 ? 'comment' : 'comments'}` : undefined} />

          <View className="flex-1">
            {comments.isLoading ? (
              <ListSkeleton />
            ) : comments.isError && !list.length ? (
              <ErrorState message={errorMessage(comments.error)} onRetry={() => void comments.refetch()} />
            ) : (
              <FlatList
                ref={listRef}
                data={list}
                keyExtractor={(c) => c._id}
                renderItem={({ item }) => <CommentRow comment={item} />}
                extraData={expanded}
                contentContainerStyle={{
                  paddingHorizontal: GUTTER,
                  paddingTop: 8,
                  paddingBottom: 24,
                  flexGrow: 1,
                }}
                ItemSeparatorComponent={() => <View className="h-6" />}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                onEndReached={() => {
                  if (comments.hasNextPage && !comments.isFetchingNextPage) void comments.fetchNextPage();
                }}
                onEndReachedThreshold={0.5}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.text.muted} colors={[colors.brand[400]]} />}
                ListEmptyComponent={<EmptyState icon={MessageCircle} title="No comments yet" message="Be the first to share what this message meant to you." />}
                ListFooterComponent={comments.isFetchingNextPage ? <ActivityIndicator color={colors.text.muted} style={{ marginTop: 20 }} /> : undefined}
              />
            )}

            <View className="border-t border-line bg-ink-850" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
              {mode.kind !== 'new' ? (
                <View className="flex-row items-center bg-ink-800 px-4 py-2">
                  <AppText variant="caption" tone="muted" className="flex-1" numberOfLines={1}>
                    {mode.kind === 'reply' ? (
                      <>
                        Replying to{' '}
                        <AppText variant="caption" className="font-semibold text-fg-primary">
                          {mode.target.commentor.name}
                        </AppText>
                      </>
                    ) : (
                      'Editing your comment'
                    )}
                  </AppText>
                  <Touchable onPress={resetComposer} className="p-1" accessibilityLabel="Cancel">
                    <X size={16} color={colors.text.muted} />
                  </Touchable>
                </View>
              ) : null}
              <View className="flex-row items-end px-4 pt-3">
                <Avatar uri={profile?.profile_image || undefined} name={profile?.name ?? 'You'} size={34} />
                <TextInput
                  ref={inputRef}
                  value={text}
                  onChangeText={setText}
                  placeholder={placeholder}
                  placeholderTextColor={colors.text.faint}
                  selectionColor={colors.brand[400]}
                  multiline
                  maxLength={MAX_LENGTH}
                  accessibilityLabel="Write a comment"
                  style={{
                    flex: 1,
                    marginHorizontal: 10,
                    minHeight: 40,
                    maxHeight: 110,
                    paddingHorizontal: 16,
                    paddingTop: 10,
                    paddingBottom: 10,
                    borderRadius: 20,
                    backgroundColor: colors.ink[700],
                    color: colors.text.primary,
                    fontFamily: fonts.medium,
                    fontSize: 14,
                    textAlignVertical: 'center',
                  }}
                />
                <Touchable
                  haptic
                  onPress={() => void submit()}
                  disabled={!canSend}
                  accessibilityLabel={mode.kind === 'edit' ? 'Save comment' : 'Post comment'}
                  className="h-10 w-10 items-center justify-center rounded-full bg-white"
                  style={{ opacity: canSend || sending ? 1 : 0.4 }}
                >
                  {sending ? <ActivityIndicator size="small" color={colors.black} /> : <Send size={17} color={colors.black} />}
                </Touchable>
              </View>
              {text.length > MAX_LENGTH - 100 ? (
                <AppText variant="caption" tone="faint" className="mr-16 mt-1 text-right text-[11px]">
                  {text.length}/{MAX_LENGTH}
                </AppText>
              ) : null}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <CommentMenu comment={menuFor} onClose={() => setMenuFor(null)} onReply={startReply} onEdit={startEdit} onDelete={confirmDelete} />
    </ThreadContext.Provider>
  );
}
