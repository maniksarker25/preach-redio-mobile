import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logoWordmark } from '@/assets';
import { AppText } from '@/components/common/AppText';
import { ScreenHeader } from '@/components/layouts/ScreenHeader';
import { Screen } from '@/components/layouts/Screen';
import { GUTTER } from '@/theme';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  back?: boolean;
}

/** Shared frame for auth screens, following the Flutter login: centred logo, title, form, footer. */
export function AuthLayout({ title, subtitle, children, footer, back = true }: AuthLayoutProps) {
  const insets = useSafeAreaInsets();
  return (
    <Screen>
      {back ? <ScreenHeader /> : <View className="h-6" />}
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingHorizontal: GUTTER + 8, paddingBottom: insets.bottom + 24 }}>
          <View className="items-center">
            <Image source={logoWordmark} style={{ width: 170, height: 80 }} contentFit="contain" accessibilityLabel="Preach Radio" />
          </View>
          <AppText variant="h1" className="mt-6 text-center" accessibilityRole="header">
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="bodySm" tone="secondary" className="mt-2 text-center">
              {subtitle}
            </AppText>
          ) : null}
          <View className="mt-8 gap-4">{children}</View>
          <View className="flex-1" />
          {footer ? <View className="mt-8 items-center">{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
