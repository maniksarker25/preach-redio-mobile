import { LinearGradient } from 'expo-linear-gradient';
import { Pause, Play } from 'lucide-react-native';
import { memo } from 'react';
import { Touchable } from '@/components/common/Touchable';
import { colors, shadow } from '@/theme';

interface PlayButtonProps {
  playing: boolean;
  onPress: () => void;
  size?: number;
  /** `brand` = coral gradient, `light` = white disc (over video) */
  tone?: 'brand' | 'light';
  label?: string;
}

export const PlayButton = memo(function PlayButton({ playing, onPress, size = 72, tone = 'brand', label }: PlayButtonProps) {
  const Icon = playing ? Pause : Play;
  const fg = tone === 'brand' ? colors.white : colors.text.inverse;
  const icon = <Icon size={size * 0.38} color={fg} fill={fg} strokeWidth={1.5} style={playing ? undefined : { marginLeft: size * 0.05 }} />;

  return (
    <Touchable
      haptic
      scaleTo={0.9}
      onPress={onPress}
      accessibilityLabel={label ?? (playing ? 'Pause' : 'Play')}
      style={[{ width: size, height: size, borderRadius: size / 2 }, tone === 'brand' ? shadow.glow : shadow.floating]}
    >
      {tone === 'brand' ? (
        <LinearGradient
          colors={[colors.brand[400], colors.brand[600]]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{ flex: 1, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}
        >
          {icon}
        </LinearGradient>
      ) : (
        <LinearGradient colors={['#FFFFFF', '#E9E9EE']} style={{ flex: 1, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </LinearGradient>
      )}
    </Touchable>
  );
});
