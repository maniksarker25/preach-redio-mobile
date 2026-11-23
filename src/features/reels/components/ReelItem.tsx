import { useNavigation } from '@react-navigation/native';
import { useEvent } from 'expo';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video';
import { Bookmark, Heart, MessageCircle, Play, RotateCw, Share2 } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Avatar } from '@/components/common/Avatar';
import { AppText } from '@/components/common/AppText';
import { Touchable } from '@/components/common/Touchable';
import { Artwork, Scrim } from '@/components/media/Artwork';
import { ProgressLine } from '@/components/media/Seekbar';
import { useGetClipQuery, useRecordClipViewMutation, useToggleClipBookmarkMutation, useToggleClipLikeMutation } from '@/store/api/reelsApi';
import { colors } from '@/theme';
import type { Podcast } from '@/types/models';
import { formatCount } from '@/utils/format';
import { isVideo, ownerName, ownerOf, playbackUrl } from '@/utils/podcast';
import { sharePodcast } from '@/utils/share';
import { fillsScreen, fitRect, useVideoAspect } from '../videoLayout';
import { ReelScrubber } from './ReelScrubber';

/** A view is counted once the clip has been on screen this long. */
const VIEW_AFTER_MS = 2000;
const FILL = { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 } as const;

const Action = ({ icon: Icon, label, onPress, active, activeColor = colors.live, disabled, a11y }: { icon: LucideIcon; label?: string; onPress: () => void; active?: boolean; activeColor?: string; disabled?: boolean; a11y: string }) => (
  <Touchable haptic scaleTo={0.85} onPress={onPress} disabled={disabled} className="items-center" accessibilityLabel={a11y} accessibilityState={{ selected: !!active, disabled }}>
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
  /** The visible clip while the screen is focused and the app is in the foreground. */
  active: boolean;
  bottomInset: number;
  /** Lets the feed stop vertical paging while the progress bar is being dragged. */
  onScrubbingChange?: (scrubbing: boolean) => void;
}

/**
 * One full-screen clip on a real video player.
 * Neighbouring items are mounted by the list, so their players buffer ahead and a swipe starts instantly.
 * Tap to pause, double-tap to like, drag the bottom bar to seek, actions on the right.
 */
export const ReelItem = memo(function ReelItem({ clip, height, active, bottomInset, onScrubbingChange }: ReelItemProps) {
  const navigation = useNavigation();

  /* ------------------------------------------------------------ player */
  const uri = playbackUrl(clip);
  const source = useMemo<VideoSource>(() => {
    if (!uri) return null;
    // HLS can't be cached on iOS; progressive files are cached so replays don't re-download.
    return clip.hlsUrl ? { uri, contentType: 'hls' } : { uri, useCaching: true };
  }, [uri, clip.hlsUrl]);

  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.timeUpdateEventInterval = 0;
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const [firstFrame, setFirstFrame] = useState(false);
  const { width: pageWidth } = useWindowDimensions();
  const [userPaused, setUserPaused] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const handleScrubbing = useCallback(
    (on: boolean) => {
      setScrubbing(on);
      onScrubbingChange?.(on);
    },
    [onScrubbingChange],
  );

  // Only the visible clip plays; leaving it pauses and rewinds it.
  useEffect(() => {
    if (active && !userPaused) player.play();
    else player.pause();
  }, [active, userPaused, player]);

  // Leaving a clip clears its manual pause, so it plays when swiped back to.
  // (Adjusting state during render is React's pattern for "reset on prop change".)
  if (!active && userPaused) setUserPaused(false);
  if (!active && scrubbing) setScrubbing(false);

  useEffect(() => {
    // expo-video players are configured by assigning properties (documented API).
    // eslint-disable-next-line react-hooks/immutability
    player.timeUpdateEventInterval = active ? 0.25 : 0;
    if (!active) player.currentTime = 0;
  }, [active, player]);

  const retry = () => {
    setFirstFrame(false);
    void player.replaceAsync(source).then(() => player.play());
  };

  /* -------------------------------------------------------- engagement */
  // Like / bookmark state comes from get-single, fetched once the clip is first shown.
  const [seen, setSeen] = useState(active);
  if (active && !seen) setSeen(true);
  const detail = useGetClipQuery(clip._id, { skip: !seen }).data;
  const [toggleLike] = useToggleClipLikeMutation();
  const [toggleBookmark] = useToggleClipBookmarkMutation();
  const [recordView] = useRecordClipViewMutation();

  const liked = Boolean(detail?.isLike);
  const bookmarked = Boolean(detail?.isBookmark);
  const likes = detail?.totalLikes ?? clip.totalLikes;
  const comments = detail?.totalComments ?? clip.totalComments ?? 0;
  const ready = Boolean(detail);

  // Count one view per mount once the clip has actually been watched for a moment.
  const viewed = useRef(false);
  useEffect(() => {
    if (!active || viewed.current) return;
    const t = setTimeout(() => {
      viewed.current = true;
      void recordView(clip._id);
    }, VIEW_AFTER_MS);
    return () => clearTimeout(t);
  }, [active, clip._id, recordView]);

  const heart = useSharedValue(0);
  const heartStyle = useAnimatedStyle(() => ({ opacity: heart.value, transform: [{ scale: 0.6 + heart.value * 0.6 }] }));

  const doubleTapLike = () => {
    if (ready && !liked) void toggleLike(clip._id);
    heart.set(withSequence(withSpring(1, { damping: 9 }), withTiming(0, { duration: 500 })));
  };

  const doubleTap = Gesture.Tap().numberOfTaps(2).runOnJS(true).onEnd(doubleTapLike);
  const singleTap = Gesture.Tap().runOnJS(true).requireExternalGestureToFail(doubleTap).onEnd(() => setUserPaused((p) => !p));

  /* ------------------------------------------------------------ render */
  const owner = ownerOf(detail ?? clip);
  const name = ownerName(detail ?? clip);
  const src = (detail ?? clip).sourcePodcast;
  const sourceId = typeof src === 'string' ? src : src?._id;
  const video = isVideo(clip);
  const failed = status === 'error' || !uri;

  // TikTok / Instagram layout: a clip close to the screen's shape fills it (slight crop);
  // anything wider or squarer is shown whole, centred, on a blurred copy of its cover.
  const aspect = useVideoAspect(clip._id, detail ?? clip, player, status, video);
  const measuring = video && aspect === undefined;
  const fill = !video || fillsScreen(aspect, pageWidth, height);
  const frame = fill ? FILL : fitRect(aspect as number, pageWidth, height);
  const showVideo = video && firstFrame && !measuring;
  const buffering = active && !userPaused && !failed && (status === 'loading' || (video && !showVideo));

  return (
    <View style={{ height }} className="bg-black">
      <GestureDetector gesture={Gesture.Exclusive(doubleTap, singleTap)}>
        <View className="flex-1" accessible accessibilityLabel={`${clip.title}. Double tap to like, tap to pause`}>
          {/* Letterboxed videos sit on a blurred, dimmed copy of their cover instead of black bars. */}
          {!fill && clip.coverImage ? (
            <View style={FILL} pointerEvents="none">
              <Image source={{ uri: clip.coverImage }} style={FILL} contentFit="cover" blurRadius={40} cachePolicy="memory-disk" transition={200} />
              <View style={FILL} className="bg-black/45" />
            </View>
          ) : null}
          {video ? (
            <VideoView
              player={player}
              style={frame}
              contentFit={fill ? 'cover' : 'contain'}
              nativeControls={false}
              allowsPictureInPicture={false}
              surfaceType="textureView"
              onFirstFrameRender={() => setFirstFrame(true)}
            />
          ) : null}
          {/* Cover on top until the video is ready in its final layout (always for audio clips), so nothing jumps. */}
          {!showVideo ? <Artwork uri={clip.coverImage} radius={0} style={measuring ? FILL : frame} /> : null}
          <Scrim strength={0.9} from={0.45} />

          {buffering ? (
            <View style={[FILL, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
              <ActivityIndicator color={colors.white} size="large" />
            </View>
          ) : null}
          {userPaused && !failed ? (
            <Animated.View entering={FadeIn} exiting={FadeOut} style={[FILL, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
              <View className="h-20 w-20 items-center justify-center rounded-full bg-black/40">
                <Play size={36} color={colors.white} fill={colors.white} style={{ marginLeft: 4 }} />
              </View>
            </Animated.View>
          ) : null}
          <Animated.View pointerEvents="none" style={[FILL, { alignItems: 'center', justifyContent: 'center' }, heartStyle]}>
            <Heart size={110} color={colors.live} fill={colors.live} />
          </Animated.View>
        </View>
      </GestureDetector>

      {failed ? (
        <View style={[FILL, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="box-none">
          <AppText variant="title" tone="white">
            Couldn’t play this clip
          </AppText>
          {uri ? (
            <Touchable haptic onPress={retry} className="mt-3 flex-row items-center gap-2 rounded-full bg-white px-4 py-2" accessibilityLabel="Try again">
              <RotateCw size={15} color={colors.black} />
              <AppText variant="label" style={{ color: colors.black }}>
                Try again
              </AppText>
            </Touchable>
          ) : null}
        </View>
      ) : null}

      {/* Like TikTok: while seeking only the picture, the bar and the time are on screen. */}
      <View className="absolute right-3 items-center gap-5" style={{ bottom: bottomInset + 36, opacity: scrubbing ? 0 : 1 }} pointerEvents={scrubbing ? 'none' : 'box-none'}>
        <Touchable onPress={() => owner && navigation.navigate('StationDetail', { id: owner._id })} accessibilityLabel={`Open ${name}`}>
          <Avatar uri={owner?.profile_image} name={name} size={46} ring />
        </Touchable>
        <Action icon={Heart} label={formatCount(likes)} active={liked} disabled={!ready} onPress={() => void toggleLike(clip._id)} a11y={liked ? 'Unlike' : 'Like'} />
        <Action icon={MessageCircle} label={comments ? formatCount(comments) : 'Comment'} onPress={() => navigation.navigate('ClipComments', { podcastId: clip._id })} a11y="Comments" />
        <Action icon={Bookmark} active={bookmarked} activeColor={colors.white} disabled={!ready} onPress={() => void toggleBookmark(clip._id)} a11y={bookmarked ? 'Remove bookmark' : 'Bookmark'} />
        <Action icon={Share2} onPress={() => void sharePodcast(detail ?? clip)} a11y="Share" />
      </View>

      <View className="absolute left-4 right-20" style={{ bottom: bottomInset + 28, opacity: scrubbing ? 0 : 1 }} pointerEvents={scrubbing ? 'none' : 'box-none'}>
        <AppText variant="title" tone="white" className="self-start">
          {name}
        </AppText>
        <Touchable onPress={() => setExpanded((e) => !e)} scaleTo={1} accessibilityLabel="Toggle caption">
          <AppText variant="h3" tone="white" className="mt-1.5" numberOfLines={expanded ? undefined : 2}>
            {clip.title}
          </AppText>
          {expanded && clip.description ? (
            <AppText variant="bodySm" tone="secondary" className="mt-1">
              {clip.description}
            </AppText>
          ) : null}
        </Touchable>
        {sourceId ? (
          <Touchable
            haptic
            onPress={() => navigation.navigate('PodcastDetail', { id: sourceId })}
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

      {active && !failed ? (
        <ReelScrubber player={player} bottomInset={bottomInset} onScrubbingChange={handleScrubbing} />
      ) : (
        <View className="absolute left-0 right-0" style={{ bottom: bottomInset }} pointerEvents="none">
          <ProgressLine ratio={0} height={2.5} color={colors.white} />
        </View>
      )}
    </View>
  );
});
