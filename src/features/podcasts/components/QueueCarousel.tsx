import { Video } from 'lucide-react-native';
import { memo, useCallback, useEffect, useRef } from 'react';
import { FlatList, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { Artwork } from '@/components/media/Artwork';
import { colors, shadow } from '@/theme';
import type { Podcast } from '@/types/models';
import { isVideo } from '@/utils/podcast';

interface QueueCarouselProps {
  queue: Podcast[];
  index: number;
  /** Page width (the screen width). */
  width: number;
  /** Cover size inside each page. */
  itemSize: number;
  onChange: (index: number) => void;
}

/** One full-width page with the cover centred. */
const Page = memo(function Page({ podcast, width, size }: { podcast: Podcast; width: number; size: number }) {
  const video = isVideo(podcast);
  return (
    <View style={{ width, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[{ borderRadius: 16 }, shadow.floating]}>
        <Artwork uri={podcast.coverImage} width={size} height={video ? (size * 9) / 16 : size} radius={16} priority="high">
          {video ? (
            <View style={{ position: 'absolute', left: 12, top: 12 }} className="flex-row items-center gap-1 rounded-full bg-black/60 px-2.5 py-1">
              <Video size={12} color={colors.white} />
              <AppText variant="caption" tone="white">
                Video
              </AppText>
            </View>
          ) : null}
        </Artwork>
      </View>
    </View>
  );
});

/**
 * Full-width, one-podcast-per-page queue. Only the current cover is visible;
 * ⏮ / ⏭ (or a full swipe) move to the previous / next podcast.
 */
export const QueueCarousel = memo(function QueueCarousel({ queue, index, width, itemSize, onChange }: QueueCarouselProps) {
  const listRef = useRef<FlatList<Podcast>>(null);
  const settled = useRef(index);

  // Follow track changes from the buttons and autoplay.
  useEffect(() => {
    if (index < 0 || index === settled.current) return;
    settled.current = index;
    listRef.current?.scrollToOffset({ offset: index * width, animated: true });
  }, [index, width]);

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const i = Math.max(0, Math.min(queue.length - 1, Math.round(e.nativeEvent.contentOffset.x / width)));
      if (i !== settled.current) {
        settled.current = i;
        onChange(i);
      }
    },
    [onChange, queue.length, width],
  );

  return (
    <FlatList
      ref={listRef}
      data={queue}
      horizontal
      pagingEnabled
      keyExtractor={(p) => p._id}
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={onMomentumEnd}
      initialScrollIndex={Math.max(0, index)}
      getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
      windowSize={3}
      renderItem={({ item }) => <Page podcast={item} width={width} size={itemSize} />}
      accessibilityLabel="Now playing cover"
    />
  );
});
