import { Clock } from 'lucide-react-native';
import { useMemo } from 'react';
import { View } from 'react-native';
import type { TabScreenProps } from '@/app/navigation/types';
import { AppText } from '@/components/common/AppText';
import { EmptyState } from '@/components/common/States';
import { PodcastGrid } from '@/components/layouts/PodcastGrid';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { usePodcastsByIds } from '@/hooks/queries';
import { useMediaActions } from '@/hooks/useMediaActions';
import { useLibraryStore } from '@/store/libraryStore';
import { colors } from '@/theme';
import type { Podcast } from '@/types/models';

/** History tab (Flutter `HistoryScreen`): "Recently played" in a 2-column grid. */
export function HistoryScreen({ navigation }: TabScreenProps<'History'>) {
  const history = useLibraryStore((s) => s.history);
  const ids = useMemo(() => history.map((h) => h.podcastId), [history]);
  const list = usePodcastsByIds(ids);
  const { play } = useMediaActions();

  // Keep history order; removed/hidden podcasts come back as null from the API and are skipped.
  const items = useMemo(() => {
    const byId = new Map((list.data ?? []).map((p) => [p._id, p]));
    return ids.map((id) => byId.get(id)).filter((p): p is Podcast => Boolean(p));
  }, [ids, list.data]);

  return (
    <Screen>
      <ScreenHeader title="History" back={false} />
      <PodcastGrid
        data={items}
        onPress={(p) => play(p, items)}
        header={
          items.length ? (
            <View className="mb-3 flex-row items-center gap-2">
              <Clock size={15} color={colors.brand[400]} />
              <AppText variant="title" tone="secondary">
                Recently played
              </AppText>
            </View>
          ) : null
        }
        empty={<EmptyState icon={Clock} title="No history yet" message="Podcasts you play will show up here." actionLabel="Start listening" onAction={() => navigation.navigate('Home')} />}
      />
    </Screen>
  );
}
