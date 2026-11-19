import { useNavigation } from '@react-navigation/native';
import { ChevronDown, ChevronLeft } from 'lucide-react-native';
import { memo, type ReactNode } from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { IconButton } from '@/components/common/IconButton';
import { GUTTER } from '@/theme';

interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  /** `down` for modal screens that dismiss downward. */
  back?: 'left' | 'down' | false;
  onBack?: () => void;
  large?: boolean;
}

export const ScreenHeader = memo(function ScreenHeader({ title, subtitle, right, back = 'left', onBack, large }: ScreenHeaderProps) {
  const navigation = useNavigation();
  const goBack = onBack ?? (() => navigation.canGoBack() && navigation.goBack());

  return (
    <View style={{ paddingHorizontal: GUTTER - 6 }} className="min-h-[56px] flex-row items-center">
      {back ? (
        <IconButton icon={back === 'down' ? ChevronDown : ChevronLeft} size={24} onPress={goBack} accessibilityLabel="Go back" />
      ) : (
        <View className="w-1.5" />
      )}
      <View className={large ? 'flex-1 pl-1.5' : 'flex-1 items-center px-2'}>
        {title ? (
          <AppText variant={large ? 'h1' : 'h3'} numberOfLines={1} accessibilityRole="header">
            {title}
          </AppText>
        ) : null}
        {subtitle ? (
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <View className="min-w-[42px] flex-row items-center justify-end">{right}</View>
    </View>
  );
});
