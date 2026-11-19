import { History, Play } from 'lucide-react-native';
import { memo } from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { Touchable } from '@/components/common/Touchable';
import { colors } from '@/theme';
import type { StreamRoom } from '@/types/models';
import { formatLength, timeAgo } from '@/utils/format';

/** A finished live session with its recording (`/live-stream/get-previous-live`). */
export const PastBroadcastRow = memo(function PastBroadcastRow({ room, onPress }: { room: StreamRoom; onPress: (r: StreamRoom) => void }) {
  const rec = room.recordings[0];
  return (
    <Touchable onPress={() => onPress(room)} scaleTo={0.985} className="flex-row items-center rounded-lg border border-line bg-ink-800 p-3.5" accessibilityLabel={`Replay ${room.name}`}>
      <View className="h-12 w-12 items-center justify-center rounded-md bg-ink-700">
        <History size={20} color={colors.brand[400]} />
      </View>
      <View className="ml-3.5 flex-1">
        <AppText variant="title" numberOfLines={1}>
          {room.name}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1} className="mt-1">
          {room.startTime ? timeAgo(room.startTime) : 'Recorded'}
          {rec?.duration ? ` · ${formatLength(rec.duration)}` : ''}
        </AppText>
      </View>
      <View className="h-9 w-9 items-center justify-center rounded-full border border-line-strong">
        <Play size={14} color={colors.text.primary} fill={colors.text.primary} style={{ marginLeft: 2 }} />
      </View>
    </Touchable>
  );
});
