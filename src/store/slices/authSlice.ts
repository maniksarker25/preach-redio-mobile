import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { NormalUserProfile, User, UserRole } from '@/types/models';

/** Everything the app needs to know about the signed-in account. */
export interface AuthSession {
  accessToken: string;
  /** Sent back as the `refreshToken` cookie to `/auth/refresh-token`. */
  refreshToken: string;
  user: User;
  profile: NormalUserProfile;
  /** Creators must be approved by an admin before they can publish. */
  creatorApproved?: boolean;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  profile: NormalUserProfile | null;
  creatorApproved: boolean | null;
  hasOnboarded: boolean;
  /** Mirrors the RevenueCat entitlement; mocked until purchases are wired. */
  isPremium: boolean;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  profile: null,
  creatorApproved: null,
  hasOnboarded: false,
  isPremium: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** After login / email verification: tokens + account + profile. */
    setCredentials(state, { payload }: PayloadAction<AuthSession>) {
      state.accessToken = payload.accessToken;
      state.refreshToken = payload.refreshToken;
      state.user = payload.user;
      state.profile = payload.profile;
      state.creatorApproved = payload.creatorApproved ?? null;
      state.hasOnboarded = true;
    },
    /** A new access token from `/auth/refresh-token`. */
    tokenRefreshed(state, { payload }: PayloadAction<string>) {
      state.accessToken = payload;
    },
    /** Fresh profile from `/user/get-my-profile`. */
    profileLoaded(state, { payload }: PayloadAction<{ profile: NormalUserProfile; user?: Partial<User>; creatorApproved?: boolean }>) {
      state.profile = payload.profile;
      if (state.user && payload.user) state.user = { ...state.user, ...payload.user };
      if (payload.creatorApproved !== undefined) state.creatorApproved = payload.creatorApproved;
    },
    /** Optimistic local profile edits (until profile updates use the API). */
    profilePatched(state, { payload }: PayloadAction<Partial<NormalUserProfile>>) {
      if (state.profile) state.profile = { ...state.profile, ...payload };
    },
    /** Demo helper: preview the creator experience. */
    roleChanged(state, { payload }: PayloadAction<UserRole>) {
      if (state.user) state.user.role = payload;
    },
    onboardingCompleted(state) {
      state.hasOnboarded = true;
    },
    premiumChanged(state, { payload }: PayloadAction<boolean>) {
      state.isPremium = payload;
    },
    /** Clear the session but remember that onboarding was seen. */
    loggedOut(state) {
      return { ...initialState, hasOnboarded: state.hasOnboarded, isPremium: state.isPremium };
    },
  },
});

export const { setCredentials, tokenRefreshed, profileLoaded, profilePatched, roleChanged, onboardingCompleted, premiumChanged, loggedOut } = authSlice.actions;
export default authSlice.reducer;

/* ------------------------------------------------------------ selectors */

type WithAuth = { auth: AuthState };

export const selectAccessToken = (s: WithAuth) => s.auth.accessToken;
export const selectRefreshToken = (s: WithAuth) => s.auth.refreshToken;
export const selectIsAuthenticated = (s: WithAuth) => Boolean(s.auth.accessToken && s.auth.user);
export const selectCurrentUser = (s: WithAuth) => s.auth.user;
export const selectProfile = (s: WithAuth) => s.auth.profile;
export const selectIsCreator = (s: WithAuth) => s.auth.user?.role === 'creator';
export const selectCreatorApproved = (s: WithAuth) => s.auth.creatorApproved;
export const selectHasOnboarded = (s: WithAuth) => s.auth.hasOnboarded;
export const selectIsPremium = (s: WithAuth) => s.auth.isPremium;
