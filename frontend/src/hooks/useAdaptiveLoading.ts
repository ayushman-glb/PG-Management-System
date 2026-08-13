import { useState, useEffect, useCallback, useRef } from "react";

export interface UseAdaptiveLoadingOptions {
  /** In-flight latency threshold before showing skeleton (default: 250ms) */
  thresholdMs?: number;
  /** Whether to execute immediately on mount or dependency changes */
  autoFetch?: boolean;
}

export interface UseAdaptiveLoadingResult<T> {
  data: T | null;
  isLoading: boolean;
  showSkeleton: boolean;
  error: Error | null;
  refetch: () => Promise<T | null>;
}

/**
 * Shared Hook for Adaptive Skeleton Loading site-wide.
 * 
 * Strategy:
 * 1. If Network Information API (navigator.connection) indicates slow connection
 *    (slow-2g, 2g, 3g, or saveData enabled), triggers skeleton display immediately.
 * 2. For standard/fast connections or browsers lacking Network Information API (Safari/iOS),
 *    starts a 250ms latency threshold timer. Fast responses (<250ms) complete without
 *    ever flashing a skeleton. Slow/pending responses past 250ms smoothly render the layout skeleton.
 */
export function useAdaptiveLoading<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = [],
  options: UseAdaptiveLoadingOptions = {}
): UseAdaptiveLoadingResult<T> {
  const { thresholdMs = 250, autoFetch = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(autoFetch);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const execute = useCallback(async (): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    // Check Network Information API (Chrome, Edge, Android)
    const nav = typeof navigator !== "undefined" ? (navigator as any) : null;
    const conn = nav?.connection || nav?.mozConnection || nav?.webkitConnection;
    const isSlowNetwork =
      conn &&
      (conn.saveData ||
        conn.effectiveType === "slow-2g" ||
        conn.effectiveType === "2g" ||
        conn.effectiveType === "3g");

    let timerId: ReturnType<typeof setTimeout> | null = null;

    if (isSlowNetwork) {
      setShowSkeleton(true);
    } else {
      setShowSkeleton(false);
      timerId = setTimeout(() => {
        setShowSkeleton(true);
      }, thresholdMs);
    }

    try {
      const result = await fetcherRef.current();
      setData(result);
      setIsLoading(false);
      setShowSkeleton(false);
      return result;
    } catch (err: any) {
      const errorObj = err instanceof Error ? err : new Error(err?.message || "Failed to load data");
      setError(errorObj);
      setIsLoading(false);
      setShowSkeleton(false);
      return null;
    } finally {
      if (timerId !== null) {
        clearTimeout(timerId);
      }
    }
  }, [thresholdMs]);

  useEffect(() => {
    if (autoFetch) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, isLoading, showSkeleton, error, refetch: execute };
}
