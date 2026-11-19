import { AlertCircle, type LucideIcon } from 'lucide-react-native';
import { memo, useEffect } from 'react';
import { View, type DimensionValue, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { colors } from '@/theme';
import { cn } from '@/utils/podcast';
import { AppText } from './AppText';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState = memo(function EmptyState({ icon: Icon, title, message, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <View className={cn('items-center px-10 py-16', className)}>
      <View className="mb-5 h-20 w-20 items-center justify-center rounded-full border border-line bg-ink-800">
        <Icon size={32} color={colors.brand[400]} strokeWidth={1.8} />
      </View>
      <AppText variant="h3" className="text-center">
        {title}
      </AppText>
      {message ? (
        <AppText variant="bodySm" tone="muted" className="mt-2 text-center">
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} size="sm" className="mt-6" /> : null}
    </View>
  );
});

export const ErrorState = memo(function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="Couldn’t load this"
      message={message ?? 'Check your connection and try again.'}
      actionLabel={onRetry ? 'Try again' : undefined}
      onAction={onRetry}
    />
  );
});

/** Pulsing placeholder block for loading layouts. */
export const Skeleton = memo(function Skeleton({
  width,
  height,
  radius = 12,
  style,
}: {
  width: DimensionValue;
  height: DimensionValue;
  radius?: number;
  style?: ViewStyle;
}) {
  const o = useSharedValue(0.45);
  useEffect(() => {
    o.value = withRepeat(withTiming(0.9, { duration: 850 }), -1, true);
  }, [o]);
  const animated = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: colors.ink[700] }, animated, style]} />;
});
