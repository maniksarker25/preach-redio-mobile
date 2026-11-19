import { DarkTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors, fonts } from '@/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, gcTime: 10 * 60_000, retry: 1, refetchOnWindowFocus: false },
  },
});

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.brand[500],
    background: colors.ink[900],
    card: colors.ink[900],
    text: colors.text.primary,
    border: colors.line,
    notification: colors.brand[500],
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

export function AppProviders({ children, onReady }: { children: ReactNode; onReady?: () => void }) {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.ink[900] }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer theme={navTheme} linking={linking} onReady={onReady}>
            {children}
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
