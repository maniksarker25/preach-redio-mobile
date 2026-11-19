import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useState } from 'react';
import { View } from 'react-native';
import { colors } from '@/theme';
import { initials } from '@/utils/format';
import { AppText } from './AppText';

export interface AvatarProps {
  uri?: string;
  name: string;
  size?: number;
  /** Coral ring for live broadcasters. */
  live?: boolean;
  ring?: boolean;
}

export const Avatar = memo(function Avatar({ uri, name, size = 44, live, ring }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const pad = live || ring ? 2.5 : 0;
  const inner = size - pad * 2;

  const face =
    uri && !failed ? (
      <Image
        source={{ uri }}
        style={{ width: inner, height: inner, borderRadius: inner / 2 }}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={200}
        onError={() => setFailed(true)}
        accessibilityIgnoresInvertColors
      />
    ) : (
      <LinearGradient
        colors={[colors.ink[600], colors.ink[700]]}
        style={{ width: inner, height: inner, borderRadius: inner / 2, alignItems: 'center', justifyContent: 'center' }}
      >
        <AppText variant="label" tone="secondary" style={{ fontSize: Math.max(11, inner * 0.36) }}>
          {initials(name)}
        </AppText>
      </LinearGradient>
    );

  if (!pad) return face;

  return (
    <LinearGradient
      colors={live ? [colors.brand[300], colors.brand[600]] : [colors.lineStrong, colors.line]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size / 2, padding: pad }}
    >
      <View style={{ borderRadius: inner / 2, borderWidth: 2, borderColor: colors.ink[900], overflow: 'hidden' }}>{face}</View>
    </LinearGradient>
  );
});
