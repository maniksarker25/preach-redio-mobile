import '../../global.css';
import '@/components/interop';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';
import { appFonts } from '@/assets';
import { useSessionStore } from '@/store/sessionStore';
import { RootNavigator } from './navigation/RootNavigator';
import { AppProviders } from './providers/AppProviders';

void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ fade: true, duration: 300 });

/** Holds the native splash until fonts and persisted session are ready, so the first frame is final. */
export default function App() {
  const [fontsLoaded, fontError] = useFonts(appFonts);
  const hydrated = useSessionStore((s) => s.hydrated);
  const ready = (fontsLoaded || Boolean(fontError)) && hydrated;

  const onReady = useCallback(() => {
    void SplashScreen.hideAsync();
  }, []);

  if (!ready) return null;

  return (
    <AppProviders onReady={onReady}>
      <RootNavigator />
    </AppProviders>
  );
}
