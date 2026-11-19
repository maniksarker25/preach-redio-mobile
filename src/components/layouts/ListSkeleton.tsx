import { memo } from 'react';
import { View } from 'react-native';
import { Skeleton } from '@/components/common/States';
import { GUTTER } from '@/theme';

/** Placeholder for EpisodeRow lists. */
export const ListSkeleton = memo(function ListSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <View style={{ paddingHorizontal: GUTTER, paddingTop: 8, gap: 18 }} accessibilityLabel="Loading" accessibilityRole="progressbar">
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} className="flex-row items-center">
          <Skeleton width={64} height={64} radius={12} />
          <View className="ml-3.5 flex-1 gap-2">
            <Skeleton width="80%" height={14} radius={6} />
            <Skeleton width="50%" height={12} radius={6} />
          </View>
        </View>
      ))}
    </View>
  );
});
