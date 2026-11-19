import { LinearGradient } from 'expo-linear-gradient';
import { Play } from 'lucide-react-native';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { Touchable } from '@/components/common/Touchable';
import { Artwork } from '@/components/media/Artwork';
import { colors, GUTTER, shadow } from '@/theme';

export interface HeroItem {
  id: string;
  image?: string | null;
  /** Small label, e.g. "Featured" or "New series". */
  eyebrow: string;
  title: string;
  subtitle?: string;
  cta: string;
}

interface HeroBannerProps {
  items: HeroItem[];
  onPress: (item: HeroItem) => void;
}

const AUTO_ADVANCE_MS = 5000;

/** Home hero: large featured cards from the admin banners, auto-advancing, with paging dots. */
export const HeroBanner = memo(function HeroBanner({ items, onPress }: HeroBannerProps) {
  const { width: screen } = useWindowDimensions();
  const cardW = screen - GUTTER * 2;
  const cardH = Math.round(cardW * 0.68);
  const listRef = useRef<FlatList<HeroItem>>(null);
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
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(t);
  }, [items.length, screen]);

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
          <View style={{ width: screen, paddingHorizontal: GUTTER }}>
            <Touchable onPress={() => onPress(item)} scaleTo={0.98} style={[{ borderRadius: 16 }, shadow.floating]} accessibilityLabel={`${item.eyebrow}: ${item.title}`}>
              <Artwork uri={item.image} width={cardW} height={cardH} radius={16} priority="high">
                <LinearGradient
                  colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.92)']}
                  locations={[0, 0.45, 1]}
                  style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                />
                <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
                  <View className="mb-2 self-start rounded-[6px] border border-white/15 bg-black/60 px-2 py-1">
                    <AppText variant="caption" tone="white" className="text-[11px]">
                      {item.eyebrow}
                    </AppText>
                  </View>
                  <AppText variant="h1" tone="white" numberOfLines={2}>
                    {item.title}
                  </AppText>
                  <View className="mt-3 flex-row items-center">
                    <AppText variant="bodySm" tone="secondary" numberOfLines={1} className="flex-1 pr-3">
                      {item.subtitle}
                    </AppText>
                    <View className="flex-row items-center gap-1.5 rounded-full bg-white px-4 py-2">
                      <Play size={14} color={colors.black} fill={colors.black} />
                      <AppText variant="label" tone="inverse" className="text-[13px]">
                        {item.cta}
                      </AppText>
                    </View>
                  </View>
                </View>
              </Artwork>
            </Touchable>
          </View>
        )}
      />
      {items.length > 1 ? (
        <View className="mt-3 flex-row justify-center gap-1.5" accessibilityElementsHidden>
          {items.map((it, i) => (
            <View key={it.id} className={i === index ? 'h-1.5 w-5 rounded-full bg-white' : 'h-1.5 w-1.5 rounded-full bg-white/30'} />
          ))}
        </View>
      ) : null}
    </View>
  );
});
