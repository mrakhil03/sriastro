import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError, toApiError } from './api';

export function useDebounce<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

/** Minimal GET hook: keeps previous data while refetching, ignores stale responses. */
export function useApi<T>(url: string, params?: Record<string, unknown>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const key = url + JSON.stringify(params ?? {});
  const latest = useRef(0);

  useEffect(() => {
    const id = ++latest.current;
    const ctrl = new AbortController();
    setLoading(true);
    api.get<T>(url, { params, signal: ctrl.signal })
      .then((r) => { if (id === latest.current) { setData(r.data); setError(null); } })
      .catch((e) => { if (id === latest.current && e?.code !== 'ERR_CANCELED') setError(toApiError(e)); })
      .finally(() => { if (id === latest.current) setLoading(false); });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload };
}
