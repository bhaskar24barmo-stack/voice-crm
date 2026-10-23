"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./client";

// Paged list loader with search/filter params. Stale responses are ignored when params change quickly.
export function useList<T>(resource: string, params: Record<string, string | undefined>, pageSize = 25) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const seq = useRef(0);
  const key = JSON.stringify(params);

  const fetchPage = useCallback(async (offset: number, append: boolean) => {
    const id = ++seq.current;
    setLoading(true); setError("");
    try {
      const sp = new URLSearchParams({ limit: String(pageSize), offset: String(offset) });
      for (const [k, v] of Object.entries(JSON.parse(key) as Record<string, string | undefined>)) if (v) sp.set(k, v);
      const j = await api<{ data: T[]; total: number | null }>(`/api/crm/${resource}?${sp}`);
      if (id !== seq.current) return;
      setItems((p) => (append ? [...p, ...j.data] : j.data));
      setTotal(j.total ?? j.data.length);
    } catch (e) { if (id === seq.current) setError(e instanceof Error ? e.message : "Couldn’t load this list."); }
    finally { if (id === seq.current) setLoading(false); }
  }, [resource, key, pageSize]);

  useEffect(() => { fetchPage(0, false); }, [fetchPage]);
  return { items, total, loading, error, hasMore: items.length < total, reload: () => fetchPage(0, false), loadMore: () => fetchPage(items.length, true), setItems };
}

export function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}
