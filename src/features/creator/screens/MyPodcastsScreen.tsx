import { FlashList } from '@shopify/flash-list';
import { Loader, Mic2, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import type { RootScreenProps } from '@/app/navigation/types';
import { EpisodeRow } from '@/components/cards/EpisodeRow';
import { AppText } from '@/components/common/AppText';
import { IconButton } from '@/components/common/IconButton';
import { SegmentedTabs } from '@/components/common/SegmentedTabs';
import { EmptyState, ErrorState } from '@/components/common/States';
import { ListSkeleton } from '@/components/layouts/ListSkeleton';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { useDeletePodcast, useMyPodcasts } from '@/hooks/queries';
import { useMediaActions } from '@/hooks/useMediaActions';
import { colors, GUTTER } from '@/theme';
import type { Podcast } from '@/types/models';
import { formatCount } from '@/utils/format';

const TABS = [
  { key: 'episode', label: 'Episodes' },
  { key: 'clip', label: 'Clips' },
] as const;

/** Creator's own uploads (`/podcast/my-podcasts`) with HLS processing status. */
export function MyPodcastsScreen({ navigation }: RootScreenProps<'MyPodcasts'>) {
  const [type, setType] = useState<'episode' | 'clip'>('episode');
  const list = useMyPodcasts(type);
  const remove = useDeletePodcast();
  const { play, openDetail } = useMediaActions();

  const totals = (list.data ?? []).reduce((acc, p) => ({ views: acc.views + p.totalView, likes: acc.likes + p.totalLikes }), { views: 0, likes: 0 });

  const onMore = (p: Podcast) =>
    Alert.alert(p.title, undefined, [
      { text: 'View', onPress: () => openDetail(p) },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Delete this message?', 'Its likes, comments and bookmarks are deleted too.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(p._id) },
          ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);

  return (
    <Screen>
      <ScreenHeader title="My podcasts" right={<IconButton icon={Plus} variant="brand" size={20} onPress={() => navigation.navigate('CreateSheet')} accessibilityLabel="Create" />} />
      <View style={{ paddingHorizontal: GUTTER }} className="gap-4 pb-3">
        <View className="flex-row rounded-lg border border-line bg-ink-800 py-4">
          <View className="flex-1 items-center">
            <AppText variant="h2">{list.data?.length ?? 0}</AppText>
            <AppText variant="caption" tone="muted">
              {type === 'clip' ? 'Clips' : 'Episodes'}
            </AppText>
          </View>
          <View className="w-px bg-line" />
          <View className="flex-1 items-center">
            <AppText variant="h2">{formatCount(totals.views)}</AppText>
            <AppText variant="caption" tone="muted">
              Plays
            </AppText>
          </View>
          <View className="w-px bg-line" />
          <View className="flex-1 items-center">
            <AppText variant="h2">{formatCount(totals.likes)}</AppText>
            <AppText variant="caption" tone="muted">
              Likes
            </AppText>
          </View>
        </View>
        <SegmentedTabs tabs={TABS} value={type} onChange={setType} />
      </View>
      {list.isPending ? (
        <ListSkeleton />
      ) : list.isError ? (
        <ErrorState onRetry={() => void list.refetch()} />
      ) : (
        <FlashList
          data={list.data}
          keyExtractor={(p) => p._id}
          contentContainerStyle={{ paddingBottom: 48 }}
          ListEmptyComponent={<EmptyState icon={Mic2} title="Nothing published yet" message="Upload your first message to start reaching listeners." actionLabel="Create" onAction={() => navigation.navigate('CreateSheet')} />}
          renderItem={({ item }) => (
            <View>
              <EpisodeRow podcast={item} hideOwner onPress={openDetail} onPlay={(p) => play(p)} onMore={onMore} />
              {item.processing?.status === 'processing' || item.processing?.status === 'queued' ? (
                <View className="-mt-1 mb-2 ml-[104px] flex-row items-center gap-1.5">
                  <Loader size={12} color={colors.gold} />
                  <AppText variant="caption" tone="gold">
                    Optimizing for streaming…
                  </AppText>
                </View>
              ) : null}
            </View>
          )}
        />
      )}
    </Screen>
  );
}
