import type { LucideIcon } from 'lucide-react-native';
import { memo } from 'react';
import { View } from 'react-native';
import { colors } from '@/theme';
import { cn } from '@/utils/podcast';
import { AppText } from './AppText';
import { Touchable } from './Touchable';

export interface IconButtonProps {
  icon: LucideIcon;
  onPress?: () => void;
  accessibilityLabel: string;
  size?: number;
  /** `glass` = translucent chip for use over imagery */
  variant?: 'plain' | 'surface' | 'glass' | 'brand';
  color?: string;
  active?: boolean;
  activeColor?: string;
  /** Fill the glyph (only while `active`, when `active` is given). */
  fill?: boolean;
  badge?: number;
  className?: string;
}

const surfaces = {
  plain: '',
  surface: 'bg-ink-700',
  glass: 'bg-black/35 border border-white/10',
  brand: 'bg-white',
} as const;

export const IconButton = memo(function IconButton({
  icon: Icon,
  onPress,
  accessibilityLabel,
  size = 22,
  variant = 'plain',
  color,
  active,
  activeColor = colors.brand[500],
  fill,
  badge,
  className,
}: IconButtonProps) {
  const tint = active ? activeColor : (color ?? (variant === 'brand' ? colors.black : colors.text.primary));
  const box = Math.round(size * 1.9);
  return (
    <Touchable
      haptic
      scaleTo={0.88}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={active !== undefined ? { selected: active } : undefined}
      className={cn('items-center justify-center rounded-full', surfaces[variant], className)}
      style={{ width: box, height: box }}
    >
      <Icon size={size} color={tint} strokeWidth={2} fill={fill && active !== false ? tint : 'none'} />
      {badge ? (
        <View className="absolute right-0.5 top-0.5 h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-ink-900 bg-live px-1">
          <AppText variant="caption" className="text-[10px] leading-[12px]" tone="white">
            {badge > 9 ? '9+' : badge}
          </AppText>
        </View>
      ) : null}
    </Touchable>
  );
});
