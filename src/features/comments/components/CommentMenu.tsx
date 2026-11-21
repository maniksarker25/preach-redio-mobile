import { CornerDownRight, Pencil, Trash2 } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/common/AppText';
import { Touchable } from '@/components/common/Touchable';
import { colors } from '@/theme';
import type { CommentView } from '@/types/comment';

interface CommentMenuProps {
  comment: CommentView | null;
  onClose: () => void;
  onReply: (c: CommentView) => void;
  onEdit: (c: CommentView) => void;
  onDelete: (c: CommentView) => void;
}

const Option = ({ icon: Icon, label, danger, onPress }: { icon: LucideIcon; label: string; danger?: boolean; onPress: () => void }) => (
  <Touchable haptic onPress={onPress} scaleTo={0.99} className="flex-row items-center rounded-xl px-4 py-3.5 active:bg-ink-700" accessibilityLabel={label}>
    <Icon size={19} color={danger ? colors.live : colors.text.primary} />
    <AppText variant="body" className="ml-3.5" style={danger ? { color: colors.live } : undefined}>
      {label}
    </AppText>
  </Touchable>
);

/** Long-press menu for a comment (cross-platform; Android alerts allow only three buttons). */
export function CommentMenu({ comment, onClose, onReply, onEdit, onDelete }: CommentMenuProps) {
  const insets = useSafeAreaInsets();
  const run = (fn: (c: CommentView) => void) => () => {
    if (!comment) return;
    onClose();
    fn(comment);
  };

  return (
    <Modal visible={Boolean(comment)} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable className="flex-1 justify-end bg-black/50" onPress={onClose} accessibilityLabel="Close menu">
        <Pressable className="rounded-t-3xl bg-ink-800 px-3 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 12) + 4 }}>
          <View className="mb-2 items-center">
            <View className="h-1 w-10 rounded-full bg-ink-500" />
          </View>
          {comment ? (
            <AppText variant="caption" tone="muted" numberOfLines={2} className="mb-2 px-4">
              {comment.commentor.name}: {comment.text}
            </AppText>
          ) : null}
          <Option icon={CornerDownRight} label="Reply" onPress={run(onReply)} />
          {comment?.isMyComment ? <Option icon={Pencil} label="Edit" onPress={run(onEdit)} /> : null}
          {comment?.canDelete ? <Option icon={Trash2} label="Delete" danger onPress={run(onDelete)} /> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
