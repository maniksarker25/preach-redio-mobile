import type { LucideIcon } from 'lucide-react-native';
import { memo } from 'react';
import { colors } from '@/theme';
import { cn } from '@/utils/podcast';
import { AppText } from './AppText';
import { Touchable } from './Touchable';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: LucideIcon;
  className?: string;
}

export const Chip = memo(function Chip({ label, selected, onPress, icon: Icon, className }: ChipProps) {
  return (
    <Touchable
      haptic
      onPress={onPress}
      accessibilityState={{ selected: !!selected }}
      className={cn(
        'h-9 flex-row items-center gap-1.5 rounded-full px-4',
        selected ? 'bg-white' : 'border border-line-strong bg-ink-800',
        className,
      )}
    >
      {Icon ? <Icon size={15} color={selected ? colors.text.inverse : colors.text.secondary} strokeWidth={2.2} /> : null}
      <AppText variant="label" tone={selected ? 'inverse' : 'secondary'}>
        {label}
      </AppText>
    </Touchable>
  );
});
