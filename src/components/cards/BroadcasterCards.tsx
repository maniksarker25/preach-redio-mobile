import { Headphones } from 'lucide-react-native';
import { memo } from 'react';
import { View } from 'react-native';
import { Avatar } from '@/components/common/Avatar';
import { AppText } from '@/components/common/AppText';
import { LiveBadge } from '@/components/common/LiveBadge';
import { Touchable } from '@/components/common/Touchable';
import { colors } from '@/theme';
import type { Broadcaster } from '@/types/broadcaster';
import { formatCount } from '@/utils/format';

interface StationRowProps {
  broadcaster: Broadcaster;
  onPress: (b: Broadcaster) => void;
  onListen?: (b: Broadcaster) => void;
}

/** Row for the "Top Favorites" see-all list: avatar, name, what's on, and Join when live. */
export const StationRow = memo(function StationRow({ broadcaster: b, onPress, onListen }: StationRowProps) {
  return (
    <Touchable onPress={() => onPress(b)} scaleTo={0.985} className="flex-row items-center rounded-sm bg-ink-800 p-3" accessibilityLabel={`${b.name}${b.isLive ? ', live now' : ''}`}>
      <View>
        <Avatar uri={b.avatar} name={b.name} size={56} />
        {b.isLive ? (
          <View className="absolute -bottom-1 left-0 right-0 items-center">
            <LiveBadge size="sm" />
          </View>
        ) : null}
      </View>
      <View className="ml-3.5 flex-1">
        <AppText variant="title" numberOfLines={1} className="text-[16px]">
          {b.name}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1} className="mt-0.5">
          {b.isLive && b.live ? b.live.name : [b.address, `${b.podcastCount} podcasts`].filter(Boolean).join(' · ')}
        </AppText>
        <View className="mt-1 flex-row items-center gap-1">
          <Headphones size={12} color={colors.text.faint} />
          <AppText variant="caption" tone="faint">
            {formatCount(b.totalViews)} plays
          </AppText>
        </View>
      </View>
      {b.isLive && onListen ? (
        <Touchable haptic onPress={() => onListen(b)} className="rounded-sm bg-live px-3.5 py-2" accessibilityLabel={`Join ${b.name} live`}>
          <AppText variant="label" tone="white">
            Join
          </AppText>
        </Touchable>
      ) : null}
    </Touchable>
  );
});
