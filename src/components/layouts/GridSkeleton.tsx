import { memo } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { Skeleton } from '@/components/common/States';
import { GUTTER } from '@/theme';

/** Placeholder for the 2-column podcast grid. */
export const GridSkeleton = memo(function GridSkeleton({ items = 6 }: { items?: number }) {
  const { width } = useWindowDimensions();
  const w = (width - GUTTER * 2 - 12) / 2;
  return (
    <View className="flex-row flex-wrap justify-between gap-y-4" style={{ paddingHorizontal: GUTTER }} accessibilityLabel="Loading" accessibilityRole="progressbar">
      {Array.from({ length: items }, (_, i) => (
        <View key={i}>
          <Skeleton width={w} height={w} radius={8} />
          <Skeleton width={w * 0.8} height={13} radius={4} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>
  );
});
