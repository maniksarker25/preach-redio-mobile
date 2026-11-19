import { useNavigation } from '@react-navigation/native';
import { Pause, Play, X } from 'lucide-react-native';
import { memo } from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { LiveBadge } from '@/components/common/LiveBadge';
import { Touchable } from '@/components/common/Touchable';
import { usePlayerStore } from '@/store/playerStore';
import { colors } from '@/theme';
import { Artwork } from './Artwork';
import { ProgressLine } from './Seekbar';

/** Progress is its own component so position ticks don't re-render the whole bar. */
const MiniProgress = () => {
  const ratio = usePlayerStore((s) => (s.duration > 0 ? s.position / s.duration : 0));
  return <ProgressLine ratio={ratio} height={2} color={colors.live} />;
};

/** Now-playing card docked above the bottom navigation (Flutter `BottomNavPlayCard`). */
export const MiniPlayer = memo(function MiniPlayer() {
  const navigation = useNavigation();
  const nowPlaying = usePlayerStore((s) => s.nowPlaying);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const toggle = usePlayerStore((s) => s.toggle);
  const stop = usePlayerStore((s) => s.stop);

  if (!nowPlaying) return null;

  const live = nowPlaying.kind === 'live';
  const title = live ? (nowPlaying.broadcaster.live?.name ?? nowPlaying.broadcaster.name) : nowPlaying.podcast.title;
  const subtitle = live ? nowPlaying.broadcaster.name : nowPlaying.podcast.category.name;
  const art = live ? nowPlaying.broadcaster.avatar : nowPlaying.podcast.coverImage;

  return (
    <View className="px-2 pb-2 pt-1">
      <Touchable
        scaleTo={0.99}
        onPress={() => navigation.navigate(live ? 'RadioPlayer' : 'AudioPlayer')}
        accessibilityLabel={`Now playing: ${title}. Open player`}
        className="overflow-hidden rounded-sm bg-ink-800"
      >
        <View className="flex-row items-center gap-3 p-2">
          <Artwork uri={art} width={44} height={44} radius={6} />
          <View className="flex-1">
            <AppText variant="title" numberOfLines={1}>
              {title}
            </AppText>
            <View className="mt-0.5 flex-row items-center gap-2">
              {live ? <LiveBadge size="sm" /> : null}
              <AppText variant="caption" tone="muted" numberOfLines={1} className="flex-1">
                {subtitle}
              </AppText>
            </View>
          </View>
          <Touchable haptic scaleTo={0.85} onPress={toggle} accessibilityLabel={isPlaying ? 'Pause' : 'Play'} className="h-10 w-10 items-center justify-center rounded-full bg-white">
            {isPlaying ? <Pause size={18} color={colors.black} fill={colors.black} /> : <Play size={18} color={colors.black} fill={colors.black} style={{ marginLeft: 2 }} />}
          </Touchable>
          <Touchable onPress={stop} accessibilityLabel="Close player" className="h-10 w-8 items-center justify-center">
            <X size={18} color={colors.text.muted} />
          </Touchable>
        </View>
        {live ? null : <MiniProgress />}
      </Touchable>
    </View>
  );
});
