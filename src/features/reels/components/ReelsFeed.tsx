import { useIsFocused } from '@react-navigation/native';
import { Clapperboard } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, FlatList, View, type LayoutChangeEvent } from 'react-native';
import { EmptyState } from '@/components/common/States';
import { usePlayerStore } from '@/store/playerStore';
import type { Podcast } from '@/types/models';
import { ReelItem } from './ReelItem';

interface ReelsFeedProps {
  clips: Podcast[];
  startId?: string;
  /** Space reserved at the bottom (tab bar / home indicator) for overlays. */
  bottomInset: number;
  /** Called a couple of clips before the end, to load the next page. */
  onEndReached?: () => void;
}

const VIEWABILITY = { itemVisiblePercentThreshold: 80 };

/** True while the app is in the foreground. */
const useAppActive = () => {
  const [activeApp, setActiveApp] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setActiveApp(s === 'active'));
    return () => sub.remove();
  }, []);
  return activeApp;
};

/**
 * Vertical, full-height paging list of clips. Only the visible clip plays; the one
 * above and below stay mounted so their players are already buffered.
 */
export function ReelsFeed({ clips, startId, bottomInset, onEndReached }: ReelsFeedProps) {
  const [height, setHeight] = useState(0);
  const startIndex = useMemo(() => Math.max(0, clips.findIndex((c) => c._id === startId)), [clips, startId]);
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const focused = useIsFocused();
  const appActive = useAppActive();
  const playing = focused && appActive;
  const pauseAudio = usePlayerStore((s) => s.pause);
  // Dragging a clip's progress bar must not page the feed.
  const [scrubbing, setScrubbing] = useState(false);

  // Clips have sound; don't talk over a sermon in the background.
  useEffect(() => {
    if (focused) pauseAudio();
  }, [focused, pauseAudio]);

  // Stable identity: FlatList doesn't allow changing onViewableItemsChanged on the fly.
  const onViewable = useCallback(({ viewableItems }: { viewableItems: { index?: number | null }[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) setActiveIndex(first.index);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: Podcast; index: number }) => <ReelItem clip={item} height={height} active={playing && index === activeIndex} bottomInset={bottomInset} onScrubbingChange={setScrubbing} />,
    [activeIndex, bottomInset, playing, height],
  );

  if (!clips.length) return <EmptyState icon={Clapperboard} title="No clips yet" message="Short moments from sermons will appear here." />;

  return (
    <View className="flex-1 bg-black" onLayout={(e: LayoutChangeEvent) => setHeight(e.nativeEvent.layout.height)}>
      {height > 0 ? (
        <FlatList
          data={clips}
          keyExtractor={(c) => c._id}
          renderItem={renderItem}
          extraData={activeIndex}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!scrubbing}
          // Exactly one clip per swipe: snap to each full-height page and ignore
          // fling momentum, so a hard/long swipe still stops on the next clip.
          snapToInterval={height}
          snapToAlignment="start"
          disableIntervalMomentum
          decelerationRate="fast"
          initialScrollIndex={startIndex}
          getItemLayout={(_, i) => ({ length: height, offset: height * i, index: i })}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={VIEWABILITY}
          onEndReached={onEndReached}
          onEndReachedThreshold={3}
          // Previous + current + next are mounted (and buffering); everything else is released.
          windowSize={3}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          removeClippedSubviews
        />
      ) : null}
    </View>
  );
}
