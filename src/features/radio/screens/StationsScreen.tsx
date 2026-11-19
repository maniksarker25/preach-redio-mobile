import { FlashList } from '@shopify/flash-list';
import { Radio } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import type { RootScreenProps } from '@/app/navigation/types';
import { StationRow } from '@/components/cards/BroadcasterCards';
import { SearchField } from '@/components/common/SearchField';
import { SegmentedTabs } from '@/components/common/SegmentedTabs';
import { EmptyState, ErrorState } from '@/components/common/States';
import { ListSkeleton } from '@/components/layouts/ListSkeleton';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { useBroadcasters } from '@/hooks/queries';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { useMediaActions } from '@/hooks/useMediaActions';
import { GUTTER } from '@/theme';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live now' },
] as const;

/** Directory of the station and every creator channel. */
export function StationsScreen({ navigation }: RootScreenProps<'Stations'>) {
  const list = useBroadcasters();
  const { tuneIn } = useMediaActions();
  const bottom = useBottomSpace(false);
  const [term, setTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'live'>('all');

  const data = useMemo(
    () =>
      (list.data ?? [])
        .filter((b) => filter === 'all' || b.isLive)
        .filter((b) => b.name.toLowerCase().includes(term.trim().toLowerCase())),
    [filter, list.data, term],
  );

  return (
    <Screen>
      <ScreenHeader title="Top Favorites" />
      <View className="gap-3 pb-4" style={{ paddingHorizontal: GUTTER }}>
        <SearchField value={term} onChangeText={setTerm} placeholder="Find a station or preacher" />
        <SegmentedTabs tabs={FILTERS} value={filter} onChange={setFilter} />
      </View>
      {list.isLoading ? (
        <ListSkeleton />
      ) : list.isError ? (
        <ErrorState onRetry={() => void list.refetch()} />
      ) : (
        <FlashList
          data={data}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: bottom }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          ListEmptyComponent={<EmptyState icon={Radio} title={filter === 'live' ? 'No one is live right now' : 'No matches'} />}
          renderItem={({ item }) => <StationRow broadcaster={item} onPress={(b) => navigation.navigate('StationDetail', { id: b.id })} onListen={tuneIn} />}
        />
      )}
    </Screen>
  );
}
