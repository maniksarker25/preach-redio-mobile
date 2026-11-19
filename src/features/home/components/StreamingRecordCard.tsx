import { History } from 'lucide-react-native';
import { memo } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { Touchable } from '@/components/common/Touchable';
import { Artwork, Scrim } from '@/components/media/Artwork';
import { colors } from '@/theme';
import type { StreamRoom } from '@/types/models';
import { formatLength, timeAgo } from '@/utils/format';

/** Flutter `ModernStreamingCard` (isLive: false) — a recorded live session. */
export const StreamingRecordCard = memo(function StreamingRecordCard({ room, cover, onPress }: { room: StreamRoom; cover?: string; onPress: (r: StreamRoom) => void }) {
  const { width: screen } = useWindowDimensions();
  const w = screen / 2 - 30;
  const rec = room.recordings[0];
  return (
    <Touchable onPress={() => onPress(room)} style={{ width: w }} className="overflow-hidden rounded-sm border border-line bg-ink-800" accessibilityLabel={`Recording: ${room.name}`}>
      <Artwork uri={cover} width={w} height={w * 0.62} radius={0}>
        <Scrim strength={0.3} from={0.6} />
        <View className="absolute left-2 top-2 flex-row items-center gap-1 rounded-full bg-black/60 px-2 py-0.5">
          <History size={10} color={colors.white} />
          <AppText variant="caption" tone="white" className="text-[10px]">
            Recorded
          </AppText>
        </View>
      </Artwork>
      <View className="p-2.5">
        <AppText variant="title" numberOfLines={2} className="text-[15px]">
          {room.name}
        </AppText>
        <AppText variant="caption" tone="muted" className="mt-1">
          {[room.startTime ? timeAgo(room.startTime) : null, rec?.duration ? formatLength(rec.duration) : null].filter(Boolean).join(' · ')}
        </AppText>
      </View>
    </Touchable>
  );
});
