import { memo } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { Skeleton } from '@/components/common/States';
import { GUTTER } from '@/theme';

/** Mirrors the home layout (hero, category row, avatars) while loading. */
export const HomeSkeleton = memo(function HomeSkeleton() {
  const { width } = useWindowDimensions();
  const heroW = width - GUTTER * 2;
  return (
    <View style={{ paddingHorizontal: GUTTER }} className="mt-1" accessibilityLabel="Loading" accessibilityRole="progressbar">
      <Skeleton width={heroW} height={heroW * 0.68} radius={16} />
      <View className="mt-5 flex-row gap-2">
        {[110, 96, 120].map((w, i) => (
          <Skeleton key={i} width={w} height={44} radius={22} />
        ))}
      </View>
      <Skeleton width={160} height={22} radius={6} style={{ marginTop: 28 }} />
      <View className="mt-4 flex-row gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} width={96} height={96} radius={48} />
        ))}
      </View>
    </View>
  );
});
