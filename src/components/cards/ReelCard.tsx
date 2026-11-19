import { Play } from 'lucide-react-native';
import { memo } from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { Touchable } from '@/components/common/Touchable';
import { Artwork, Scrim } from '@/components/media/Artwork';
import { colors } from '@/theme';
import type { Podcast } from '@/types/models';
import { formatCount } from '@/utils/format';
import { ownerName } from '@/utils/podcast';

interface ReelCardProps {
  podcast: Podcast;
  onPress: (p: Podcast) => void;
  width?: number;
}

/** 9:16 portrait thumbnail for Preach Clips. */
export const ReelCard = memo(function ReelCard({ podcast, onPress, width = 132 }: ReelCardProps) {
  return (
    <Touchable onPress={() => onPress(podcast)} style={{ width }} accessibilityLabel={`Clip: ${podcast.title}`}>
      <Artwork uri={podcast.coverImage} width={width} height={(width * 16) / 9} radius={18}>
        <Scrim strength={0.9} from={0.4} />
        <View className="absolute bottom-0 left-0 right-0 p-3">
          <AppText variant="label" tone="white" numberOfLines={3}>
            {podcast.title}
          </AppText>
          <View className="mt-2 flex-row items-center gap-1">
            <Play size={11} color={colors.white} fill={colors.white} />
            <AppText variant="caption" tone="white" className="text-[11px]">
              {formatCount(podcast.totalView)}
            </AppText>
          </View>
        </View>
      </Artwork>
      <AppText variant="caption" tone="muted" numberOfLines={1} className="mt-2">
        {ownerName(podcast)}
      </AppText>
    </Touchable>
  );
});
