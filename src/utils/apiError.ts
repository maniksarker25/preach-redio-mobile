/**
 * Readable message from anything an RTK Query hook or `.unwrap()` can throw:
 * our normalised `{ status, message }`, a SerializedError, or an Error.
 */
export const getErrorMessage = (error: unknown, fallback = 'Something went wrong. Please try again.'): string => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (typeof error === 'object') {
    const e = error as { message?: unknown; data?: { message?: unknown } };
    if (typeof e.message === 'string' && e.message) return e.message;
    if (typeof e.data?.message === 'string' && e.data.message) return e.data.message;
  }
  return fallback;
};

/** HTTP status from an RTK Query error (0 = network). */
export const getErrorStatus = (error: unknown): number | undefined =>
  typeof error === 'object' && error && 'status' in error && typeof (error as { status: unknown }).status === 'number' ? (error as { status: number }).status : undefined;
