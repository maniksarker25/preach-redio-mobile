import { endpoints } from '@/services/api/endpoints';
import type { Gender, GeoPoint, NormalUserProfile, User, UserRole } from '@/types/models';
import { loggedOut, profileLoaded, setCredentials, type AuthSession } from '../slices/authSlice';
import { baseApi, type ApiErrorShape } from './baseApi';

/* ----------------------------------------------------------- API types */

/** `/auth/login` and `/user/verify-code` both return a token pair (login also the role). */
interface TokenPair {
  accessToken: string;
  refreshToken: string;
  role?: UserRole;
}

/** `/user/get-my-profile` → the NormalUser or Creator document for the token's role. */
interface ProfileDoc {
  _id: string;
  user: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  profile_image?: string;
  profile_cover?: string;
  dateOfBirth?: string | null;
  gender?: Gender | '';
  location?: GeoPoint;
  /** creators only */
  isApproved?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'creator';
  address: string;
  /** ISO date */
  dateOfBirth: string;
  gender: Gender;
  phone?: string;
}

/* ------------------------------------------------------------- helpers */

/** Roles the mobile app supports; admins use the dashboard. */
const APP_ROLES: readonly UserRole[] = ['user', 'creator'];

/** Read JWT claims without verifying (the server verifies). */
const decodeJwt = (token: string): { id?: string; profileId?: string; email?: string; role?: UserRole } => {
  try {
    const payload = token.split('.')[1] ?? '';
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=');
    return JSON.parse(globalThis.atob(base64));
  } catch {
    return {};
  }
};

const email = (v: string) => v.trim().toLowerCase();

/** The API wants numeric OTPs. */
const code = (v: string) => Number(v.trim());

const toProfile = (doc: ProfileDoc): NormalUserProfile => ({
  _id: doc._id,
  user: doc.user,
  name: doc.name,
  email: doc.email,
  phone: doc.phone,
  address: doc.address,
  profile_image: doc.profile_image || undefined,
  profile_cover: doc.profile_cover || undefined,
  dateOfBirth: doc.dateOfBirth ?? undefined,
  gender: doc.gender || undefined,
  location: doc.location,
});

const toSession = (tokens: TokenPair, doc: ProfileDoc): AuthSession => {
  const claims = decodeJwt(tokens.accessToken);
  const role = (tokens.role ?? claims.role ?? 'user') as UserRole;
  const user: User = {
    _id: claims.id ?? doc.user,
    profileId: claims.profileId ?? doc._id,
    email: doc.email ?? claims.email ?? '',
    phone: doc.phone,
    role,
    isVerified: true,
    isBlocked: false,
    isRegistrationCompleted: true,
  };
  return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user, profile: toProfile(doc), creatorApproved: role === 'creator' ? Boolean(doc.isApproved) : undefined };
};

const unsupportedRole: ApiErrorShape = { status: 403, message: 'Admin accounts can’t sign in to the app. Please use the Preach Radio dashboard.' };

/* ----------------------------------------------------------- endpoints */

/**
 * Authentication against https://api.preachradio.com (preach-radio-backend:
 * modules/auth + modules/user). Login and email verification return a full
 * session: tokens are exchanged, the role is checked and the profile loaded
 * before anything is stored.
 */
export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<AuthSession, LoginRequest>({
      async queryFn(arg, _api, _extra, baseQuery) {
        const tokens = await baseQuery({ url: endpoints.auth.login, method: 'POST', body: { email: email(arg.email), password: arg.password } });
        if (tokens.error) return { error: tokens.error as ApiErrorShape };
        const pair = tokens.data as TokenPair;
        const role = pair.role ?? decodeJwt(pair.accessToken).role;
        if (role && !APP_ROLES.includes(role)) return { error: unsupportedRole };
        const profile = await baseQuery({ url: endpoints.user.me, headers: { Authorization: `Bearer ${pair.accessToken}` } });
        if (profile.error || !profile.data) return { error: (profile.error as ApiErrorShape) ?? { status: 404, message: 'We couldn’t load your profile.' } };
        return { data: toSession(pair, profile.data as ProfileDoc) };
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch {
          /* error is surfaced by the mutation hook */
        }
      },
    }),

    /** `/user/register-user` — sends a 6-digit code to the email. */
    register: build.mutation<{ email: string }, RegisterRequest>({
      query: (arg) => ({
        url: endpoints.auth.register,
        method: 'POST',
        body: {
          name: arg.name.trim(),
          email: email(arg.email),
          password: arg.password,
          confirmPassword: arg.password,
          role: arg.role,
          address: arg.address.trim(),
          dateOfBirth: arg.dateOfBirth,
          gender: arg.gender,
          ...(arg.phone?.trim() ? { phone: arg.phone.trim() } : {}),
        },
      }),
      transformResponse: (_res: unknown, _meta, arg) => ({ email: email(arg.email) }),
    }),

    /** `/user/verify-code` — activates the account and signs in. */
    verifyEmail: build.mutation<AuthSession, { email: string; code: string }>({
      async queryFn(arg, _api, _extra, baseQuery) {
        const tokens = await baseQuery({ url: endpoints.auth.verifyCode, method: 'POST', body: { email: email(arg.email), verifyCode: code(arg.code) } });
        if (tokens.error) return { error: tokens.error as ApiErrorShape };
        const pair = tokens.data as TokenPair;
        const profile = await baseQuery({ url: endpoints.user.me, headers: { Authorization: `Bearer ${pair.accessToken}` } });
        if (profile.error || !profile.data) return { error: (profile.error as ApiErrorShape) ?? { status: 404, message: 'We couldn’t load your profile.' } };
        return { data: toSession(pair, profile.data as ProfileDoc) };
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch {
          /* surfaced by the hook */
        }
      },
    }),

    resendVerifyCode: build.mutation<void, { email: string }>({
      query: (arg) => ({ url: endpoints.auth.resendCode, method: 'POST', body: { email: email(arg.email) } }),
    }),

    /** `/auth/forget-password` — emails a reset code. */
    forgotPassword: build.mutation<void, { email: string }>({
      query: (arg) => ({ url: endpoints.auth.forgotPassword, method: 'POST', body: { email: email(arg.email) } }),
    }),

    resendResetCode: build.mutation<void, { email: string }>({
      query: (arg) => ({ url: endpoints.auth.resendResetCode, method: 'POST', body: { email: email(arg.email) } }),
    }),

    verifyResetCode: build.mutation<void, { email: string; code: string }>({
      query: (arg) => ({ url: endpoints.auth.verifyResetOtp, method: 'POST', body: { email: email(arg.email), resetCode: code(arg.code) } }),
    }),

    resetPassword: build.mutation<void, { email: string; password: string }>({
      query: (arg) => ({ url: endpoints.auth.resetPassword, method: 'POST', body: { email: email(arg.email), password: arg.password, confirmPassword: arg.password } }),
    }),

    changePassword: build.mutation<void, { oldPassword: string; newPassword: string }>({
      query: (arg) => ({ url: endpoints.auth.changePassword, method: 'POST', body: { ...arg, confirmNewPassword: arg.newPassword } }),
    }),

    /** Keeps the stored profile fresh on app start; an invalid session logs out. */
    getMyProfile: build.query<NormalUserProfile, void>({
      query: () => endpoints.user.me,
      transformResponse: (doc: ProfileDoc) => toProfile(doc),
      providesTags: ['Profile'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(profileLoaded({ profile: data }));
        } catch (e) {
          const status = (e as { error?: ApiErrorShape }).error?.status;
          // Account removed or not allowed in the app → back to login. Network errors keep the cached session.
          if (status === 403 || status === 404) dispatch(loggedOut());
        }
      },
    }),

    /** `/user/delete-account` — needs the current password. */
    deleteAccount: build.mutation<void, { password: string }>({
      query: (arg) => ({ url: endpoints.user.deleteAccount, method: 'DELETE', body: arg }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(loggedOut());
          dispatch(baseApi.util.resetApiState());
        } catch {
          /* surfaced by the hook */
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useVerifyEmailMutation,
  useResendVerifyCodeMutation,
  useForgotPasswordMutation,
  useResendResetCodeMutation,
  useVerifyResetCodeMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useGetMyProfileQuery,
  useDeleteAccountMutation,
} = authApi;
