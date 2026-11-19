import { FlashList } from '@shopify/flash-list';
import { Library } from 'lucide-react-native';
import { useWindowDimensions, View } from 'react-native';
import type { RootScreenProps } from '@/app/navigation/types';
import { SeriesCard } from '@/components/cards/HomeCards';
import { EmptyState, ErrorState } from '@/components/common/States';
import { GridSkeleton } from '@/components/layouts/GridSkeleton';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { useAlbums } from '@/hooks/queries';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { GUTTER } from '@/theme';

/** All series (Flutter `AlbumSeeAllScreen`). */
export function AlbumsScreen({ navigation }: RootScreenProps<'Albums'>) {
  const albums = useAlbums();
  const { width } = useWindowDimensions();
  const bottom = useBottomSpace(false);
  const cardW = (width - GUTTER * 2 - 12) / 2;

  return (
    <Screen>
      <ScreenHeader title="Series" />
      {albums.isPending ? (
        <GridSkeleton items={4} />
      ) : albums.isError ? (
        <ErrorState onRetry={() => void albums.refetch()} />
      ) : (
        <FlashList
          data={albums.data}
          numColumns={2}
          keyExtractor={(a) => a._id}
          contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: bottom }}
          ListEmptyComponent={<EmptyState icon={Library} title="No series yet" />}
          renderItem={({ item, index }) => (
            <View style={{ paddingLeft: index % 2 ? 6 : 0, paddingRight: index % 2 ? 0 : 6, marginBottom: 12 }}>
              <SeriesCard album={item} width={cardW} onPress={(a) => navigation.navigate('Album', { id: a._id })} />
            </View>
          )}
        />
      )}
    </Screen>
  );
}
