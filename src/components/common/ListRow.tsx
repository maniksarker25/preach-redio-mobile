import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { memo, type ReactNode } from 'react';
import { View } from 'react-native';
import { colors } from '@/theme';
import { AppText } from './AppText';
import { Touchable } from './Touchable';

export interface ListRowProps {
  icon?: LucideIcon;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  trailing?: ReactNode;
  iconColor?: string;
}

/** Settings-style row. Group rows inside <ListGroup>. */
export const ListRow = memo(function ListRow({ icon: Icon, label, value, onPress, destructive, trailing, iconColor }: ListRowProps) {
  const tint = destructive ? colors.danger : (iconColor ?? colors.text.secondary);
  return (
    <Touchable onPress={onPress} disabled={!onPress} scaleTo={0.99} className="min-h-[56px] flex-row items-center px-4 py-3">
      {Icon ? (
        <View className="mr-3.5 h-9 w-9 items-center justify-center rounded-sm bg-ink-700">
          <Icon size={18} color={tint} strokeWidth={2} />
        </View>
      ) : null}
      <AppText variant="title" className="flex-1" style={destructive ? { color: colors.danger } : undefined}>
        {label}
      </AppText>
      {value ? (
        <AppText variant="bodySm" tone="muted" className="mr-1.5">
          {value}
        </AppText>
      ) : null}
      {trailing ?? (onPress ? <ChevronRight size={18} color={colors.text.faint} /> : null)}
    </Touchable>
  );
});

export const ListGroup = memo(function ListGroup({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View className="mb-6">
      {title ? (
        <AppText variant="overline" tone="muted" className="mb-2 px-1">
          {title}
        </AppText>
      ) : null}
      <View className="overflow-hidden rounded-lg border border-line bg-ink-800">{children}</View>
    </View>
  );
});
