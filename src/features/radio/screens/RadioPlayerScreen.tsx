import { HandHeart, Radio, Share2, Square } from 'lucide-react-native';
import { useEffect } from 'react';
import { Linking, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootScreenProps } from '@/app/navigation/types';
import { Avatar } from '@/components/common/Avatar';
import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { IconButton } from '@/components/common/IconButton';
import { LiveBadge } from '@/components/common/LiveBadge';
import { Touchable } from '@/components/common/Touchable';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { Artwork } from '@/components/media/Artwork';
import { BlurredBackdrop } from '@/components/media/BlurredBackdrop';
import { Equalizer } from '@/components/media/Equalizer';
import { PlayButton } from '@/components/media/PlayButton';
import { usePlayerStore } from '@/store/playerStore';
import { colors, GUTTER, shadow } from '@/theme';
import { formatClock } from '@/utils/format';
import { shareText } from '@/utils/share';

/** One expanding ring of the "broadcast" pulse behind the station art. */
const Ring = ({ progress, size }: { progress: SharedValue<number>; size: number }) => {
  const style = useAnimatedStyle(() => ({ opacity: 0.55 * (1 - progress.value), transform: [{ scale: 1 + progress.value * 0.45 }] }));
  return <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: colors.brand[500] }, style]} />;
};

const LiveClock = () => {
  const position = usePlayerStore((s) => s.position);
  return (
    <AppText variant="label" tone="secondary" style={{ fontVariant: ['tabular-nums'] }}>
      On air for {formatClock(position)}
    </AppText>
  );
};

/** Live radio player: big station art with broadcast rings, live status and a single prominent control. */
export function RadioPlayerScreen({ navigation }: RootScreenProps<'RadioPlayer'>) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const nowPlaying = usePlayerStore((s) => s.nowPlaying);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const toggle = usePlayerStore((s) => s.toggle);
  const stop = usePlayerStore((s) => s.stop);
  const b = nowPlaying?.kind === 'live' ? nowPlaying.broadcaster : null;

  const r1 = useSharedValue(0);
  const r2 = useSharedValue(0);
  const r3 = useSharedValue(0);
  useEffect(() => {
    const rings = [r1, r2, r3];
    rings.forEach((r, i) => {
      r.value = isPlaying ? withDelay(i * 700, withRepeat(withTiming(1, { duration: 2100, easing: Easing.out(Easing.quad) }), -1, false)) : withTiming(0);
    });
  }, [isPlaying, r1, r2, r3]);

  useEffect(() => {
    if (!b) navigation.goBack();
  }, [b, navigation]);

  if (!b) return <Screen>{null}</Screen>;

  const art = Math.min(width * 0.62, 280);

  return (
    <Screen>
      <BlurredBackdrop uri={b.cover ?? b.avatar} tint={colors.brand[800]} />
      <ScreenHeader
        back="down"
        title="Live radio"
        subtitle={b.kind === 'station' ? 'Official station' : 'Live broadcast'}
        right={<IconButton icon={Share2} onPress={() => void shareText(`I’m listening to ${b.name} live on Preach Radio\nhttps://preachradio.com`)} accessibilityLabel="Share" />}
      />

      <View className="flex-1 justify-between" style={{ paddingHorizontal: GUTTER + 4, paddingBottom: insets.bottom + 24 }}>
        <View className="items-center pt-6">
          <View className="items-center justify-center" style={{ width: art * 1.5, height: art * 1.5 }}>
            <Ring progress={r1} size={art} />
            <Ring progress={r2} size={art} />
            <Ring progress={r3} size={art} />
            <View style={[shadow.glow, { borderRadius: art / 2 }]}>
              <Artwork uri={b.live?.coverImage ?? b.avatar} width={art} height={art} radius={art / 2} priority="high" />
            </View>
            <View className="absolute" style={{ bottom: art * 0.18 }}>
              <LiveBadge />
            </View>
          </View>
        </View>

        <View>
          <View className="items-center">
            <AppText variant="h1" className="text-center" numberOfLines={2}>
              {b.live?.name ?? b.name}
            </AppText>
            <Touchable onPress={() => navigation.navigate('StationDetail', { id: b.id })} className="mt-3 flex-row items-center gap-2" accessibilityLabel={`Open ${b.name}`}>
              <Avatar uri={b.avatar} name={b.name} size={26} />
              <AppText variant="title" tone="brand">
                {b.name}
              </AppText>
              {b.kind === 'station' ? <Radio size={14} color={colors.brand[400]} /> : null}
            </Touchable>
            {b.live?.description ? (
              <AppText variant="bodySm" tone="muted" className="mt-3 text-center" numberOfLines={3}>
                {b.live.description}
              </AppText>
            ) : null}
          </View>

          <View className="mt-8 flex-row items-center justify-center gap-3">
            <Equalizer playing={isPlaying} height={18} barWidth={3} bars={5} color={colors.brand[400]} />
            <LiveClock />
          </View>

          <View className="mt-8 flex-row items-center justify-center gap-10">
            <IconButton icon={Square} variant="surface" fill size={18} onPress={stop} accessibilityLabel="Stop listening" />
            <PlayButton tone="light" playing={isPlaying} onPress={toggle} size={88} label={isPlaying ? 'Pause live radio' : 'Resume live radio'} />
            <IconButton icon={Radio} variant="surface" size={20} onPress={() => navigation.navigate('Stations')} accessibilityLabel="Browse stations" />
          </View>

          {b.donationUrl ? (
            <Button label={`Support ${b.kind === 'station' ? 'the station' : b.name.split(' ')[0]}`} icon={HandHeart} variant="outline" onPress={() => void Linking.openURL(b.donationUrl!)} className="mt-8" fullWidth />
          ) : null}
        </View>
      </View>
    </Screen>
  );
}
