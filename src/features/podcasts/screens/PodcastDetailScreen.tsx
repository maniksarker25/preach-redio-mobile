import { Bookmark, Clock, Eye, Heart, ListPlus, MessageCircle, Play, Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, { interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootScreenProps } from '@/app/navigation/types';
import { EpisodeRow } from '@/components/cards/EpisodeRow';
import { Avatar } from '@/components/common/Avatar';
import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { Chip } from '@/components/common/Chip';
import { IconButton } from '@/components/common/IconButton';
import { ErrorState, Skeleton } from '@/components/common/States';
import { Touchable } from '@/components/common/Touchable';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { Artwork } from '@/components/media/Artwork';
import { BlurredBackdrop } from '@/components/media/BlurredBackdrop';
import { ProgressLine } from '@/components/media/Seekbar';
import { useComments, usePodcast, useRelatedPodcasts } from '@/hooks/queries';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { useMediaActions } from '@/hooks/useMediaActions';
import { useLibraryStore } from '@/store/libraryStore';
import { useIsCurrent, usePlayerStore } from '@/store/playerStore';
import { colors, GUTTER, shadow } from '@/theme';
import type { Podcast } from '@/types/models';
import { formatCount, formatLength, podcastSeconds, timeAgo } from '@/utils/format';
import { isVideo, ownerOf, ownerName } from '@/utils/podcast';
import { sharePodcast } from '@/utils/share';

const Stat = ({ icon: Icon, label }: { icon: typeof Eye; label: string }) => (
  <View className="flex-row items-center gap-1.5">
    <Icon size={14} color={colors.text.muted} />
    <AppText variant="caption" tone="secondary">
      {label}
    </AppText>
  </View>
);

export function PodcastDetailScreen({ route, navigation }: RootScreenProps<'PodcastDetail'>) {
  const { id } = route.params;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bottom = useBottomSpace(false);
  const query = usePodcast(id);
  const related = useRelatedPodcasts(id);
  const comments = useComments(id);
  const { play, openDetail } = useMediaActions();
  const [expanded, setExpanded] = useState(false);

  const liked = useLibraryStore((s) => Boolean(s.liked[id]));
  const bookmarked = useLibraryStore((s) => Boolean(s.bookmarked[id]));
  const saved = useLibraryStore((s) => s.progress[id] ?? 0);
  const { toggleLike, toggleBookmark } = useLibraryStore.getState();
  const current = useIsCurrent(id);
  const playing = usePlayerStore((s) => current && s.isPlaying);
  const toggle = usePlayerStore((s) => s.toggle);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const headerTitle = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.value, [220, 300], [0, 1], 'clamp') }));
  const artParallax = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scrollY.value, [-100, 0, 300], [-30, 0, 80]) }, { scale: interpolate(scrollY.value, [-100, 0], [1.08, 1], 'clamp') }],
    opacity: interpolate(scrollY.value, [0, 280], [1, 0.2], 'clamp'),
  }));

  const p = query.data;
  if (query.isPending) {
    return (
      <Screen>
        <ScreenHeader />
        <View className="items-center pt-4">
          <Skeleton width={240} height={240} radius={24} />
          <Skeleton width={260} height={24} style={{ marginTop: 24 }} />
          <Skeleton width={160} height={16} style={{ marginTop: 10 }} />
        </View>
      </Screen>
    );
  }
  if (query.isError || !p) {
    return (
      <Screen>
        <ScreenHeader />
        <ErrorState message="This message may have been removed." onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  const seconds = podcastSeconds(p);
  const owner = ownerOf(p);
  const video = isVideo(p);
  const asPodcast = p as unknown as Podcast;
  const resume = saved > 15 && saved < seconds - 15;
  const artW = video ? width - GUTTER * 2 : Math.min(width * 0.64, 280);
  const artH = video ? (artW * 9) / 16 : artW;

  const onPrimary = () => (current ? toggle() : play(asPodcast, [asPodcast, ...(related.data ?? [])]));
  const primaryLabel = current ? (playing ? 'Pause' : 'Resume') : video ? 'Watch now' : resume ? `Resume · ${formatLength(seconds - saved)} left` : 'Play';

  return (
    <Screen>
      <BlurredBackdrop uri={p.coverImage} />
      <View className="z-10">
        <ScreenHeader
          right={<IconButton icon={Share2} onPress={() => void sharePodcast(p)} accessibilityLabel="Share" />}
          title={undefined}
        />
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 64, right: 64, top: 0, height: 56, alignItems: 'center', justifyContent: 'center' }, headerTitle]}>
          <AppText variant="title" numberOfLines={1}>
            {p.title}
          </AppText>
        </Animated.View>
      </View>

      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottom + insets.bottom }}>
        <Animated.View style={[{ alignItems: 'center', paddingTop: 8 }, artParallax]}>
          <View style={shadow.floating}>
            <Artwork uri={p.coverImage} width={artW} height={artH} radius={24} priority="high">
              {video ? (
                <Touchable onPress={onPrimary} className="absolute inset-0 items-center justify-center" accessibilityLabel="Watch">
                  <View className="h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-black/45">
                    <Play size={26} color={colors.white} fill={colors.white} style={{ marginLeft: 3 }} />
                  </View>
                </Touchable>
              ) : null}
            </Artwork>
          </View>
        </Animated.View>

        <View style={{ paddingHorizontal: GUTTER }} className="mt-7">
          <View className="flex-row flex-wrap gap-2">
            <Chip label={p.category.name} onPress={() => navigation.navigate('Category', { id: p.category._id })} />
          </View>

          <AppText variant="h1" className="mt-4">
            {p.title}
          </AppText>

          <Touchable onPress={() => owner && navigation.navigate('StationDetail', { id: owner._id })} className="mt-4 flex-row items-center self-start" accessibilityLabel={`Open ${ownerName(p)}`}>
            <Avatar uri={owner?.profile_image} name={ownerName(p)} size={36} />
            <View className="ml-2.5">
              <AppText variant="title">{ownerName(p)}</AppText>
              <AppText variant="caption" tone="muted">
                {p.station ? 'Official station' : 'Preacher'} · {timeAgo(p.createdAt)}
              </AppText>
            </View>
          </Touchable>

          <View className="mt-5 flex-row gap-5">
            <Stat icon={Clock} label={formatLength(seconds)} />
            <Stat icon={Eye} label={`${formatCount(p.totalView)} plays`} />
            <Stat icon={Heart} label={formatCount(p.totalLikes + (liked ? 1 : 0))} />
          </View>

          <Button label={primaryLabel} icon={Play} onPress={onPrimary} size="lg" fullWidth className="mt-6" />
          {resume && !current && !video ? (
            <View className="mt-3 px-6">
              <ProgressLine ratio={saved / seconds} />
            </View>
          ) : null}

          <View className="mt-5 flex-row justify-around rounded-xl border border-line bg-ink-800/70 py-1.5">
            <IconButton icon={Heart} fill active={liked} onPress={() => toggleLike(id)} accessibilityLabel={liked ? 'Unlike' : 'Like'} />
            <IconButton icon={Bookmark} fill active={bookmarked} activeColor={colors.white} onPress={() => toggleBookmark(id)} accessibilityLabel={bookmarked ? 'Remove bookmark' : 'Bookmark'} />
            <IconButton icon={ListPlus} onPress={() => navigation.navigate('AddToPlaylist', { podcastId: id })} accessibilityLabel="Add to playlist" />
            <IconButton icon={MessageCircle} onPress={() => navigation.navigate('Comments', { podcastId: id })} accessibilityLabel="Comments" />
          </View>

          <AppText variant="h3" className="mb-2 mt-8">
            About this message
          </AppText>
          <AppText variant="body" tone="secondary" numberOfLines={expanded ? undefined : 4}>
            {p.description}
          </AppText>
          {p.description.length > 160 ? (
            <Touchable onPress={() => setExpanded((e) => !e)} className="mt-1.5 self-start">
              <AppText variant="label" tone="brand">
                {expanded ? 'Show less' : 'Read more'}
              </AppText>
            </Touchable>
          ) : null}
          {p.tags.length ? (
            <View className="mt-4 flex-row flex-wrap gap-2">
              {p.tags.map((t) => (
                <View key={t} className="rounded-full bg-ink-700 px-3 py-1.5">
                  <AppText variant="caption" tone="secondary">
                    #{t}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}

          <Touchable onPress={() => navigation.navigate('Comments', { podcastId: id })} className="mt-8 rounded-xl border border-line bg-ink-800 p-4" accessibilityLabel="Open comments">
            <View className="flex-row items-center justify-between">
              <AppText variant="h3">Comments</AppText>
              <AppText variant="label" tone="muted">
                {comments.data?.length ?? 0}
              </AppText>
            </View>
            {comments.data?.[0] ? (
              <View className="mt-3 flex-row">
                <Avatar uri={comments.data[0].commentor.profile_image} name={comments.data[0].commentor.name} size={28} />
                <AppText variant="bodySm" tone="secondary" numberOfLines={2} className="ml-2.5 flex-1">
                  {comments.data[0].text}
                </AppText>
              </View>
            ) : (
              <AppText variant="bodySm" tone="muted" className="mt-2">
                Be the first to share what spoke to you.
              </AppText>
            )}
          </Touchable>
        </View>

        {related.data?.length ? (
          <View className="mt-9">
            <AppText variant="h2" className="mb-2" style={{ paddingHorizontal: GUTTER }}>
              More like this
            </AppText>
            {related.data.map((r) => (
              <EpisodeRow key={r._id} podcast={r} onPress={openDetail} onPlay={(x) => play(x, related.data)} />
            ))}
          </View>
        ) : null}
      </Animated.ScrollView>
    </Screen>
  );
}
