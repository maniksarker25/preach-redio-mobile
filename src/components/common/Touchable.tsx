import * as Haptics from 'expo-haptics';
import { memo, useCallback, useState } from 'react';
import { Pressable, type GestureResponderEvent, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

export interface TouchableProps extends Omit<PressableProps, 'style'> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  /** How far the view shrinks while pressed (1 = no scale). */
  scaleTo?: number;
  haptic?: boolean;
}

/**
 * Pressable with press feedback (slight shrink + dim) and an optional haptic tick.
 *
 * Built on the core `Pressable` on purpose: NativeWind styles core components
 * reliably, while `className` on Reanimated-wrapped components is not applied
 * with Reanimated 4 — which broke layouts (search box, category tiles, tab bar).
 */
export const Touchable = memo(function Touchable({ scaleTo = 0.97, haptic = false, onPressIn, onPressOut, onPress, style, ...rest }: TouchableProps) {
  const [pressed, setPressed] = useState(false);

  const handleIn = useCallback(
    (e: GestureResponderEvent) => {
      setPressed(true);
      onPressIn?.(e);
    },
    [onPressIn],
  );
  const handleOut = useCallback(
    (e: GestureResponderEvent) => {
      setPressed(false);
      onPressOut?.(e);
    },
    [onPressOut],
  );
  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      if (haptic) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress?.(e);
    },
    [haptic, onPress],
  );

  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={6}
      {...rest}
      onPress={handlePress}
      onPressIn={handleIn}
      onPressOut={handleOut}
      style={[style, pressed ? { opacity: 0.85, transform: [{ scale: scaleTo }] } : null]}
    />
  );
});
