import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useState, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '@/theme';

import { logoMark } from '@/assets';

export interface ArtworkProps {
  uri?: string | null;
  /** width / height */
  aspect?: number;
  width?: number;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  /** Overlay content (gradients, badges) rendered above the image. */
  children?: ReactNode;
  priority?: 'low' | 'normal' | 'high';
  blurhash?: string;
  /**
   * `cover` fills the box and may crop. `contain` shows the whole image (e.g. a 16:9 video cover in a
   * square card) over a blurred, cropped copy of itself so the box never looks empty.
   */
  fit?: 'cover' | 'contain';
}

/**
 * Media thumbnail. Covers are optional in the API, so a missing or broken URL
 * renders a branded fallback instead of an empty box.
 */
export const Artwork = memo(function Artwork({ uri, aspect = 1, width, height, radius = 16, style, children, priority, fit = 'cover' }: ArtworkProps) {
  const [failed, setFailed] = useState(false);
  const sizeStyle: ViewStyle = width && height ? { width, height } : width ? { width, aspectRatio: aspect } : { aspectRatio: aspect };
  const showImage = Boolean(uri) && !failed;

  return (
    <View style={[sizeStyle, { borderRadius: radius, overflow: 'hidden', backgroundColor: colors.ink[700] }, style]}>
      {showImage && fit === 'contain' ? (
        <Image
          source={{ uri: uri! }}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, opacity: 0.55 }}
          contentFit="cover"
          blurRadius={18}
          cachePolicy="memory-disk"
          recyclingKey={uri ? `${uri}#blur` : undefined}
          accessible={false}
        />
      ) : null}
      {showImage ? (
        <Image
          source={{ uri: uri! }}
          style={{ width: '100%', height: '100%' }}
          contentFit={fit}
          cachePolicy="memory-disk"
          recyclingKey={uri ?? undefined}
          transition={250}
          priority={priority}
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <LinearGradient colors={[colors.brand[800], colors.ink[800], colors.ink[900]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Image source={logoMark} style={{ width: '42%', aspectRatio: 1, opacity: 0.9 }} contentFit="contain" />
        </LinearGradient>
      )}
      {children}
    </View>
  );
});

/** Bottom-up scrim for legible text over imagery. */
export const Scrim = memo(function Scrim({ strength = 0.85, from = 0.35 }: { strength?: number; from?: number }) {
  return <LinearGradient colors={['transparent', `rgba(6,6,8,${strength})`]} locations={[from, 1]} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} pointerEvents="none" />;
});
