import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme';

/**
 * Artwork-tinted background for players: a heavily blurred copy of the cover
 * fading into the app background. One blurred image is cheap; no live blur.
 */
export const BlurredBackdrop = memo(function BlurredBackdrop({ uri, tint = colors.brand[700] }: { uri?: string | null; tint?: string }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={60} cachePolicy="memory-disk" transition={400} />
      ) : (
        <LinearGradient colors={[tint, colors.ink[900]]} style={StyleSheet.absoluteFill} />
      )}
      <LinearGradient
        colors={['rgba(11,11,14,0.35)', 'rgba(11,11,14,0.75)', colors.ink[900]]}
        locations={[0, 0.55, 0.9]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
});
