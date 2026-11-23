import { Clapperboard, Headphones, Video } from 'lucide-react-native';
import { memo, type ReactNode } from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { Touchable } from '@/components/common/Touchable';
import { Skeleton } from '@/components/common/States';
import { Artwork } from '@/components/media/Artwork';
import { useLibraryStore } from '@/store/libraryStore';
import { colors } from '@/theme';
import type { Podcast } from '@/types/models';
import { formatClock, formatLength, podcastSeconds } from '@/utils/format';
import { isClip, isVideo, ownerName } from '@/utils/podcast';

interface MediaRowProps {
  podcast: Podcast;
  /** Third line, e.g. "1.2K views · 2 hours ago". */
  meta: string;
  /** Thumbnail width; the height is 16:9. */
  thumbWidth: number;
  onPress: (p: Podcast) => void;
  /** Optional action on the right (e.g. remove from favorites). */
  trailing?: ReactNode;
}

/**
 * A podcast list row (History, Favorite): 16:9 thumbnail (whole cover, never cropped) with the kind + length
 * and how far you got, then title, owner and a meta line.
 */
export const MediaRow = memo(function MediaRow({ podcast, meta, thumbWidth, onPress, trailing }: MediaRowProps) {
  const seconds = podcastSeconds(podcast);
  const saved = useLibraryStore((s) => s.progress[podcast._id] ?? 0);
  const clip = isClip(podcast);
  // Clips loop, so a resume point means nothing there.
  const progress = !clip && seconds > 0 ? Math.min(1, saved / seconds) : 0;
  const Kind = clip ? Clapperboard : isVideo(podcast) ? Video : Headphones;

  return (
    <Touchable onPress={() => onPress(podcast)} className="flex-row gap-3" accessibilityLabel={`${podcast.title}, ${ownerName(podcast)}. ${meta}`}>
      <Artwork uri={podcast.coverImage} width={thumbWidth} height={Math.round((thumbWidth * 9) / 16)} radius={10} fit="contain">
        <View className="absolute bottom-1.5 right-1.5 flex-row items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5">
          <Kind size={11} color={colors.white} />
          <AppText variant="caption" tone="white" className="text-[11px]">
            {clip ? (seconds > 0 ? formatClock(seconds) : 'Clip') : formatLength(seconds)}
          </AppText>
        </View>
        {progress > 0.01 ? (
          <View className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/25">
            <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: colors.brand[400] }} />
          </View>
        ) : null}
      </Artwork>

      <View className="flex-1 pt-0.5">
        <AppText variant="title" numberOfLines={2}>
          {podcast.title}
        </AppText>
        <AppText variant="caption" tone="secondary" numberOfLines={1} className="mt-1">
          {ownerName(podcast)}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1} className="mt-0.5">
          {meta}
        </AppText>
      </View>
      {trailing}
    </Touchable>
  );
});

/** Loading placeholder shaped like `MediaRow`. */
export const MediaRowSkeleton = memo(function MediaRowSkeleton({ thumbWidth, rows = 6 }: { thumbWidth: number; rows?: number }) {
  return (
    <View accessibilityLabel="Loading" accessibilityRole="progressbar">
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} className="mb-4 flex-row gap-3">
          <Skeleton width={thumbWidth} height={Math.round((thumbWidth * 9) / 16)} radius={10} />
          <View className="flex-1 pt-1">
            <Skeleton width="92%" height={14} radius={4} />
            <Skeleton width="70%" height={14} radius={4} style={{ marginTop: 6 }} />
            <Skeleton width="45%" height={11} radius={4} style={{ marginTop: 10 }} />
          </View>
        </View>
      ))}
    </View>
  );
});
