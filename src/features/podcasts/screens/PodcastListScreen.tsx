import { Headphones } from 'lucide-react-native';
import type { RootScreenProps } from '@/app/navigation/types';
import { EmptyState, ErrorState } from '@/components/common/States';
import { GridSkeleton } from '@/components/layouts/GridSkeleton';
import { PodcastGrid } from '@/components/layouts/PodcastGrid';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { usePodcasts } from '@/hooks/queries';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { useMediaActions } from '@/hooks/useMediaActions';

/** "See all" for Just In / Faith Hits / Praise Clips (Flutter `PodcastListScreen`, 2-column grid). */
export function PodcastListScreen({ route }: RootScreenProps<'PodcastList'>) {
  const { title, query } = route.params;
  const list = usePodcasts({ ...query, limit: 50 });
  const { play } = useMediaActions();
  const bottom = useBottomSpace(false);

  return (
    <Screen>
      <ScreenHeader title={title} />
      {list.isPending ? (
        <GridSkeleton />
      ) : list.isError ? (
        <ErrorState onRetry={() => void list.refetch()} />
      ) : (
        <PodcastGrid data={list.data} bottom={bottom} onPress={(p) => play(p, list.data)} empty={<EmptyState icon={Headphones} title="Nothing here yet" />} />
      )}
    </Screen>
  );
}
