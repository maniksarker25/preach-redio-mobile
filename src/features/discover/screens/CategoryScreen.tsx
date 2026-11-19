import { Headphones } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import type { RootScreenProps } from '@/app/navigation/types';
import { SegmentedTabs } from '@/components/common/SegmentedTabs';
import { EmptyState, ErrorState } from '@/components/common/States';
import { GridSkeleton } from '@/components/layouts/GridSkeleton';
import { PodcastGrid } from '@/components/layouts/PodcastGrid';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { useCategory, usePodcasts } from '@/hooks/queries';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { useMediaActions } from '@/hooks/useMediaActions';
import { GUTTER } from '@/theme';

const SORTS = [
  { key: 'newest', label: 'Newest' },
  { key: 'popular', label: 'Most played' },
] as const;

/** Category: every podcast in the category (no sub-categories in the app), newest or most played. */
export function CategoryScreen({ route }: RootScreenProps<'Category'>) {
  const { id } = route.params;
  const category = useCategory(id);
  const [sort, setSort] = useState<'newest' | 'popular'>('newest');
  const list = usePodcasts({ category: id, sort, limit: 50 });
  const { play } = useMediaActions();
  const bottom = useBottomSpace(false);

  return (
    <Screen>
      <ScreenHeader title={category.data?.name ?? 'Podcast'} />
      <View className="pb-4" style={{ paddingHorizontal: GUTTER }}>
        <SegmentedTabs tabs={SORTS} value={sort} onChange={setSort} />
      </View>
      {list.isLoading ? (
        <GridSkeleton />
      ) : list.isError ? (
        <ErrorState onRetry={() => void list.refetch()} />
      ) : (
        <PodcastGrid data={list.data} bottom={bottom} onPress={(p) => play(p, list.data)} empty={<EmptyState icon={Headphones} title="No podcasts here yet" />} />
      )}
    </Screen>
  );
}
