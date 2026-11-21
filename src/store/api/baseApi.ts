import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { env } from '@/app/config/env';
import { endpoints } from '@/services/api/endpoints';
import type { ApiEnvelope } from '@/types/api';
import { loggedOut, tokenRefreshed, type AuthState } from '../slices/authSlice';

/** Normalised error every endpoint returns: HTTP status (0 = network) + a user-readable message. */
export interface ApiErrorShape {
  status: number;
  message: string;
}

const REQUEST_TIMEOUT_MS = 20_000;

/** Raw HTTP: base URL, JSON, bearer token from the auth slice, timeout. */
const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.apiBaseUrl,
  timeout: REQUEST_TIMEOUT_MS,
  // The refresh-token cookie is managed explicitly; keep the native cookie jar out of it.
  credentials: 'omit',
  prepareHeaders: (headers, { getState, endpoint }) => {
    headers.set('Accept', 'application/json');
    const token = (getState() as { auth: AuthState }).auth.accessToken;
    // Public auth routes never send a (possibly stale) token; an explicit header always wins.
    if (token && !headers.has('Authorization') && !PUBLIC_ENDPOINTS.has(endpoint)) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

/** Auth endpoints that must never carry a (possibly stale) access token. */
const PUBLIC_ENDPOINTS = new Set(['login', 'register', 'verifyEmail', 'resendVerifyCode', 'forgotPassword', 'resendResetCode', 'verifyResetCode', 'resetPassword']);

/** Turn any fetchBaseQuery error into `{ status, message }` using the server's `message` when present. */
const toApiError = (error: FetchBaseQueryError): ApiErrorShape => {
  if (error.status === 'FETCH_ERROR') return { status: 0, message: 'Can’t reach the server. Check your internet connection.' };
  if (error.status === 'TIMEOUT_ERROR') return { status: 0, message: 'The server took too long to respond. Please try again.' };
  if (error.status === 'PARSING_ERROR') return { status: error.originalStatus, message: 'Unexpected response from the server.' };
  if (error.status === 'CUSTOM_ERROR') return { status: 0, message: error.error };
  const body = error.data as Partial<ApiEnvelope<unknown>> | undefined;
  if (error.status === 429) return { status: 429, message: body?.message ?? 'Too many attempts. Please wait a few minutes and try again.' };
  return { status: error.status, message: body?.message ?? 'Something went wrong. Please try again.' };
};

/** Unwrap `{ success, message, data }` → `data`; a `success: false` body is treated as an error. */
const envelopeBaseQuery: BaseQueryFn<string | FetchArgs, unknown, ApiErrorShape> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error) return { error: toApiError(result.error), meta: result.meta };
  const body = result.data as ApiEnvelope<unknown> | undefined;
  if (body && typeof body === 'object' && 'success' in body) {
    if (!body.success) return { error: { status: result.meta?.response?.status ?? 400, message: body.message || 'Request failed' }, meta: result.meta };
    return { data: body.data, meta: result.meta };
  }
  return { data: result.data, meta: result.meta };
};

/** One refresh at a time; concurrent 401s wait for the same promise. */
let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = (api: Parameters<BaseQueryFn>[1], extraOptions: object) => {
  refreshPromise ??= (async () => {
    const refreshToken = (api.getState() as { auth: AuthState }).auth.refreshToken;
    if (!refreshToken) return null;
    // The backend reads the refresh token from the `refreshToken` cookie.
    const res = await envelopeBaseQuery(
      { url: endpoints.auth.refreshToken, method: 'POST', headers: { Cookie: `refreshToken=${refreshToken}` } },
      api,
      extraOptions,
    );
    const token = (res.data as { accessToken?: string } | undefined)?.accessToken;
    if (token) api.dispatch(tokenRefreshed(token));
    return token ?? null;
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
};

/**
 * Base query used by every endpoint:
 * - unwraps the API envelope and normalises errors,
 * - on 401 for a signed-in request: refresh the access token once and retry,
 *   otherwise log out (403 is a permission error and never logs out).
 */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, ApiErrorShape> = async (args, api, extraOptions) => {
  if (refreshPromise) await refreshPromise; // don't fire with a token that's being replaced
  let result = await envelopeBaseQuery(args, api, extraOptions);

  const signedIn = Boolean((api.getState() as { auth: AuthState }).auth.accessToken);
  if (result.error?.status === 401 && signedIn && !PUBLIC_ENDPOINTS.has(api.endpoint)) {
    const fresh = await refreshAccessToken(api, extraOptions);
    if (fresh) result = await envelopeBaseQuery(args, api, extraOptions);
    if (!fresh || result.error?.status === 401) {
      api.dispatch(loggedOut());
      api.dispatch(baseApi.util.resetApiState());
    }
  }
  return result;
};

/**
 * Root RTK Query API. Feature APIs extend it with `baseApi.injectEndpoints`
 * (see authApi.ts, contentApi.ts) so there is one cache and one middleware.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Profile', 'Home', 'Podcast', 'Album', 'Category', 'Broadcaster', 'Comment', 'Notification', 'Content', 'MyPodcasts', 'Clip'],
  keepUnusedDataFor: 60,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});
