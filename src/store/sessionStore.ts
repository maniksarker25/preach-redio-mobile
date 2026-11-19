import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { configureApiClient } from '@/services/api/client';
import type { Session } from '@/services/repositories';
import type { NormalUserProfile, UserRole } from '@/types/models';

interface SessionState {
  hasOnboarded: boolean;
  session: Session | null;
  /** Mirrors the RevenueCat entitlement; mocked until purchases are wired. */
  isPremium: boolean;
  hydrated: boolean;

  completeOnboarding: () => void;
  signIn: (session: Session) => void;
  signOut: () => void;
  updateProfile: (patch: Partial<NormalUserProfile>) => void;
  /** Demo helper: switch between listener and creator experiences. */
  setRole: (role: UserRole) => void;
  setPremium: (value: boolean) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      hasOnboarded: false,
      session: null,
      isPremium: false,
      hydrated: false,

      completeOnboarding: () => set({ hasOnboarded: true }),
      signIn: (session) => set({ session, hasOnboarded: true }),
      signOut: () => set({ session: null }),
      updateProfile: (patch) =>
        set((s) => (s.session ? { session: { ...s.session, profile: { ...s.session.profile, ...patch } } } : s)),
      setRole: (role) => set((s) => (s.session ? { session: { ...s.session, user: { ...s.session.user, role } } } : s)),
      setPremium: (isPremium) => set({ isPremium }),
    }),
    {
      name: 'session-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hasOnboarded, session, isPremium }) => ({ hasOnboarded, session, isPremium }),
      onRehydrateStorage: () => () => useSessionStore.setState({ hydrated: true }),
    },
  ),
);

configureApiClient({
  getToken: () => useSessionStore.getState().session?.accessToken ?? null,
  onUnauthorized: () => useSessionStore.getState().signOut(),
});

export const useIsCreator = () => useSessionStore((s) => s.session?.user.role === 'creator');
