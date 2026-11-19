/**
 * Runtime configuration. Values come from EXPO_PUBLIC_* variables so they can
 * differ per build profile without code changes.
 */
export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.preachradio.com',
  /**
   * While true, repositories serve mock data and no network request is made.
   * Flip to false once the HTTP repositories are implemented.
   */
  useMocks: process.env.EXPO_PUBLIC_USE_MOCKS !== 'false',
} as const;
