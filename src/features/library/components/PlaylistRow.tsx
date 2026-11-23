import { Globe, Lock } from 'lucide-react-native';
import { memo, type ReactNode } from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { Touchable } from '@/components/common/Touchable';
import { colors } from '@/theme';
import type { Playlist } from '@/types/models';
import { PlaylistCover } from './PlaylistCover';

export const countLabel = (n: number) => `${n} ${n === 1 ? 'message' : 'messages'}`;

/** One playlist in "My playlist" and the add-to sheet: cover · name · count · private/public. */
export const PlaylistRow = memo(function PlaylistRow({
  playlist,
  onPress,
  trailing,
  className = 'rounded-sm bg-ink-800 p-2.5',
  ...a11y
}: {
  playlist: Playlist;
  onPress: (p: Playlist) => void;
  trailing?: ReactNode;
  className?: string;
  accessibilityRole?: 'button' | 'checkbox';
  accessibilityState?: { checked?: boolean; disabled?: boolean };
  disabled?: boolean;
}) {
  const Privacy = playlist.isPublic ? Globe : Lock;
  return (
    <Touchable onPress={() => onPress(playlist)} className={`flex-row items-center ${className}`} accessibilityLabel={`Playlist ${playlist.name}, ${countLabel(playlist.podcasts.length)}`} {...a11y}>
      <PlaylistCover coverImage={playlist.cover_image} size={56} />
      <View className="ml-3.5 flex-1">
        <AppText variant="title" numberOfLines={1} className="text-[16px]">
          {playlist.name}
        </AppText>
        <View className="mt-0.5 flex-row items-center gap-1">
          <Privacy size={11} color={colors.text.muted} />
          <AppText variant="caption" tone="muted">
            {playlist.isPublic ? 'Public' : 'Private'} · {countLabel(playlist.podcasts.length)}
          </AppText>
        </View>
      </View>
      {trailing}
    </Touchable>
  );
});
