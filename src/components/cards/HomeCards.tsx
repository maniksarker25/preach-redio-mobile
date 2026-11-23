import { LinearGradient } from 'expo-linear-gradient';
import { Play, Video } from 'lucide-react-native';
import { memo } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { Touchable } from '@/components/common/Touchable';
import { Artwork, Scrim } from '@/components/media/Artwork';
import { colors } from '@/theme';
import type { Album, Podcast } from '@/types/models';
import { formatLength, podcastSeconds } from '@/utils/format';
import { isVideo } from '@/utils/podcast';

/**
 * Just In / Faith Hits card size. 16:9 (approved deviation from Flutter's square `HomeMusicCard`): most episodes are
 * video with 16:9 covers, so they show whole and large. ~68% of the screen wide, so the next card peeks in.
 */
export const musicCardSize = (screen: number) => {
  const width = Math.round(screen * 0.68);
  return { width, height: Math.round((width * 9) / 16) };
};

/** Flutter `HomeMusicCard` — Just In / Faith Hits rails: cover + one-line title. Square (audio) covers sit centred over a blur. */
export const MusicCard = memo(function MusicCard({ podcast, onPress }: { podcast: Podcast; onPress: (p: Podcast) => void }) {
  const { width: screen } = useWindowDimensions();
  const { width: w, height: h } = musicCardSize(screen);
  return (
    <Touchable onPress={() => onPress(podcast)} style={{ width: w }} accessibilityLabel={podcast.title}>
      <Artwork uri={podcast.coverImage} width={w} height={h} radius={8} fit="contain">
        <View className="absolute bottom-1.5 right-1.5 flex-row items-center gap-1 rounded-xs bg-black/60 px-1.5 py-0.5">
          {isVideo(podcast) ? <Video size={10} color={colors.white} /> : null}
          <AppText variant="caption" tone="white" className="text-[10px]">
            {formatLength(podcastSeconds(podcast))}
          </AppText>
        </View>
      </Artwork>
      <AppText variant="title" numberOfLines={1} className="mt-2 text-[14px]">
        {podcast.title}
      </AppText>
      <AppText variant="caption" tone="muted" numberOfLines={1}>
        {podcast.category.name}
      </AppText>
    </Touchable>
  );
});

/** Flutter `HomeReelsCard` — Praise Clips: a third of the screen wide, 250 tall. */
export const ReelThumb = memo(function ReelThumb({ podcast, onPress }: { podcast: Podcast; onPress: (p: Podcast) => void }) {
  const { width: screen } = useWindowDimensions();
  const w = screen / 3;
  return (
    <Touchable onPress={() => onPress(podcast)} accessibilityLabel={`Clip: ${podcast.title}`}>
      <Artwork uri={podcast.coverImage} width={w} height={250} radius={5}>
        <Scrim strength={0.8} from={0.55} />
        <View className="absolute bottom-0 left-0 right-0 p-2">
          <AppText variant="label" tone="white" numberOfLines={2} className="text-[13px]">
            {podcast.title}
          </AppText>
          <View className="mt-1 flex-row items-center gap-1">
            <Play size={10} color={colors.white} fill={colors.white} />
            <AppText variant="caption" tone="white" className="text-[10px]">
              {formatLength(podcastSeconds(podcast))}
            </AppText>
          </View>
        </View>
      </Artwork>
    </Touchable>
  );
});

/** Flutter `HomeSeriesCard`: the first series spans the screen, the rest are narrow; title over a dark fade. */
export const SeriesCard = memo(function SeriesCard({ album, width, onPress }: { album: Album; width: number; onPress: (a: Album) => void }) {
  return (
    <Touchable onPress={() => onPress(album)} scaleTo={0.98} accessibilityLabel={`Series: ${album.name}`}>
      <Artwork uri={album.cover_image} width={width} height={250} radius={8}>
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} locations={[0.45, 1]} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        <View className="absolute bottom-0 left-0 right-0 px-2.5 pb-3">
          <AppText variant="title" tone="white" numberOfLines={2} className="text-[16px]">
            {album.name}
          </AppText>
          <AppText variant="caption" tone="secondary" className="mt-0.5">
            {album.podcasts.length} messages
          </AppText>
        </View>
      </Artwork>
    </Touchable>
  );
});

/** Grid item used by History, Favorite, Search, Series and See-all screens (Flutter `CreatorCard`). */
export const GridCard = memo(function GridCard({ podcast, width, onPress }: { podcast: Podcast; width: number; onPress: (p: Podcast) => void }) {
  return (
    <Touchable onPress={() => onPress(podcast)} style={{ width }} accessibilityLabel={podcast.title}>
      <Artwork uri={podcast.coverImage} width={width} height={width} radius={8} fit="contain">
        {isVideo(podcast) ? (
          <View className="absolute left-1.5 top-1.5 rounded-xs bg-black/60 p-1">
            <Video size={11} color={colors.white} />
          </View>
        ) : null}
      </Artwork>
      <AppText variant="title" numberOfLines={1} className="mt-2 text-[14px]">
        {podcast.title}
      </AppText>
      <AppText variant="caption" tone="muted" numberOfLines={1}>
        {podcast.category.name} · {formatLength(podcastSeconds(podcast))}
      </AppText>
    </Touchable>
  );
});
