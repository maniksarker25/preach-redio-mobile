import { useIsFocused } from '@react-navigation/native';
import { Clapperboard } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, View, type LayoutChangeEvent } from 'react-native';
import { EmptyState } from '@/components/common/States';
import { usePlayerStore } from '@/store/playerStore';
import type { Podcast } from '@/types/models';
import { ReelItem } from './ReelItem';

interface ReelsFeedProps {
  clips: Podcast[];
  startId?: string;
  /** Space reserved at the bottom (tab bar / home indicator) for overlays. */
  bottomInset: number;
}

const VIEWABILITY = { itemVisiblePercentThreshold: 80 };

/** Vertical, full-height paging list of clips. Only the visible clip plays. */
export function ReelsFeed({ clips, startId, bottomInset }: ReelsFeedProps) {
  const [height, setHeight] = useState(0);
  const startIndex = useMemo(() => Math.max(0, clips.findIndex((c) => c._id === startId)), [clips, startId]);
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const focused = useIsFocused();
  const pauseAudio = usePlayerStore((s) => s.pause);

  // Clips have sound; don't talk over a sermon in the background.
  useEffect(() => {
    if (focused) pauseAudio();
  }, [focused, pauseAudio]);

  const onViewable = useRef(({ viewableItems }: { viewableItems: { index?: number | null }[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) setActiveIndex(first.index);
  }).current;

  const renderItem = useCallback(
    ({ item, index }: { item: Podcast; index: number }) => <ReelItem clip={item} height={height} active={focused && index === activeIndex} bottomInset={bottomInset} />,
    [activeIndex, bottomInset, focused, height],
  );

  if (!clips.length) return <EmptyState icon={Clapperboard} title="No clips yet" message="Short moments from sermons will appear here." />;

  return (
    <View className="flex-1 bg-black" onLayout={(e: LayoutChangeEvent) => setHeight(e.nativeEvent.layout.height)}>
      {height > 0 ? (
        <FlatList
          data={clips}
          keyExtractor={(c) => c._id}
          renderItem={renderItem}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={height}
          initialScrollIndex={startIndex}
          getItemLayout={(_, i) => ({ length: height, offset: height * i, index: i })}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={VIEWABILITY}
          windowSize={3}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          removeClippedSubviews
        />
      ) : null}
    </View>
  );
}
