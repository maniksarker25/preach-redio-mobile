import { HandHeart, Headphones, MapPin, Mic2, Radio, Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, useWindowDimensions, View } from 'react-native';
import Animated, { interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootScreenProps } from '@/app/navigation/types';
import { ReelCard } from '@/components/cards/ReelCard';
import { EpisodeRow } from '@/components/cards/EpisodeRow';
import { Avatar } from '@/components/common/Avatar';
import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { IconButton } from '@/components/common/IconButton';
import { LiveBadge } from '@/components/common/LiveBadge';
import { SegmentedTabs } from '@/components/common/SegmentedTabs';
import { EmptyState, ErrorState, Skeleton } from '@/components/common/States';
import { ListSkeleton } from '@/components/layouts/ListSkeleton';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { Artwork } from '@/components/media/Artwork';
import { useBroadcaster, usePodcasts, usePreviousLives } from '@/hooks/queries';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { useMediaActions } from '@/hooks/useMediaActions';
import { colors, GUTTER } from '@/theme';
import { formatCount, liveFor } from '@/utils/format';
import { shareText } from '@/utils/share';
import { PastBroadcastRow } from '../components/PastBroadcastRow';

const TABS = [
  { key: 'messages', label: 'Messages' },
  { key: 'clips', label: 'Clips' },
  { key: 'live', label: 'Past lives' },
] as const;
type Tab = (typeof TABS)[number]['key'];

const COVER_H = 260;

/** Station / preacher profile: cover, identity, live status, give, and their content. */
export function StationDetailScreen({ route }: RootScreenProps<'StationDetail'>) {
  const { id } = route.params;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bottom = useBottomSpace(false);
  const station = useBroadcaster(id);
  const episodes = usePodcasts({ owner: id, type: 'episode', limit: 50 });
  const clips = usePodcasts({ owner: id, type: 'clip', limit: 50 });
  const past = usePreviousLives(id);
  const { play, openDetail, tuneIn } = useMediaActions();
  const [tab, setTab] = useState<Tab>('messages');

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const coverStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scrollY.value, [-150, 0, COVER_H], [-75, 0, COVER_H * 0.5]) }, { scale: interpolate(scrollY.value, [-150, 0], [1.5, 1], 'clamp') }],
  }));
  const barStyle = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.value, [COVER_H - 120, COVER_H - 60], [0, 1], 'clamp') }));

  const b = station.data;

  if (station.isError) {
    return (
      <Screen>
        <ScreenHeader />
        <ErrorState onRetry={() => void station.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen safeTop={false}>
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0 }, coverStyle]}>
        <Artwork uri={b?.cover} width={width} height={COVER_H + insets.top} radius={0} priority="high" />
      </Animated.View>

      <View className="absolute left-0 right-0 top-0 z-10" style={{ paddingTop: insets.top }}>
        <Animated.View style={[{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.ink[900] }, barStyle]} />
        <ScreenHeader
          title={undefined}
          right={b ? <IconButton icon={Share2} variant="glass" onPress={() => void shareText(`Listen to ${b.name} on Preach Radio\nhttps://preachradio.com`)} accessibilityLabel="Share" /> : null}
        />
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', bottom: 0, left: 64, right: 64, height: 56, alignItems: 'center', justifyContent: 'center' }, barStyle]}>
          <AppText variant="title" numberOfLines={1}>
            {b?.name}
          </AppText>
        </Animated.View>
      </View>

      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: COVER_H + insets.top - 56, paddingBottom: bottom }}>
        <View className="rounded-t-[32px] bg-ink-900" style={{ paddingHorizontal: GUTTER }}>
          <View className="-mt-12 flex-row items-end">
            <Avatar uri={b?.avatar} name={b?.name ?? ''} size={100} live={b?.isLive} ring={!b?.isLive} />
            {b?.isLive ? <LiveBadge className="mb-2 ml-3" /> : null}
          </View>

          {!b ? (
            <View className="mt-4 gap-2.5">
              <Skeleton width={220} height={26} />
              <Skeleton width={160} height={14} />
            </View>
          ) : (
            <>
              <View className="mt-4 flex-row items-center gap-2">
                <AppText variant="h1" className="shrink">
                  {b.name}
                </AppText>
                {b.kind === 'station' ? <Radio size={18} color={colors.brand[400]} /> : <Mic2 size={18} color={colors.brand[400]} />}
              </View>
              <View className="mt-2 flex-row flex-wrap items-center gap-x-4 gap-y-1">
                {b.address ? (
                  <View className="flex-row items-center gap-1.5">
                    <MapPin size={13} color={colors.text.muted} />
                    <AppText variant="caption" tone="secondary">
                      {b.address}
                    </AppText>
                  </View>
                ) : null}
                <View className="flex-row items-center gap-1.5">
                  <Headphones size={13} color={colors.text.muted} />
                  <AppText variant="caption" tone="secondary">
                    {formatCount(b.totalViews)} plays · {b.podcastCount} messages
                  </AppText>
                </View>
              </View>
              {b.description ? (
                <AppText variant="bodySm" tone="secondary" className="mt-3">
                  {b.description}
                </AppText>
              ) : null}

              {b.isLive && b.live ? (
                <View className="mt-5 rounded-xl border border-live/40 bg-live/10 p-4">
                  <AppText variant="overline" tone="live">
                    On air · {liveFor(b.live.session_started_at)}
                  </AppText>
                  <AppText variant="h3" className="mt-1">
                    {b.live.name}
                  </AppText>
                  {b.live.description ? (
                    <AppText variant="bodySm" tone="secondary" className="mt-1">
                      {b.live.description}
                    </AppText>
                  ) : null}
                  <Button label="Listen live" icon={Radio} onPress={() => tuneIn(b)} className="mt-4" />
                </View>
              ) : null}

              {b.donationUrl ? (
                <Button label="Give" icon={HandHeart} variant="outline" onPress={() => void Linking.openURL(b.donationUrl!)} className="mt-4" fullWidth />
              ) : null}
            </>
          )}

          <View className="mb-3 mt-7">
            <SegmentedTabs tabs={TABS} value={tab} onChange={setTab} />
          </View>
        </View>

        {tab === 'messages' ? (
          episodes.isPending ? (
            <ListSkeleton rows={4} />
          ) : episodes.data?.length ? (
            episodes.data.map((p) => <EpisodeRow key={p._id} podcast={p} hideOwner onPress={openDetail} onPlay={(x) => play(x, episodes.data)} />)
          ) : (
            <EmptyState icon={Headphones} title="No messages yet" />
          )
        ) : tab === 'clips' ? (
          clips.data?.length ? (
            <View className="flex-row flex-wrap gap-3" style={{ paddingHorizontal: GUTTER }}>
              {clips.data.map((c) => (
                <ReelCard key={c._id} podcast={c} width={(width - GUTTER * 2 - 24) / 3} onPress={(x) => play(x, clips.data)} />
              ))}
            </View>
          ) : (
            <EmptyState icon={Headphones} title="No clips yet" />
          )
        ) : past.data?.length ? (
          <View className="gap-3" style={{ paddingHorizontal: GUTTER }}>
            {past.data.map((r) => (
              <PastBroadcastRow key={r._id} room={r} onPress={() => undefined} />
            ))}
          </View>
        ) : (
          <EmptyState icon={Radio} title="No past broadcasts" message="Recordings of live sessions will appear here." />
        )}
      </Animated.ScrollView>
    </Screen>
  );
}
