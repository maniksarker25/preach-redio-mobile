import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Extends app.json with values that differ per build.
 * - OneSignal: `ONESIGNAL_MODE=production` for store builds (APNs production), development otherwise.
 *   The App ID itself is read at runtime from `EXPO_PUBLIC_ONESIGNAL_APP_ID` (src/app/config/env.ts).
 */
export default ({ config }: ConfigContext): ExpoConfig =>
  ({
    ...config,
    plugins: [...(config.plugins ?? []), ['onesignal-expo-plugin', { mode: process.env.ONESIGNAL_MODE === 'production' ? 'production' : 'development' }]],
  }) as ExpoConfig;
