import { memo } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { MusicCard, musicCardSize } from '@/components/cards/HomeCards';
import { AppText } from '@/components/common/AppText';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Skeleton } from '@/components/common/States';
import { Touchable } from '@/components/common/Touchable';
import { Rail } from '@/components/layouts/Rail';
import { GUTTER } from '@/theme';
import type { Podcast } from '@/types/models';

interface EpisodeRailProps {
  title: string;
  items: Podcast[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSeeAll: () => void;
  onPress: (p: Podcast, rail: Podcast[]) => void;
}

const podcastKey = (p: Podcast) => p._id;

/**
 * Just In / Faith Hits (Flutter `HomeMusicCard` rail) on live data.
 * Loading → card skeletons · error with nothing cached → a retry line · empty → hidden, like the other home sections.
 */
export const EpisodeRail = memo(function EpisodeRail({ title, items, isLoading, isError, onRetry, onSeeAll, onPress }: EpisodeRailProps) {
  const { width: screen } = useWindowDimensions();
  const { width: cardW, height: cardH } = musicCardSize(screen);

  if (!isLoading && !isError && items.length === 0) return null;

  return (
    <View className="mt-5">
      <SectionHeader title={title} onAction={items.length ? onSeeAll : undefined} />
      {isLoading ? (
        <View style={{ paddingHorizontal: GUTTER }} className="flex-row gap-2" accessibilityLabel={`Loading ${title}`} accessibilityRole="progressbar">
          {[0, 1].map((i) => (
            <View key={i}>
              <Skeleton width={cardW} height={cardH} radius={8} />
              <Skeleton width={cardW * 0.8} height={14} radius={4} style={{ marginTop: 10 }} />
              <Skeleton width={cardW * 0.5} height={12} radius={4} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      ) : items.length === 0 ? (
        <Touchable onPress={onRetry} style={{ paddingHorizontal: GUTTER, paddingVertical: 12 }} accessibilityLabel={`Retry loading ${title}`}>
          <AppText variant="caption" tone="muted">
            Couldn&apos;t load {title}. Tap to retry.
          </AppText>
        </Touchable>
      ) : (
        <Rail data={items} keyExtractor={podcastKey} gap={8} renderItem={({ item }) => <MusicCard podcast={item} onPress={(p) => onPress(p, items)} />} />
      )}
    </View>
  );
});
