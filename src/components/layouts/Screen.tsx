import { StatusBar } from 'expo-status-bar';
import { memo, type ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '@/utils/podcast';

interface ScreenProps {
  children: ReactNode;
  /** Pad for the status bar / notch. Off for screens with full-bleed headers. */
  safeTop?: boolean;
  safeBottom?: boolean;
  className?: string;
}

/** Base container: app background + safe areas + light status bar. */
export const Screen = memo(function Screen({ children, safeTop = true, safeBottom = false, className }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className={cn('flex-1 bg-ink-900', className)}
      style={{ paddingTop: safeTop ? insets.top : 0, paddingBottom: safeBottom ? insets.bottom : 0 }}
    >
      <StatusBar style="light" />
      {children}
    </View>
  );
});
