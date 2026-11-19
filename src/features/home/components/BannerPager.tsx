import { LinearGradient } from 'expo-linear-gradient';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { Touchable } from '@/components/common/Touchable';
import { Artwork } from '@/components/media/Artwork';
import { GUTTER, shadow } from '@/theme';

export interface BannerItem {
  id: string;
  image?: string | null;
  title: string;
}

interface BannerPagerProps {
  items: BannerItem[];
  /** Small label on the image, e.g. "Album" or "Advertisement". */
  badge: string;
  buttonLabel: string;
  onPress: (item: BannerItem) => void;
  autoAdvanceMs?: number;
}

/**
 * Flutter `MediaBannerCard` in a `PageView`: 2:1 image with a badge, a dark
 * strip with the title and a white pill button, auto-advancing every 4 s.
 */
export const BannerPager = memo(function BannerPager({ items, badge, buttonLabel, onPress, autoAdvanceMs = 4000 }: BannerPagerProps) {
  const { width: screen } = useWindowDimensions();
  const cardW = screen - GUTTER * 2;
  const listRef = useRef<FlatList<BannerItem>>(null);
  const [index, setIndex] = useState(0);
  const dragging = useRef(false);

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => {
      if (dragging.current) return;
      setIndex((i) => {
        const next = (i + 1) % items.length;
        listRef.current?.scrollToOffset({ offset: next * screen, animated: true });
        return next;
      });
    }, autoAdvanceMs);
    return () => clearInterval(t);
  }, [autoAdvanceMs, items.length, screen]);

  const onEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      dragging.current = false;
      setIndex(Math.round(e.nativeEvent.contentOffset.x / screen));
    },
    [screen],
  );

  if (!items.length) return null;

  return (
    <View>
      <FlatList
        ref={listRef}
        data={items}
        horizontal
        pagingEnabled
        keyExtractor={(i) => i.id}
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => (dragging.current = true)}
        onMomentumScrollEnd={onEnd}
        getItemLayout={(_, i) => ({ length: screen, offset: screen * i, index: i })}
        renderItem={({ item }) => (
          <View style={{ width: screen, paddingHorizontal: GUTTER, paddingVertical: 8 }}>
            <Touchable onPress={() => onPress(item)} scaleTo={0.97} style={[{ width: cardW, borderRadius: 12 }, shadow.floating]} accessibilityLabel={`${badge}: ${item.title}`}>
              <View className="overflow-hidden rounded-md bg-[#181818]">
                <Artwork uri={item.image} width={cardW} height={cardW / 2} radius={0}>
                  <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 64 }} />
                  <View className="absolute left-2.5 top-2.5 rounded-[6px] border border-white/15 bg-black/70 px-2 py-1">
                    <AppText variant="caption" tone="white" className="text-[11px]">
                      {badge}
                    </AppText>
                  </View>
                </Artwork>
                <View className="flex-row items-center bg-[#1A1A1A] px-3.5 py-2.5">
                  <AppText variant="title" numberOfLines={1} className="flex-1 pr-3 text-[14px]">
                    {item.title}
                  </AppText>
                  <View className="rounded-full bg-white px-4 py-2">
                    <AppText variant="label" tone="inverse" className="text-[13px]">
                      {buttonLabel}
                    </AppText>
                  </View>
                </View>
              </View>
            </Touchable>
          </View>
        )}
      />
      {items.length > 1 ? (
        <View className="mt-1 flex-row justify-center gap-1.5" accessibilityElementsHidden>
          {items.map((it, i) => (
            <View key={it.id} className={i === index ? 'h-1.5 w-4 rounded-full bg-white' : 'h-1.5 w-1.5 rounded-full bg-white/30'} />
          ))}
        </View>
      ) : null}
    </View>
  );
});
