import { ChevronRight, Headphones, Mic2, Play, Radio, Video } from 'lucide-react-native';
import { memo } from 'react';
import { View } from 'react-native';
import { Avatar } from '@/components/common/Avatar';
import { AppText } from '@/components/common/AppText';
import { LiveBadge } from '@/components/common/LiveBadge';
import { Touchable } from '@/components/common/Touchable';
import { Artwork } from '@/components/media/Artwork';
import { colors } from '@/theme';
import type { Broadcaster } from '@/types/broadcaster';
import type { Podcast } from '@/types/models';
import { formatCount, formatLength, podcastSeconds } from '@/utils/format';
import { isClip, isVideo, ownerName } from '@/utils/podcast';
import { HighlightText } from './HighlightText';

/**
 * Podcast result — square artwork, title, owner · category · length, play button.
 * Flat row on the page background so it reads as content.
 */
export const PodcastResult = memo(function PodcastResult({ podcast, query, onPress }: { podcast: Podcast; query: string; onPress: (p: Podcast) => void }) {
  const kind = isClip(podcast) ? 'Clip' : isVideo(podcast) ? 'Video' : 'Podcast';
  return (
    <Touchable onPress={() => onPress(podcast)} scaleTo={0.985} className="flex-row items-center py-2.5" accessibilityLabel={`${kind}: ${podcast.title}`}>
      <Artwork uri={podcast.coverImage} width={64} height={64} radius={10}>
        {isVideo(podcast) ? (
          <View style={{ position: 'absolute', right: 4, bottom: 4 }} className="rounded-full bg-black/60 p-1">
            <Video size={10} color={colors.white} />
          </View>
        ) : null}
      </Artwork>
      <View className="ml-3.5 flex-1">
        <HighlightText text={podcast.title} query={query} variant="title" numberOfLines={2} className="text-[15px]" />
        <AppText variant="caption" tone="muted" numberOfLines={1} className="mt-1">
          {kind} · {ownerName(podcast)} · {formatLength(podcastSeconds(podcast))}
        </AppText>
      </View>
      <View className="ml-3 h-9 w-9 items-center justify-center rounded-full bg-white/10">
        <Play size={14} color={colors.white} fill={colors.white} style={{ marginLeft: 2 }} />
      </View>
    </Touchable>
  );
});

/**
 * Creator / station result — round avatar with live state, role badge, plays,
 * on a raised card so it stands apart from podcast rows.
 */
export const CreatorResult = memo(function CreatorResult({ creator, query, onPress }: { creator: Broadcaster; query: string; onPress: (b: Broadcaster) => void }) {
  const station = creator.kind === 'station';
  return (
    <Touchable
      onPress={() => onPress(creator)}
      scaleTo={0.985}
      className="my-1.5 flex-row items-center rounded-xl p-3"
      style={{ backgroundColor: colors.ink[800], borderWidth: 1, borderColor: 'rgba(230,167,168,0.14)' }}
      accessibilityLabel={`${station ? 'Station' : 'Creator'}: ${creator.name}${creator.isLive ? ', live now' : ''}`}
    >
      <View>
        <Avatar uri={creator.avatar} name={creator.name} size={60} ring={!creator.isLive} live={creator.isLive} />
        {creator.isLive ? (
          <View style={{ position: 'absolute', bottom: -4, left: 0, right: 0, alignItems: 'center' }}>
            <LiveBadge size="sm" />
          </View>
        ) : null}
      </View>
      <View className="ml-3.5 flex-1">
        <View className="flex-row items-center gap-1.5">
          <HighlightText text={creator.name} query={query} variant="title" numberOfLines={1} className="shrink text-[16px]" />
        </View>
        <View className="mt-1.5 flex-row items-center gap-2">
          <View className="flex-row items-center gap-1 rounded-full bg-brand-400/15 px-2 py-0.5">
            {station ? <Radio size={11} color={colors.brand[300]} /> : <Mic2 size={11} color={colors.brand[300]} />}
            <AppText variant="caption" className="text-[11px]" style={{ color: colors.brand[300] }}>
              {station ? 'Station' : 'Creator'}
            </AppText>
          </View>
          <View className="flex-row items-center gap-1">
            <Headphones size={11} color={colors.text.muted} />
            <AppText variant="caption" tone="muted">
              {formatCount(creator.totalViews)} plays · {creator.podcastCount} podcasts
            </AppText>
          </View>
        </View>
      </View>
      <ChevronRight size={18} color={colors.text.muted} />
    </Touchable>
  );
});
