/**
 * Runtime configuration. Values come from EXPO_PUBLIC_* variables so they can
 * differ per build profile without code changes.
 */
export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.preachradio.com',
  /**
   * Content (home feed, podcasts, stations…) is still mocked until those
   * HTTP repositories are written. Set EXPO_PUBLIC_USE_MOCKS=false once they exist.
   */
  useMocks: process.env.EXPO_PUBLIC_USE_MOCKS !== 'false',
  /** OneSignal App ID (dashboard → Settings → Keys & IDs). Empty = push turned off (in-app notifications still work). */
  oneSignalAppId: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID ?? '',
} as const;
