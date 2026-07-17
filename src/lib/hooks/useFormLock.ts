import { useState, useRef, useCallback } from 'react';

interface FormLockState {
  isLocked: boolean;
  lockId: string | null;
}

/**
 * Hook to prevent duplicate form submissions.
 * Creates a lock when submission starts and releases on completion.
 */
export function useFormLock(timeoutMs: number = 30000) {
  const [state, setState] = useState<FormLockState>({
    isLocked: false,
    lockId: null,
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockCounterRef = useRef(0);

  const acquireLock = useCallback(() => {
    if (state.isLocked) {
      return false;
    }

    const lockId = `lock-${Date.now()}-${++lockCounterRef.current}`;

    timeoutRef.current = setTimeout(() => {
      setState((prev) => {
        if (prev.lockId === lockId) {
          return { isLocked: false, lockId: null };
        }
        return prev;
      });
    }, timeoutMs);

    setState({ isLocked: true, lockId });
    return true;
  }, [state.isLocked, timeoutMs]);

  const releaseLock = useCallback((expectedLockId?: string | null) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setState((prev) => {
      if (expectedLockId && prev.lockId !== expectedLockId) {
        return prev;
      }
      return { isLocked: false, lockId: null };
    });
  }, []);

  const withLock = useCallback(async <T>(
    operation: () => Promise<T>,
    onError?: (error: Error) => void
  ): Promise<T | null> => {
    if (!acquireLock()) {
      return null;
    }

    const currentLockId = state.lockId;

    try {
      const result = await operation();
      releaseLock(currentLockId);
      return result;
    } catch (err) {
      releaseLock(currentLockId);
      if (onError && err instanceof Error) {
        onError(err);
      }
      throw err;
    }
  }, [acquireLock, releaseLock, state.lockId]);

  return {
    isLocked: state.isLocked,
    acquireLock,
    releaseLock,
    withLock,
  };
}

/**
 * Simple request deduplication - prevents identical requests within a time window.
 */
export function useRequestDedupe(windowMs: number = 1000) {
  const pendingRequestsRef = useRef<Map<string, Promise<unknown>>>(new Map());

  const dedupe = useCallback(async <T>(
    key: string,
    request: () => Promise<T>
  ): Promise<T> => {
    const pending = pendingRequestsRef.current.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    const promise = request().finally(() => {
      setTimeout(() => {
        pendingRequestsRef.current.delete(key);
      }, windowMs);
    });

    pendingRequestsRef.current.set(key, promise);
    return promise;
  }, [windowMs]);

  return { dedupe };
}
