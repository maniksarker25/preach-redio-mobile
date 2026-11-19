import { FlashList } from '@shopify/flash-list';
import { Heart, MessageCircle, Send } from 'lucide-react-native';
import { memo, useState } from 'react';
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootScreenProps } from '@/app/navigation/types';
import { Avatar } from '@/components/common/Avatar';
import { AppText } from '@/components/common/AppText';
import { EmptyState, ErrorState, Skeleton } from '@/components/common/States';
import { Touchable } from '@/components/common/Touchable';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { useAddComment, useComments } from '@/hooks/queries';
import { useAppSelector } from '@/store/hooks';
import { selectProfile } from '@/store/slices/authSlice';
import { colors, fonts, GUTTER } from '@/theme';
import type { Comment } from '@/types/models';
import { timeAgo } from '@/utils/format';

const CommentItem = memo(function CommentItem({ comment, reply }: { comment: Comment; reply?: boolean }) {
  const [liked, setLiked] = useState(false);
  return (
    <View className={reply ? 'ml-12 mt-3 flex-row' : 'flex-row'}>
      <Avatar uri={comment.commentor.profile_image} name={comment.commentor.name} size={reply ? 28 : 36} />
      <View className="ml-3 flex-1">
        <View className="flex-row items-center gap-2">
          <AppText variant="label">{comment.commentor.name}</AppText>
          <AppText variant="caption" tone="faint">
            {timeAgo(comment.createdAt)}
          </AppText>
        </View>
        <AppText variant="bodySm" tone="secondary" className="mt-1">
          {comment.text}
        </AppText>
      </View>
      <Touchable haptic onPress={() => setLiked((l) => !l)} className="items-center pl-3" accessibilityLabel={liked ? 'Unlike comment' : 'Like comment'}>
        <Heart size={16} color={liked ? colors.brand[500] : colors.text.muted} fill={liked ? colors.brand[500] : 'none'} />
        <AppText variant="caption" tone="muted" className="mt-0.5 text-[11px]">
          {comment.likers.length + (liked ? 1 : 0) || ''}
        </AppText>
      </Touchable>
    </View>
  );
});

export function CommentsScreen({ route }: RootScreenProps<'Comments'>) {
  const { podcastId } = route.params;
  const insets = useSafeAreaInsets();
  const comments = useComments(podcastId);
  const [addComment] = useAddComment();
  const profile = useAppSelector(selectProfile);
  const [text, setText] = useState('');

  const submit = () => {
    const value = text.trim();
    if (!value || !profile) return;
    void addComment({ podcastId, text: value, author: { _id: profile._id, name: profile.name, profile_image: profile.profile_image } });
    setText('');
  };

  return (
    <Screen safeTop={false} className="bg-ink-850">
      <View className="items-center pt-2.5">
        <View className="h-1 w-10 rounded-full bg-ink-500" />
      </View>
      <ScreenHeader back="down" title="Comments" subtitle={comments.data ? `${comments.data.length} comments` : undefined} />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={60}>
        {comments.isLoading ? (
          <View style={{ padding: GUTTER, gap: 22 }}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} className="flex-row">
                <Skeleton width={36} height={36} radius={18} />
                <View className="ml-3 flex-1 gap-2">
                  <Skeleton width={120} height={12} />
                  <Skeleton width="90%" height={12} />
                </View>
              </View>
            ))}
          </View>
        ) : comments.isError ? (
          <ErrorState onRetry={() => void comments.refetch()} />
        ) : (
          <FlashList
            data={comments.data}
            keyExtractor={(c) => c._id}
            contentContainerStyle={{ padding: GUTTER }}
            ItemSeparatorComponent={() => <View className="h-6" />}
            ListEmptyComponent={<EmptyState icon={MessageCircle} title="No comments yet" message="Share what this message meant to you." />}
            renderItem={({ item }) => (
              <View>
                <CommentItem comment={item} />
                {item.replies?.map((r) => <CommentItem key={r._id} comment={r} reply />)}
              </View>
            )}
          />
        )}
        <View className="flex-row items-center border-t border-line bg-ink-850 px-4 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          <Avatar uri={profile?.profile_image} name={profile?.name ?? 'You'} size={34} />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Add a comment…"
            placeholderTextColor={colors.text.faint}
            selectionColor={colors.brand[500]}
            onSubmitEditing={submit}
            returnKeyType="send"
            accessibilityLabel="Write a comment"
            style={{ flex: 1, marginHorizontal: 12, height: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: colors.ink[700], color: colors.text.primary, fontFamily: fonts.medium, fontSize: 14 }}
          />
          <Touchable
            haptic
            onPress={submit}
            disabled={!text.trim()}
            accessibilityLabel="Post comment"
            className="h-11 w-11 items-center justify-center rounded-full bg-white"
            style={{ opacity: text.trim() ? 1 : 0.4 }}
          >
            <Send size={18} color={colors.black} />
          </Touchable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
