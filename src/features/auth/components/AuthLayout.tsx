import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logoWordmark } from '@/assets';
import { AppText } from '@/components/common/AppText';
import { IconButton } from '@/components/common/IconButton';
import { Screen } from '@/components/layouts/Screen';
import { colors, GUTTER } from '@/theme';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  /** Small label above the title, e.g. "Step 1 of 2". */
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  back?: boolean;
  onBack?: () => void;
  /** Kept for API compatibility; the layout no longer uses a hero image. */
  hero?: 'tall' | 'compact';
}

/**
 * Clean auth frame: charcoal page with a soft accent glow from the top,
 * the Preach Radio logo, a clear title block and the form.
 */
export function AuthLayout({ title, subtitle, eyebrow, children, footer, back = true, onBack }: AuthLayoutProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <Screen safeTop={false}>
      {/* Ambient glow */}
      <LinearGradient
        colors={['rgba(230,167,168,0.16)', 'rgba(230,167,168,0.05)', 'transparent']}
        locations={[0, 0.45, 1]}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 380 }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(244,67,54,0.10)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.3, y: 0.6 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 320 }}
        pointerEvents="none"
      />

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24, paddingHorizontal: GUTTER + 10 }}
        >
          {/* Top bar: back button (when there's somewhere to go) */}
          <View style={{ height: 44, justifyContent: 'center', marginLeft: -6 }}>
            {back ? (
              <IconButton
                icon={ChevronLeft}
                variant="surface"
                size={22}
                onPress={onBack ?? (() => navigation.canGoBack() && navigation.goBack())}
                accessibilityLabel="Go back"
              />
            ) : null}
          </View>

          {/* Logo */}
          <View className="mt-2 items-center">
            <Image source={logoWordmark} style={{ width: 170, height: 78 }} contentFit="contain" accessibilityLabel="Preach Radio" />
          </View>

          {/* Title block */}
          <View className="mt-9">
            {eyebrow ? (
              <AppText variant="overline" tone="brand" className="mb-2">
                {eyebrow}
              </AppText>
            ) : null}
            <AppText variant="display" accessibilityRole="header">
              {title}
            </AppText>
            {subtitle ? (
              <AppText variant="bodySm" tone="muted" className="mt-1.5">
                {subtitle}
              </AppText>
            ) : null}
          </View>

          <View className="mt-7 gap-4">{children}</View>
          <View className="flex-1" />
          {footer ? (
            <View className="mt-10 items-center">
              <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: colors.line, marginBottom: 20 }} />
              {footer}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
