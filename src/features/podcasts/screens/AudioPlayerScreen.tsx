import { ChevronDown, Gem, Heart, ListPlus, MessageCircle, Pause, Play, RotateCcw, RotateCw, Share2, SkipBack, SkipForward, ThumbsUp } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useEffect } from 'react';
import { Linking, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootScreenProps } from '@/app/navigation/types';
import { AppText } from '@/components/common/AppText';
import { IconButton } from '@/components/common/IconButton';
import { Touchable } from '@/components/common/Touchable';
import { Screen } from '@/components/layouts/Screen';
import { Seekbar } from '@/components/media/Seekbar';
import { useBroadcaster } from '@/hooks/queries';
import { useLibraryStore } from '@/store/libraryStore';
import { usePlayerStore } from '@/store/playerStore';
import { colors } from '@/theme';
import { formatCount } from '@/utils/format';
import { ownerOf } from '@/utils/podcast';
import { sharePodcast } from '@/utils/share';
import { QueueCarousel } from '../components/QueueCarousel';

/** Position-driven parts live in their own component so ticks don't re-render the carousel. */
const PlayerProgress = () => {
  const position = usePlayerStore((s) => s.position);
  const duration = usePlayerStore((s) => s.duration);
  const seek = usePlayerStore((s) => s.seek);
  return <Seekbar position={position} duration={duration} onSeek={seek} />;
};

const Jump = ({ seconds, onPress }: { seconds: number; onPress: () => void }) => {
  const Icon = seconds < 0 ? RotateCcw : RotateCw;
  return (
    <Touchable haptic scaleTo={0.88} onPress={onPress} className="h-12 w-12 items-center justify-center" accessibilityLabel={seconds < 0 ? 'Back 10 seconds' : 'Forward 10 seconds'}>
      <Icon size={26} color={colors.white} strokeWidth={1.8} />
      <AppText variant="caption" tone="white" className="absolute text-[9px]" style={{ marginTop: 2 }}>
        10
      </AppText>
    </Touchable>
  );
};

const Skip = ({ icon: Icon, label, onPress, disabled }: { icon: LucideIcon; label: string; onPress: () => void; disabled?: boolean }) => (
  <Touchable haptic scaleTo={0.85} onPress={onPress} disabled={disabled} accessibilityLabel={label} className="h-12 w-12 items-center justify-center" style={{ opacity: disabled ? 0.3 : 1 }}>
    <Icon size={28} color={colors.white} fill={colors.white} />
  </Touchable>
);

const BottomAction = ({
  icon: Icon,
  label,
  onPress,
  active,
  activeColor,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  active?: boolean;
  activeColor?: string;
  disabled?: boolean;
}) => {
  const tint = active && activeColor ? activeColor : 'rgba(255,255,255,0.72)';
  return (
    <Touchable onPress={onPress} disabled={disabled} className="min-w-[56px] items-center py-1" accessibilityLabel={label} accessibilityState={active !== undefined ? { selected: active } : undefined} style={{ opacity: disabled ? 0.35 : 1 }}>
      <Icon size={22} color={tint} fill={active && activeColor ? activeColor : 'none'} />
      <AppText variant="caption" tone="secondary" className="mt-1 text-[11px]" numberOfLines={1}>
        {label}
      </AppText>
    </Touchable>
  );
};

/**
 * Player — Flutter `StreamAudioPlayScreen` layout with a swipeable queue:
 * swipe the cover (or use ⏮ ⏭) to move between podcasts; the queue keeps
 * loading more, and the next podcast autoplays when one ends.
 */
export function AudioPlayerScreen({ navigation }: RootScreenProps<'AudioPlayer'>) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const nowPlaying = usePlayerStore((s) => s.nowPlaying);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const queue = usePlayerStore((s) => s.queue);
  const index = usePlayerStore((s) => s.index);
  const hasMore = usePlayerStore((s) => s.hasMore);
  const { toggle, skipBy, next, previous, playAt } = usePlayerStore.getState();

  const podcast = nowPlaying?.kind === 'podcast' ? nowPlaying.podcast : null;
  const owner = podcast ? ownerOf(podcast) : null;
  const ownerInfo = useBroadcaster(owner?._id ?? '');
  const liked = useLibraryStore((s) => (podcast ? Boolean(s.liked[podcast._id]) : false));
  const favorite = useLibraryStore((s) => (podcast ? Boolean(s.bookmarked[podcast._id]) : false));
  const { toggleLike, toggleBookmark } = useLibraryStore.getState();

  useEffect(() => {
    if (!podcast) navigation.goBack();
  }, [navigation, podcast]);

  if (!podcast) return <Screen className="bg-black">{null}</Screen>;

  const donation = ownerInfo.data?.donationUrl;
  const atEnd = index >= queue.length - 1 && !hasMore;
  const itemSize = width - 32;

  return (
    <Screen className="bg-black">
      {/* App bar: title + owner/category; tap opens the owner's profile */}
      <View className="h-14 flex-row items-center px-1.5">
        <IconButton icon={ChevronDown} size={26} onPress={() => navigation.goBack()} accessibilityLabel="Close player" />
        <Touchable onPress={() => owner && navigation.navigate('StationDetail', { id: owner._id })} className="flex-1 px-1" accessibilityLabel={`${podcast.title}. Open ${owner?.name ?? 'profile'}`}>
          <AppText variant="title" numberOfLines={1} className="text-[16px]">
            {podcast.title}
          </AppText>
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {owner?.name ? `${owner.name} · ${podcast.category.name}` : podcast.category.name}
          </AppText>
        </Touchable>
        <IconButton icon={ListPlus} size={22} onPress={() => navigation.navigate('AddToPlaylist', { podcastId: podcast._id })} accessibilityLabel="Add to playlist" />
      </View>

      {/* Cover — full width, one podcast at a time */}
      <View className="flex-1 justify-center">
        <View style={{ height: itemSize }}>
          <QueueCarousel queue={queue} index={index} width={width} itemSize={itemSize} onChange={playAt} />
        </View>
      </View>

      <View className="px-3" style={{ paddingBottom: insets.bottom + 16 }}>
        <View className="px-3">
          <PlayerProgress />
        </View>

        {/* ⏮ · −10 · ▶ · +10 · ⏭ */}
        <View className="mt-3 flex-row items-center justify-evenly">
          <Skip icon={SkipBack} label="Previous" onPress={previous} />
          <Jump seconds={-10} onPress={() => skipBy(-10)} />
          <Touchable
            haptic
            scaleTo={0.9}
            onPress={toggle}
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            className="h-[72px] w-[72px] items-center justify-center rounded-full bg-white/90"
            style={{ shadowColor: '#fff', shadowOpacity: 0.2, shadowRadius: 20, elevation: 6 }}
          >
            {isPlaying ? <Pause size={30} color={colors.black} fill={colors.black} /> : <Play size={30} color={colors.black} fill={colors.black} style={{ marginLeft: 4 }} />}
          </Touchable>
          <Jump seconds={10} onPress={() => skipBy(10)} />
          <Skip icon={SkipForward} label="Next" onPress={next} disabled={atEnd} />
        </View>

        {/* Like · Save · Comments · Share · Support */}
        <View className="mt-6 flex-row justify-between px-2">
          <BottomAction icon={ThumbsUp} label={formatCount(podcast.totalLikes + (liked ? 1 : 0))} active={liked} activeColor={colors.success} onPress={() => toggleLike(podcast._id)} />
          <BottomAction icon={Heart} label={favorite ? 'Saved' : 'Save'} active={favorite} activeColor={colors.live} onPress={() => toggleBookmark(podcast._id)} />
          <BottomAction icon={MessageCircle} label="Comments" onPress={() => navigation.navigate('Comments', { podcastId: podcast._id })} />
          <BottomAction icon={Share2} label="Share" onPress={() => void sharePodcast(podcast)} />
          <BottomAction icon={Gem} label="Support" disabled={!donation} onPress={() => donation && void Linking.openURL(donation)} />
        </View>
      </View>
    </Screen>
  );
}
