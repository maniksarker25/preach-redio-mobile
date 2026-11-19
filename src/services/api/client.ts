import { env } from '@/app/config/env';
import { ApiError, type ApiEnvelope } from '@/types/api';

type TokenGetter = () => string | null;
type UnauthorizedHandler = () => void;

let getToken: TokenGetter = () => null;
let onUnauthorized: UnauthorizedHandler = () => {};

/** Wired once at startup by the session store. */
export const configureApiClient = (options: { getToken: TokenGetter; onUnauthorized: UnauthorizedHandler }) => {
  getToken = options.getToken;
  onUnauthorized = options.onUnauthorized;
};

type Query = Record<string, string | number | boolean | undefined>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
}

const toQueryString = (query?: Query) => {
  if (!query) return '';
  const params = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return params.length ? `?${params.join('&')}` : '';
};

/**
 * Thin fetch wrapper for the Preach Radio API.
 * Unwraps the `{ success, message, data }` envelope and normalises errors.
 * 401 ends the session; 403 is a permission error and never logs out.
 *
 * Not used while `env.useMocks` is true.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${env.apiBaseUrl}${path}${toQueryString(options.query)}`, {
    method: options.method ?? 'GET',
    signal: options.signal,
    headers: {
      Accept: 'application/json',
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const json = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !json?.success) {
    if (response.status === 401) onUnauthorized();
    throw new ApiError(json?.message ?? 'Something went wrong. Please try again.', response.status);
  }
  return json.data;
}
