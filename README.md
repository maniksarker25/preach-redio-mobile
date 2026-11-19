# Preach Radio — Mobile (React Native)

The new Preach Radio app. It rebuilds the Flutter app in `../potcast_app` with the **same screens, tabs, home sections and content**, refined visually (Flutter colours #1E2122 / #2A2B31 / #E6A7A8 and its Roboto fonts). **Frontend only — every screen runs on mock data; no API is called yet.**

Expo SDK 58 · React Native 0.88 · TypeScript (strict) · NativeWind 4 · React Navigation 7 · Reanimated 4 ·
Gesture Handler · FlashList 2 · TanStack Query 5 · Zustand 5 · expo-image · Lucide.

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

**Demo sign-in:** any email + a 6-character password. An email starting with `creator` signs in as a creator.
OTP: any 6 digits except `000000`. In the app, Settings → *Creator mode (demo)* toggles the creator experience.

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
  store/          Zustand: session (persisted), library (likes, bookmarks, history, progress, playlists; persisted), player
  hooks/          React Query hooks + query keys, media routing, layout helpers
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

## Connecting the backend

1. Add `src/services/repositories/http.ts` implementing the interfaces in `repositories/types.ts`
   with `apiRequest()` and `endpoints`.
2. Return those from `repositories/index.ts` when `env.useMocks` is false and set `EXPO_PUBLIC_USE_MOCKS=false`.
3. Sync the library store's actions (like, bookmark, playlist CRUD) to their endpoints.
4. Replace `createMockEngine()` with a real engine: react-native-track-player or expo-audio for audio,
   expo-video in the player, `VideoStage` and `ReelItem`, and the 100ms SDK for live rooms and Go Live.
5. Replace the simulated purchase in `SubscriptionScreen` with RevenueCat.

Screens, hooks and query keys don't change.
