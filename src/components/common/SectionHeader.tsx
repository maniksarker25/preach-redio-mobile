import { memo } from 'react';
import { View } from 'react-native';
import { GUTTER } from '@/theme';
import { AppText } from './AppText';
import { Touchable } from './Touchable';

export interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Flutter home section title: 22 px heavy title, "See all" on the right. */
export const SectionHeader = memo(function SectionHeader({ title, actionLabel = 'See all', onAction }: SectionHeaderProps) {
  return (
    <View className="mb-2 h-11 flex-row items-center justify-between" style={{ paddingHorizontal: GUTTER }}>
      <AppText variant="h2" accessibilityRole="header" numberOfLines={1} className="flex-1 pr-3">
        {title}
      </AppText>
      {onAction ? (
        <Touchable onPress={onAction} accessibilityLabel={`${actionLabel}: ${title}`} className="py-2 pl-3">
          <AppText variant="label" tone="secondary">
            {actionLabel}
          </AppText>
        </Touchable>
      ) : null}
    </View>
  );
});
