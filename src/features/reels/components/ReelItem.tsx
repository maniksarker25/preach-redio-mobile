import { useNavigation } from '@react-navigation/native';
import { Bookmark, Heart, MessageCircle, Play, Share2 } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { memo, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Avatar } from '@/components/common/Avatar';
import { AppText } from '@/components/common/AppText';
import { Touchable } from '@/components/common/Touchable';
import { Artwork, Scrim } from '@/components/media/Artwork';
import { ProgressLine } from '@/components/media/Seekbar';
import { useLocalPlayback } from '@/hooks/useLocalPlayback';
import { useLibraryStore } from '@/store/libraryStore';
import { colors } from '@/theme';
import type { Podcast } from '@/types/models';
import { formatCount, podcastSeconds } from '@/utils/format';
import { ownerOf, ownerName, playbackUrl } from '@/utils/podcast';
import { sharePodcast } from '@/utils/share';

const Action = ({ icon: Icon, label, onPress, active, activeColor = colors.live, a11y }: { icon: LucideIcon; label?: string; onPress: () => void; active?: boolean; activeColor?: string; a11y: string }) => (
  <Touchable haptic scaleTo={0.85} onPress={onPress} className="items-center" accessibilityLabel={a11y} accessibilityState={{ selected: !!active }}>
    <View className="h-12 w-12 items-center justify-center rounded-full bg-black/30">
      <Icon size={27} color={active ? activeColor : colors.white} fill={active ? activeColor : 'none'} strokeWidth={1.9} />
    </View>
    {label ? (
      <AppText variant="caption" tone="white" className="mt-1 text-[11px]">
        {label}
      </AppText>
    ) : null}
  </Touchable>
);

interface ReelItemProps {
  clip: Podcast;
  height: number;
  active: boolean;
  bottomInset: number;
}

/** One full-screen clip: tap to pause, double-tap to like, actions on the right. */
export const ReelItem = memo(function ReelItem({ clip, height, active, bottomInset }: ReelItemProps) {
  const navigation = useNavigation();
  const liked = useLibraryStore((s) => Boolean(s.liked[clip._id]));
  const bookmarked = useLibraryStore((s) => Boolean(s.bookmarked[clip._id]));
  const { toggleLike, toggleBookmark } = useLibraryStore.getState();
  const owner = ownerOf(clip);
  const duration = podcastSeconds(clip);
  const playback = useLocalPlayback(duration, { autoPlay: false, loop: true, url: playbackUrl(clip) });
  const [userPaused, setUserPaused] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Only the visible clip plays; scrolling away pauses and rewinds it.
  const { play, pause, seek } = playback;
  useEffect(() => {
    if (active && !userPaused) play();
    else pause();
    if (!active) {
      seek(0);
      setUserPaused(false);
    }
  }, [active, userPaused, play, pause, seek]);

  const heart = useSharedValue(0);
  const heartStyle = useAnimatedStyle(() => ({ opacity: heart.value, transform: [{ scale: 0.6 + heart.value * 0.6 }] }));

  const like = () => {
    if (!liked) toggleLike(clip._id);
    heart.value = withSequence(withSpring(1, { damping: 9 }), withTiming(0, { duration: 500 }));
  };

  const doubleTap = Gesture.Tap().numberOfTaps(2).runOnJS(true).onEnd(like);
  const singleTap = Gesture.Tap().runOnJS(true).requireExternalGestureToFail(doubleTap).onEnd(() => setUserPaused((p) => !p));

  const source = typeof clip.sourcePodcast === 'string' ? clip.sourcePodcast : clip.sourcePodcast?._id;

  return (
    <View style={{ height }} className="bg-black">
      <GestureDetector gesture={Gesture.Exclusive(doubleTap, singleTap)}>
        <View className="flex-1" accessible accessibilityLabel={`${clip.title}. Double tap to like, tap to pause`}>
          <Artwork uri={clip.coverImage} radius={0} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
          <Scrim strength={0.9} from={0.45} />
          {userPaused ? (
            <Animated.View entering={FadeIn} exiting={FadeOut} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
              <View className="h-20 w-20 items-center justify-center rounded-full bg-black/40">
                <Play size={36} color={colors.white} fill={colors.white} style={{ marginLeft: 4 }} />
              </View>
            </Animated.View>
          ) : null}
          <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }, heartStyle]}>
            <Heart size={110} color={colors.live} fill={colors.live} />
          </Animated.View>
        </View>
      </GestureDetector>

      <View className="absolute right-3 items-center gap-5" style={{ bottom: bottomInset + 36 }}>
        <Touchable onPress={() => owner && navigation.navigate('StationDetail', { id: owner._id })} accessibilityLabel={`Open ${ownerName(clip)}`}>
          <Avatar uri={owner?.profile_image} name={ownerName(clip)} size={46} ring />
        </Touchable>
        <Action icon={Heart} label={formatCount(clip.totalLikes + (liked ? 1 : 0))} active={liked} onPress={() => toggleLike(clip._id)} a11y={liked ? 'Unlike' : 'Like'} />
        <Action icon={MessageCircle} label="Comments" onPress={() => navigation.navigate('Comments', { podcastId: clip._id })} a11y="Comments" />
        <Action icon={Bookmark} active={bookmarked} activeColor={colors.white} onPress={() => toggleBookmark(clip._id)} a11y={bookmarked ? 'Remove bookmark' : 'Bookmark'} />
        <Action icon={Share2} onPress={() => void sharePodcast(clip)} a11y="Share" />
      </View>

      <View className="absolute left-4 right-20" style={{ bottom: bottomInset + 28 }} pointerEvents="box-none">
        <Touchable onPress={() => owner && navigation.navigate('StationDetail', { id: owner._id })} className="self-start">
          <AppText variant="title" tone="white">
            {ownerName(clip)}
          </AppText>
        </Touchable>
        <Touchable onPress={() => setExpanded((e) => !e)} scaleTo={1} accessibilityLabel="Toggle caption">
          <AppText variant="h3" tone="white" className="mt-1.5" numberOfLines={expanded ? undefined : 2}>
            {clip.title}
          </AppText>
          {expanded ? (
            <AppText variant="bodySm" tone="secondary" className="mt-1">
              {clip.description}
            </AppText>
          ) : null}
        </Touchable>
        {source ? (
          <Touchable
            haptic
            onPress={() => navigation.navigate('PodcastDetail', { id: source })}
            className="mt-3.5 flex-row items-center gap-2 self-start rounded-full border border-white/20 bg-white/15 px-3.5 py-2"
            accessibilityLabel="Watch the full message"
          >
            <Play size={13} color={colors.white} fill={colors.white} />
            <AppText variant="label" tone="white">
              Watch full message
            </AppText>
          </Touchable>
        ) : null}
      </View>

      <View className="absolute left-0 right-0" style={{ bottom: bottomInset }}>
        <ProgressLine ratio={duration ? playback.position / duration : 0} height={2.5} color={colors.white} />
      </View>
    </View>
  );
});
