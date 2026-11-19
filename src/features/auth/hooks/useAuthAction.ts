import { useCallback, useState } from 'react';
import { ApiError } from '@/types/api';

/** Runs an auth request, exposing `busy` and a readable `error`. */
export const useAuthAction = () => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const run = useCallback(async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    setBusy(true);
    setError(undefined);
    try {
      return await fn();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
      return undefined;
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, error, setError, run };
};

export const isEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v.trim());
