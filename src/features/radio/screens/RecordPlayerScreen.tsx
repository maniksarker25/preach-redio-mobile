import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootScreenProps } from '@/app/navigation/types';
import { Avatar } from '@/components/common/Avatar';
import { AppText } from '@/components/common/AppText';
import { EmptyState } from '@/components/common/States';
import { Touchable } from '@/components/common/Touchable';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { VideoStage } from '@/components/media/VideoStage';
import { useBroadcaster, usePreviousLives } from '@/hooks/queries';
import { useLocalPlayback } from '@/hooks/useLocalPlayback';
import { GUTTER } from '@/theme';
import { formatLength, timeAgo } from '@/utils/format';
import { History } from 'lucide-react-native';

/** Plays a recorded live session (Flutter `RecordPlayScreen`, opened from "Streaming Record"). */
export function RecordPlayerScreen({ route, navigation }: RootScreenProps<'RecordPlayer'>) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const rooms = usePreviousLives();
  const room = rooms.data?.find((r) => r._id === route.params.roomId);
  const ownerId = room?.station ?? room?.creator ?? '';
  const owner = useBroadcaster(ownerId);
  const recording = room?.recordings[0];
  const duration = recording?.duration ?? 0;
  const playback = useLocalPlayback(duration, { url: recording?.url, autoPlay: Boolean(recording) });
  const [expanded, setExpanded] = useState(false);

  if (rooms.isSuccess && !recording) {
    return (
      <Screen className="bg-black">
        <ScreenHeader back="down" />
        <EmptyState icon={History} title="Recording unavailable" message="This broadcast doesn’t have a recording yet." />
      </Screen>
    );
  }

  return (
    <Screen className="bg-black">
      <ScreenHeader back="down" title={room?.name} subtitle="Streaming record" />
      <VideoStage
        poster={owner.data?.cover}
        width={width}
        height={expanded ? height - insets.top - insets.bottom - 56 : (width * 9) / 16}
        playing={playback.playing}
        position={playback.position}
        duration={duration}
        onToggle={playback.toggle}
        onSeek={playback.seek}
        onSkip={playback.skipBy}
        expanded={expanded}
        onToggleExpanded={() => setExpanded((e) => !e)}
      />
      {expanded || !room ? null : (
        <View style={{ padding: GUTTER }}>
          <AppText variant="h2">{room.name}</AppText>
          <AppText variant="caption" tone="muted" className="mt-1">
            {[room.startTime ? timeAgo(room.startTime) : null, duration ? formatLength(duration) : null].filter(Boolean).join(' · ')}
          </AppText>
          {room.description ? (
            <AppText variant="bodySm" tone="secondary" className="mt-3">
              {room.description}
            </AppText>
          ) : null}
          {owner.data ? (
            <Touchable onPress={() => owner.data && navigation.navigate('StationDetail', { id: owner.data.id })} className="mt-5 flex-row items-center rounded-sm bg-ink-800 p-3" accessibilityLabel={`Open ${owner.data.name}`}>
              <Avatar uri={owner.data.avatar} name={owner.data.name} size={40} />
              <AppText variant="title" className="ml-3 flex-1">
                {owner.data.name}
              </AppText>
            </Touchable>
          ) : null}
        </View>
      )}
    </Screen>
  );
}
