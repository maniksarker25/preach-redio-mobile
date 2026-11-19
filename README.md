# Preach Radio — Mobile (React Native)

The new Preach Radio app. It rebuilds the Flutter app in `../potcast_app` with the **same screens, tabs, home sections and content**, refined visually (Flutter colours #1E2122 / #2A2B31 / #E6A7A8 and its Roboto fonts). **Authentication uses the real API (https://api.preachradio.com); all other content still runs on mock data.**

Expo SDK 58 · React Native 0.88 · TypeScript (strict) · NativeWind 4 · React Navigation 7 · Reanimated 4 ·
Gesture Handler · FlashList 2 · Redux Toolkit + RTK Query + redux-persist · Zustand 5 (player/library) · expo-image · Lucide.

Tabs (as in Flutter): Home · History · Favorite · Profile; creators also get a “+” create tab.
Home order: header (logo + search) · hero (admin banners) · category row · Top Favorites · Features · Just In · Faith Hits · Praise Clips · Series · Streaming Record. The app uses categories only (no sub-categories in the UI); uploads send the category's first sub-category because the API still requires one.

## Run it

```bash
npm install
npx expo start          # press i / a, or scan the QR code with Expo Go
npx tsc --noEmit        # typecheck
npx expo-doctor         # dependency/config checks
```

Every native module used ships in Expo Go. If you add one that doesn't, use a development build (`npx expo run:android|ios`).

**Sign in:** use a real Preach Radio account, or sign up in the app (a 6-digit code is emailed). Listener and creator accounts are supported; admin accounts are pointed to the dashboard.

## Structure

```
src/
  app/            App root, providers (query client, navigation theme, deep links), navigators, env config
  assets/         Brand logos (from the original app)
  components/     Shared UI — common/ (text, buttons, fields, states), media/ (artwork, players, seekbar,
                  equalizer, mini-player), cards/, layouts/
  features/       One folder per area, each with screens/ (+ components/, hooks/ where needed):
                  home · discover (search, category) · podcasts (player, series, comments) · reels ·
                  radio (station profile, live, recordings) · library (history, favorite, playlists) ·
                  profile · settings · notifications · auth · creator
  services/
    api/          fetch client (envelope unwrap, 401 vs 403) + every backend endpoint path
    mock/         Mock data shaped exactly like the backend responses
    repositories/ Interfaces + mock implementations; index.ts is the only switch between mock and HTTP
    playback/     PlaybackEngine interface + timer-based mock engine
  store/          Redux: index.ts (store + redux-persist), hooks.ts (typed hooks), slices/authSlice.ts (session),
                  api/baseApi.ts (RTK Query base: envelope unwrap, error normalising, 401 → refresh → retry/logout),
                  api/authApi.ts (real auth endpoints), api/contentApi.ts (content endpoints, mock-backed for now).
                  Zustand: playerStore (playback) and libraryStore (likes, history, playlists; device-local).
  hooks/          queries.ts (screen-facing wrappers over the RTK Query endpoints), media routing, layout helpers
  theme/          Design tokens (shared with tailwind.config.js) and spacing/shadows
  types/          Domain models mirroring the backend, API envelope/pagination types
  utils/          Formatting, podcast helpers, share, pickers
```

**Rules of the road:** screens never import mock data. They call hooks in `hooks/queries.ts`, which call
`repositories`. All colours, fonts and radii come from `src/theme/tokens.js`.

## Content model (from the backend)

| App concept | Backend |
| --- | --- |
| Podcast / episode | `podcast` with `type: "episode"` (audio or video) |
| Video episode | `podcast` with `mediaType: "video"` — plays in the same player, like Flutter |
| Praise Clip (Reels) | `podcast` with `type: "clip"`, ≤ 120 s, optional `sourcePodcast` |
| Series | `album` |
| Station / preacher | `station` + approved `creator`, mapped to one `Broadcaster` view-model |
| Live now | `topCreators[].isLive` / `liveSession`, `liveStreaming` rooms |

Rules mirrored in the UI: play `hlsUrl ?? podcast_url`; covers are optional (branded fallback);
duration prefers `durationSeconds` over the legacy minutes.seconds value; hidden/deleted podcasts may come back as `null`.

## API integration

- **Done — authentication** (`src/store/api/authApi.ts`): login, sign-up, email verification + resend, forgot / verify / reset password, change password, delete account, get my profile. The session (access + refresh token, user, profile) is persisted with redux-persist. Expired access tokens are refreshed automatically via `/auth/refresh-token` (refresh token sent as the `refreshToken` cookie); if that fails the user is logged out.
- **Next — content**: each endpoint in `src/store/api/contentApi.ts` uses a mock `queryFn`. Replace it with `query: () => endpoints.…` (+ `transformResponse` if needed). Hooks, cache tags and screens stay the same.
- Playback: replace `createMockEngine()` with a real engine (react-native-track-player / expo-audio, expo-video, 100ms for live). Purchases: RevenueCat.
