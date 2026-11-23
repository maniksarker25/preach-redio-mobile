import '../../global.css';
import '@/components/interop';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';
import { appFonts } from '@/assets';
import { initPushNotifications } from '@/services/push/pushNotifications';
import { RootNavigator } from './navigation/RootNavigator';
import { AppProviders } from './providers/AppProviders';

void SplashScreen.preventAutoHideAsync();
// Before navigation mounts, so a push that cold-starts the app is handled.
initPushNotifications();
SplashScreen.setOptions({ fade: true, duration: 300 });

/** Holds the native splash until fonts are loaded and navigation (after session restore) is ready. */
export default function App() {
  const [fontsLoaded, fontError] = useFonts(appFonts);

  const onReady = useCallback(() => {
    void SplashScreen.hideAsync();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <AppProviders onReady={onReady}>
      <RootNavigator />
    </AppProviders>
  );
}
