import { Heart } from 'lucide-react-native';
import { useMemo } from 'react';
import type { TabScreenProps } from '@/app/navigation/types';
import { EmptyState } from '@/components/common/States';
import { PodcastGrid } from '@/components/layouts/PodcastGrid';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { usePodcastsByIds } from '@/hooks/queries';
import { useMediaActions } from '@/hooks/useMediaActions';
import { useLibraryStore } from '@/store/libraryStore';

/** Favorite tab (Flutter `FavoriteScreen`): podcasts saved with the heart (`/bookmark/my-bookmarks`). */
export function FavoriteScreen({ navigation }: TabScreenProps<'Favorite'>) {
  const saved = useLibraryStore((s) => s.bookmarked);
  const ids = useMemo(() => Object.keys(saved), [saved]);
  const list = usePodcastsByIds(ids);
  const { play } = useMediaActions();
  const items = ids.length ? (list.data ?? []) : [];

  return (
    <Screen>
      <ScreenHeader title="Favorite" back={false} />
      <PodcastGrid
        data={items}
        onPress={(p) => play(p, items)}
        empty={<EmptyState icon={Heart} title="No favorites yet" message="Tap the heart in the player to save a podcast here." actionLabel="Browse" onAction={() => navigation.navigate('Home')} />}
      />
    </Screen>
  );
}
