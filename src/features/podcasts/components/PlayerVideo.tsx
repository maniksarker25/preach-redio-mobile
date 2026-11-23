import { useEvent } from 'expo';
import { VideoView } from 'expo-video';
import { AlertCircle, Headphones, Maximize2, RotateCcw, Video } from 'lucide-react-native';
import { memo, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { Touchable } from '@/components/common/Touchable';
import { Artwork } from '@/components/media/Artwork';
import { useVideoAspect } from '@/features/reels/videoLayout';
import { podcastVideoPlayer, usePlayerStore } from '@/store/playerStore';
import { colors, shadow } from '@/theme';
import type { Podcast } from '@/types/models';

const DEFAULT_ASPECT = 16 / 9;

/** The largest `aspect` box that fits `maxWidth × maxHeight`. */
const fitBox = (aspect: number, maxWidth: number, maxHeight: number) => {
  const width = Math.min(maxWidth, maxHeight * aspect);
  return { width: Math.round(width), height: Math.round(width / aspect) };
};

/**
 * The picture of the current video episode, on the app's shared video player (controls stay the
 * player screen's own). Shows the cover with a spinner while loading and a retry on error.
 *
 * The box takes the video's own shape (API `videoWidth`/`videoHeight`, else measured like Preach Clips;
 * 16:9 until known), as large as fits `maxWidth × maxHeight`: landscape fills the width, portrait is
 * capped by the height so the controls below keep their room. Never cropped: the box already has the video's shape.
 */
export const PlayerVideo = memo(function PlayerVideo({ podcast, maxWidth, maxHeight }: { podcast: Podcast; maxWidth: number; maxHeight: number }) {
  const ref = useRef<VideoView>(null);
  const retry = usePlayerStore((s) => s.retry);
  const { status } = useEvent(podcastVideoPlayer, 'statusChange', { status: podcastVideoPlayer.status });
  const aspect = useVideoAspect(podcast._id, podcast, podcastVideoPlayer, status, true);
  const { width, height } = fitBox(aspect || DEFAULT_ASPECT, maxWidth, maxHeight);
  const ready = status === 'readyToPlay';

  return (
    <View style={[{ width, height, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.black }, shadow.floating]}>
      <VideoView
        ref={ref}
        player={podcastVideoPlayer}
        style={{ width: '100%', height: '100%' }}
        contentFit="contain"
        nativeControls={false}
        fullscreenOptions={{ enable: true }}
        allowsPictureInPicture={false}
      />
      {!ready ? (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
          <Artwork uri={podcast.coverImage} width={width} height={height} radius={0} fit="contain">
            <View className="absolute inset-0 items-center justify-center bg-black/45">
              {status === 'error' ? (
                <Touchable onPress={retry} className="items-center" accessibilityLabel="Playback failed. Retry">
                  <AlertCircle size={34} color={colors.live} />
                  <AppText variant="label" tone="white" className="mt-2">
                    Playback failed
                  </AppText>
                  <View className="mt-3 flex-row items-center gap-1.5 rounded-full bg-white px-4 py-2">
                    <RotateCcw size={14} color={colors.black} />
                    <AppText variant="label" className="text-black">
                      Retry
                    </AppText>
                  </View>
                </Touchable>
              ) : (
                <ActivityIndicator color={colors.white} size="large" accessibilityLabel="Loading video" />
              )}
            </View>
          </Artwork>
        </View>
      ) : (
        <Touchable
          onPress={() => void ref.current?.enterFullscreen()}
          className="absolute bottom-2.5 right-2.5 h-9 w-9 items-center justify-center rounded-full bg-black/55"
          accessibilityLabel="Full screen"
        >
          <Maximize2 size={16} color={colors.white} />
        </Touchable>
      )}
    </View>
  );
});

const ModeOption = ({ label, icon: Icon, active, onPress }: { label: string; icon: typeof Video; active: boolean; onPress: () => void }) => (
  <Touchable
    haptic
    onPress={() => !active && onPress()}
    accessibilityRole="button"
    accessibilityLabel={`${label} mode`}
    accessibilityState={{ selected: active }}
    className={`flex-row items-center gap-1.5 rounded-full px-4 py-1.5 ${active ? 'bg-white' : ''}`}
  >
    <Icon size={15} color={active ? colors.black : 'rgba(255,255,255,0.75)'} />
    <AppText variant="label" className={`text-[13px] ${active ? 'text-black' : 'text-white/75'}`}>
      {label}
    </AppText>
  </Touchable>
);

/** Video | Audio switch for video episodes (Flutter's player has a video button; here it is a two-way switch). */
export const MediaModeToggle = memo(function MediaModeToggle({ audioOnly, onChange }: { audioOnly: boolean; onChange: (audioOnly: boolean) => void }) {
  return (
    <View className="flex-row self-center rounded-full border border-white/10 bg-white/10 p-1" accessibilityRole="tablist">
      <ModeOption label="Video" icon={Video} active={!audioOnly} onPress={() => onChange(false)} />
      <ModeOption label="Audio" icon={Headphones} active={audioOnly} onPress={() => onChange(true)} />
    </View>
  );
});
