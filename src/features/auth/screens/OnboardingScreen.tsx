import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootScreenProps } from '@/app/navigation/types';
import { introImage, logoWordmark } from '@/assets';
import { AppText } from '@/components/common/AppText';
import { Button } from '@/components/common/Button';
import { Screen } from '@/components/layouts/Screen';
import { useSessionStore } from '@/store/sessionStore';
import { GUTTER } from '@/theme';

/** Flutter `IntroScreen`: collage on top, black panel with the tagline and "Get Started". */
export function OnboardingScreen({ navigation }: RootScreenProps<'Onboarding'>) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const completeOnboarding = useSessionStore((s) => s.completeOnboarding);

  const start = () => {
    completeOnboarding();
    navigation.replace('Auth', { screen: 'Login' });
  };

  return (
    <Screen safeTop={false} className="bg-black">
      <View style={{ height: height / 2 + 100 }}>
        <Image source={introImage} style={{ width: '100%', height: '100%' }} contentFit="cover" accessibilityIgnoresInvertColors />
        <LinearGradient colors={['transparent', '#000']} locations={[0.6, 1]} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
      </View>
      <View className="flex-1 justify-between" style={{ paddingHorizontal: GUTTER + 12, paddingBottom: insets.bottom + 24 }}>
        <View className="items-center">
          <Image source={logoWordmark} style={{ width: 150, height: 60 }} contentFit="contain" accessibilityLabel="Preach Radio" />
          <AppText variant="h2" className="mt-5 text-center text-[24px]" accessibilityRole="header">
            Learn New Things Through Podcasts
          </AppText>
        </View>
        <Button label="Get Started" onPress={start} fullWidth />
      </View>
    </Screen>
  );
}
