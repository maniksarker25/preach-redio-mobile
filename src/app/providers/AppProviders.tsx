import { DarkTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor, store } from '@/store';
import { colors, fonts } from '@/theme';

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.brand[400],
    background: colors.ink[900],
    card: colors.ink[900],
    text: colors.text.primary,
    border: colors.line,
    notification: colors.live,
  },
  fonts: {
    regular: { fontFamily: fonts.regular, fontWeight: '400' },
    medium: { fontFamily: fonts.medium, fontWeight: '500' },
    bold: { fontFamily: fonts.bold, fontWeight: '700' },
    heavy: { fontFamily: fonts.extrabold, fontWeight: '800' },
  },
};

/** Deep links match the banner `redirect_url` scheme (preachradio://podcast/:id). */
const linking = {
  prefixes: ['preachradio://', 'https://preachradio.com'],
  config: {
    screens: {
      PodcastDetail: 'podcast/:id',
      Album: 'album/:id',
      StationDetail: 'station/:id',
      Category: 'category/:id',
    },
  },
};

/**
 * Redux store (+ persisted session) → navigation. The PersistGate holds the UI
 * until the saved session is restored, so the first screen is the right one.
 */
export function AppProviders({ children, onReady }: { children: ReactNode; onReady?: () => void }) {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.ink[900] }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <NavigationContainer theme={navTheme} linking={linking} onReady={onReady}>
              {children}
            </NavigationContainer>
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
