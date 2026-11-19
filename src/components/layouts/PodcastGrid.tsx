import { FlashList } from '@shopify/flash-list';
import type { ReactElement } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { GridCard } from '@/components/cards/HomeCards';
import { GUTTER } from '@/theme';
import type { Podcast } from '@/types/models';

interface PodcastGridProps {
  data: Podcast[] | undefined;
  onPress: (p: Podcast) => void;
  header?: ReactElement | null;
  empty?: ReactElement | null;
  bottom?: number;
}

const GAP = 12;

/** The Flutter 2-column grid used by History, Favorite, Search, Series and See all. */
export function PodcastGrid({ data, onPress, header, empty, bottom = 24 }: PodcastGridProps) {
  const { width } = useWindowDimensions();
  const cardW = (width - GUTTER * 2 - GAP) / 2;

  return (
    <FlashList
      data={data}
      numColumns={2}
      keyExtractor={(p) => p._id}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: bottom }}
      renderItem={({ item, index }) => (
        <View style={{ paddingLeft: index % 2 === 1 ? GAP / 2 : 0, paddingRight: index % 2 === 0 ? GAP / 2 : 0, marginBottom: 16 }}>
          <GridCard podcast={item} width={cardW} onPress={onPress} />
        </View>
      )}
    />
  );
}
