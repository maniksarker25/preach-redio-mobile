import { MoreHorizontal, Pause, Play, Video } from 'lucide-react-native';
import { memo } from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { Touchable } from '@/components/common/Touchable';
import { Artwork } from '@/components/media/Artwork';
import { Equalizer } from '@/components/media/Equalizer';
import { ProgressLine } from '@/components/media/Seekbar';
import { useLibraryStore } from '@/store/libraryStore';
import { useIsCurrent, usePlayerStore } from '@/store/playerStore';
import { colors, GUTTER } from '@/theme';
import type { Podcast } from '@/types/models';
import { formatLength, podcastSeconds, timeAgo } from '@/utils/format';
import { isVideo, ownerName } from '@/utils/podcast';

interface EpisodeRowProps {
  podcast: Podcast;
  onPress: (p: Podcast) => void;
  onPlay: (p: Podcast) => void;
  onMore?: (p: Podcast) => void;
  index?: number;
  /** Hide the owner name when the list already belongs to one owner. */
  hideOwner?: boolean;
}

/** List row for an episode: artwork, title, meta, saved progress and a play control. */
export const EpisodeRow = memo(function EpisodeRow({ podcast, onPress, onPlay, onMore, index, hideOwner }: EpisodeRowProps) {
  const current = useIsCurrent(podcast._id);
  const playing = usePlayerStore((s) => current && s.isPlaying);
  const saved = useLibraryStore((s) => s.progress[podcast._id] ?? 0);
  const seconds = podcastSeconds(podcast);
  const ratio = seconds > 0 ? saved / seconds : 0;
  const meta = [hideOwner ? null : ownerName(podcast), formatLength(seconds), timeAgo(podcast.createdAt)].filter(Boolean).join(' · ');

  return (
    <Touchable
      onPress={() => onPress(podcast)}
      scaleTo={0.985}
      className="flex-row items-center py-2.5"
      style={{ paddingHorizontal: GUTTER }}
      accessibilityLabel={`${podcast.title}. ${meta}`}
    >
      {index !== undefined ? (
        <AppText variant="label" tone="muted" className="w-6" style={{ fontVariant: ['tabular-nums'] }}>
          {index + 1}
        </AppText>
      ) : null}
      <Artwork uri={podcast.coverImage} width={64} height={64} radius={12}>
        {isVideo(podcast) ? (
          <View className="absolute bottom-1 right-1 rounded-full bg-black/60 p-1">
            <Video size={10} color={colors.white} />
          </View>
        ) : null}
      </Artwork>
      <View className="ml-3.5 flex-1">
        <AppText variant="title" numberOfLines={2} style={current ? { color: colors.brand[400] } : undefined}>
          {podcast.title}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1} className="mt-1">
          {meta}
        </AppText>
        {ratio > 0.02 && !current ? (
          <View className="mt-2 w-24">
            <ProgressLine ratio={ratio} height={3} />
          </View>
        ) : null}
      </View>
      {onMore ? (
        <Touchable onPress={() => onMore(podcast)} accessibilityLabel="More options" className="px-2 py-2">
          <MoreHorizontal size={20} color={colors.text.muted} />
        </Touchable>
      ) : null}
      <Touchable
        haptic
        scaleTo={0.88}
        onPress={() => onPlay(podcast)}
        accessibilityLabel={playing ? 'Pause' : `Play ${podcast.title}`}
        className="ml-1 h-10 w-10 items-center justify-center rounded-full border border-line-strong"
      >
        {current && playing ? (
          <Equalizer playing height={13} barWidth={2.5} bars={3} />
        ) : current ? (
          <Pause size={16} color={colors.text.primary} fill={colors.text.primary} />
        ) : (
          <Play size={16} color={colors.text.primary} fill={colors.text.primary} style={{ marginLeft: 2 }} />
        )}
      </Touchable>
    </Touchable>
  );
});
