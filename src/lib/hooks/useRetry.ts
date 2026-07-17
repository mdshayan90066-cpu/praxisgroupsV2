import { useState, useCallback, useRef } from 'react';

interface RetryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  retryCount: number;
}

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

/**
 * Retry wrapper for async operations with exponential backoff.
 */
export function useRetry<T>(
  asyncFn: () => Promise<T>,
  options: RetryOptions = {}
) {
  const {
    maxRetries = 3,
    initialDelay = 500,
    maxDelay = 5000,
    backoffFactor = 2,
  } = options;

  const [state, setState] = useState<RetryState<T>>({
    data: null,
    loading: false,
    error: null,
    retryCount: 0,
  });

  const abortRef = useRef(false);

  const execute = useCallback(async () => {
    abortRef.current = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    let attempt = 0;
    let delay = initialDelay;

    while (attempt <= maxRetries) {
      if (abortRef.current) {
        setState((prev) => ({ ...prev, loading: false }));
        return null;
      }

      try {
        const result = await asyncFn();
        setState({ data: result, loading: false, error: null, retryCount: attempt });
        return result;
      } catch (err) {
        attempt++;

        if (attempt > maxRetries) {
          const error = err instanceof Error ? err : new Error(String(err));
          setState((prev) => ({
            ...prev,
            loading: false,
            error,
            retryCount: attempt
          }));
          return null;
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffFactor, maxDelay);
      }
    }

    return null;
  }, [asyncFn, maxRetries, initialDelay, maxDelay, backoffFactor]);

  const reset = useCallback(() => {
    abortRef.current = true;
    setState({ data: null, loading: false, error: null, retryCount: 0 });
  }, []);

  const retry = useCallback(() => {
    if (!state.loading) {
      execute();
    }
  }, [execute, state.loading]);

  return { ...state, execute, retry, reset };
}

/**
 * Retry wrapper specifically for Supabase queries.
 */
export function useSupabaseRetry() {
  const retryCount = useRef(0);
  const maxRetries = 2;

  const executeWithRetry = useCallback(async <T>(
    query: Promise<{ data: T | null; error: { message: string } | null }>,
    onSuccess: (data: T) => void,
    onError: (error: string) => void
  ): Promise<T | null> => {
    let lastError: string | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const result = await query;

      if (result.error) {
        lastError = result.error.message;
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
          continue;
        }
        onError(lastError);
        return null;
      }

      retryCount.current = 0;
      if (result.data !== null) {
        onSuccess(result.data);
      }
      return result.data;
    }

    if (lastError) {
      onError(lastError);
    }
    return null;
  }, []);

  return { executeWithRetry };
}
