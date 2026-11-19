import { Headphones, Play } from 'lucide-react-native';
import { useWindowDimensions, View } from 'react-native';
import type { RootScreenProps } from '@/app/navigation/types';
import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { EmptyState, ErrorState } from '@/components/common/States';
import { GridSkeleton } from '@/components/layouts/GridSkeleton';
import { PodcastGrid } from '@/components/layouts/PodcastGrid';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { Artwork } from '@/components/media/Artwork';
import { useAlbum } from '@/hooks/queries';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { useMediaActions } from '@/hooks/useMediaActions';
import { GUTTER } from '@/theme';

/** Series / album (Flutter `AlbumPodcastScreen`): cover, play, and its podcasts in a 2-column grid. */
export function AlbumScreen({ route }: RootScreenProps<'Album'>) {
  const album = useAlbum(route.params.id);
  const { play } = useMediaActions();
  const { width } = useWindowDimensions();
  const bottom = useBottomSpace(false);
  const a = album.data;

  return (
    <Screen>
      <ScreenHeader title={a?.name} />
      {album.isPending ? (
        <GridSkeleton />
      ) : album.isError || !a ? (
        <ErrorState onRetry={() => void album.refetch()} />
      ) : (
        <PodcastGrid
          data={a.podcasts}
          bottom={bottom}
          onPress={(p) => play(p, a.podcasts)}
          empty={<EmptyState icon={Headphones} title="No data found!" />}
          header={
            <View className="pb-5">
              <Artwork uri={a.cover_image} width={width - GUTTER * 2} height={(width - GUTTER * 2) / 2} radius={12} priority="high" />
              <AppText variant="h1" className="mt-4">
                {a.name}
              </AppText>
              {a.description ? (
                <AppText variant="bodySm" tone="secondary" className="mt-1">
                  {a.description}
                </AppText>
              ) : null}
              {a.podcasts[0] ? <Button label="Play now" icon={Play} onPress={() => play(a.podcasts[0]!, a.podcasts)} className="mt-4" /> : null}
            </View>
          }
        />
      )}
    </Screen>
  );
}
