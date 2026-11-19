import { FlashList } from '@shopify/flash-list';
import { ChevronLeft, Clock, SearchX, X } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Keyboard, ScrollView, View } from 'react-native';
import type { RootScreenProps } from '@/app/navigation/types';
import { CategoryPill } from '@/components/cards/CategoryPill';
import { Avatar } from '@/components/common/Avatar';
import { AppText } from '@/components/common/AppText';
import { Chip } from '@/components/common/Chip';
import { IconButton } from '@/components/common/IconButton';
import { EmptyState, ErrorState } from '@/components/common/States';
import { Touchable } from '@/components/common/Touchable';
import { ListSkeleton } from '@/components/layouts/ListSkeleton';
import { Screen } from '@/components/layouts/Screen';
import { useBroadcasters, useCategories, useSearch } from '@/hooks/queries';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useMediaActions } from '@/hooks/useMediaActions';
import { useLibraryStore } from '@/store/libraryStore';
import { colors, GUTTER } from '@/theme';
import type { Broadcaster } from '@/types/broadcaster';
import type { Podcast } from '@/types/models';
import { SearchInput } from '../components/SearchInput';
import { CreatorResult, PodcastResult } from '../components/SearchResultCards';

type Filter = 'all' | 'podcasts' | 'creators';
type Row = { kind: 'creator'; item: Broadcaster } | { kind: 'podcast'; item: Podcast };

const SectionTitle = ({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) => (
  <View className="mb-3 mt-7 flex-row items-center justify-between">
    <AppText variant="h3">{title}</AppText>
    {action && onAction ? (
      <Touchable onPress={onAction} className="py-1 pl-3">
        <AppText variant="label" tone="muted">
          {action}
        </AppText>
      </Touchable>
    ) : null}
  </View>
);

/**
 * Search — one box for podcasts and creators. Results come back mixed in a
 * single list (creators first), each with its own card, filterable by type.
 */
export function SearchScreen({ navigation }: RootScreenProps<'Search'>) {
  const [term, setTerm] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const debounced = useDebouncedValue(term.trim(), 300);
  const search = useSearch(debounced);
  const categories = useCategories();
  const creators = useBroadcasters();
  const recent = useLibraryStore((s) => s.recentSearches);
  const { addRecentSearch, removeRecentSearch, clearRecentSearches } = useLibraryStore.getState();
  const { play } = useMediaActions();
  const bottom = useBottomSpace(false);

  const remember = useCallback(() => addRecentSearch(debounced), [addRecentSearch, debounced]);

  const rows = useMemo<Row[]>(() => {
    const r = search.data;
    if (!r) return [];
    const c: Row[] = r.broadcasters.map((item) => ({ kind: 'creator', item }));
    const p: Row[] = r.podcasts.map((item) => ({ kind: 'podcast', item }));
    if (filter === 'creators') return c;
    if (filter === 'podcasts') return p;
    return [...c, ...p];
  }, [filter, search.data]);

  const counts = { creators: search.data?.broadcasters.length ?? 0, podcasts: search.data?.podcasts.length ?? 0 };
  const podcastsOnly = useMemo(() => rows.flatMap((r) => (r.kind === 'podcast' ? [r.item] : [])), [rows]);

  const openCreator = (b: Broadcaster) => {
    remember();
    navigation.navigate('StationDetail', { id: b.id });
  };
  const openPodcast = (p: Podcast) => {
    remember();
    play(p, podcastsOnly);
  };

  const searching = debounced.length >= 2;

  return (
    <Screen>
      <View className="flex-row items-center gap-1 pb-2 pt-2" style={{ paddingLeft: GUTTER - 8, paddingRight: GUTTER }}>
        <IconButton icon={ChevronLeft} size={24} onPress={() => navigation.goBack()} accessibilityLabel="Go back" />
        <View className="flex-1">
          <SearchInput value={term} onChangeText={setTerm} onSubmit={remember} autoFocus />
        </View>
      </View>

      {!searching ? (
        <ScrollView keyboardShouldPersistTaps="handled" onScrollBeginDrag={Keyboard.dismiss} contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: bottom }}>
          {recent.length ? (
            <>
              <SectionTitle title="Recent searches" action="Clear" onAction={clearRecentSearches} />
              {recent.map((r) => (
                <Touchable key={r} onPress={() => setTerm(r)} className="flex-row items-center py-2.5" accessibilityLabel={`Search for ${r}`}>
                  <Clock size={17} color={colors.text.muted} />
                  <AppText variant="body" tone="secondary" className="ml-3 flex-1">
                    {r}
                  </AppText>
                  <Touchable onPress={() => removeRecentSearch(r)} accessibilityLabel={`Remove ${r}`} className="p-1">
                    <X size={16} color={colors.text.faint} />
                  </Touchable>
                </Touchable>
              ))}
            </>
          ) : null}

          {creators.data?.length ? (
            <>
              <SectionTitle title="Popular creators" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                {creators.data.slice(0, 8).map((b) => (
                  <Touchable key={b.id} onPress={() => navigation.navigate('StationDetail', { id: b.id })} className="w-[76px] items-center" accessibilityLabel={b.name}>
                    <Avatar uri={b.avatar} name={b.name} size={68} live={b.isLive} ring={!b.isLive} />
                    <AppText variant="caption" tone="secondary" numberOfLines={2} className="mt-2 text-center">
                      {b.name}
                    </AppText>
                  </Touchable>
                ))}
              </ScrollView>
            </>
          ) : null}

          {categories.data?.length ? (
            <>
              <SectionTitle title="Browse categories" />
              <View className="flex-row flex-wrap gap-2.5">
                {categories.data.map((c) => (
                  <CategoryPill key={c._id} category={c} onPress={() => navigation.navigate('Category', { id: c._id })} />
                ))}
              </View>
            </>
          ) : null}
        </ScrollView>
      ) : (
        <>
          <View className="flex-row gap-2 pb-2 pt-2" style={{ paddingHorizontal: GUTTER }}>
            <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
            <Chip label={`Podcasts${counts.podcasts ? ` · ${counts.podcasts}` : ''}`} selected={filter === 'podcasts'} onPress={() => setFilter('podcasts')} />
            <Chip label={`Creators${counts.creators ? ` · ${counts.creators}` : ''}`} selected={filter === 'creators'} onPress={() => setFilter('creators')} />
          </View>
          {search.isPending ? (
            <ListSkeleton rows={6} />
          ) : search.isError ? (
            <ErrorState onRetry={() => void search.refetch()} />
          ) : (
            <FlashList
              data={rows}
              keyboardShouldPersistTaps="handled"
              onScrollBeginDrag={Keyboard.dismiss}
              keyExtractor={(r) => `${r.kind}-${r.kind === 'creator' ? r.item.id : r.item._id}`}
              getItemType={(r) => r.kind}
              contentContainerStyle={{ paddingHorizontal: GUTTER, paddingTop: 4, paddingBottom: bottom }}
              ListEmptyComponent={<EmptyState icon={SearchX} title={`No results for “${debounced}”`} message="Check the spelling or try another word." />}
              renderItem={({ item }) =>
                item.kind === 'creator' ? (
                  <CreatorResult creator={item.item} query={debounced} onPress={openCreator} />
                ) : (
                  <PodcastResult podcast={item.item} query={debounced} onPress={openPodcast} />
                )
              }
            />
          )}
        </>
      )}
    </Screen>
  );
}
