import type { LucideIcon } from 'lucide-react-native';
import { memo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '@/theme';
import { cn } from '@/utils/podcast';
import { AppText } from './AppText';
import { Touchable } from './Touchable';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'gold' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  accessibilityLabel?: string;
}

/** Flutter `CustomButton`: white fill, black label, 8 px corners, 52 px tall. */
const heights: Record<Size, string> = { sm: 'h-9 px-4', md: 'h-[52px] px-5', lg: 'h-[52px] px-6' };
const surfaces: Record<Variant, string> = {
  primary: 'bg-white',
  secondary: 'bg-ink-800',
  ghost: 'bg-transparent',
  outline: 'bg-transparent border border-white',
  gold: 'bg-gold',
  danger: 'bg-danger',
};
const dark = (v: Variant) => v === 'primary' || v === 'gold';

export const Button = memo(function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading,
  disabled,
  fullWidth,
  className,
  accessibilityLabel,
}: ButtonProps) {
  const inactive = disabled || loading;
  const fg = dark(variant) ? colors.black : colors.white;

  return (
    <Touchable
      haptic
      onPress={onPress}
      disabled={inactive}
      scaleTo={0.98}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      className={cn('rounded-sm', surfaces[variant], fullWidth && 'self-stretch', inactive && 'opacity-50', className)}
    >
      <View className={cn('flex-row items-center justify-center gap-2', heights[size])}>
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <>
            {Icon ? <Icon size={size === 'sm' ? 16 : 18} color={fg} strokeWidth={2.2} /> : null}
            <AppText variant={size === 'sm' ? 'label' : 'title'} tone={dark(variant) ? 'inverse' : 'white'} className={size === 'sm' ? '' : 'text-[16px]'}>
              {label}
            </AppText>
          </>
        )}
      </View>
    </Touchable>
  );
});
