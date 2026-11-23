import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/** Navigation from outside React (push taps). Attached to the NavigationContainer in AppProviders. */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** Resolves once navigation is mounted and the signed-in tree is showing (cold start from a push). */
export const whenNavigationReady = (timeoutMs = 15_000) =>
  new Promise<boolean>((resolve) => {
    const started = Date.now();
    const check = () => {
      if (navigationRef.isReady() && navigationRef.getRootState()?.routeNames.includes('Main')) return resolve(true);
      if (Date.now() - started > timeoutMs) return resolve(false);
      setTimeout(check, 150);
    };
    check();
  });
