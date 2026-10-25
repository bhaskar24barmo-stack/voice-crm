"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./client";

// Paged list loader with search/filter params. Stale responses are ignored when params change quickly.
// Remembers each list while the tab is open, so going back to a page shows it instantly while fresh data loads.
const cache = new Map<string, { items: unknown[]; total: number }>();

export function useList<T>(resource: string, params: Record<string, string | undefined>, pageSize = 25) {
  const key = JSON.stringify(params);
  const ck = `${resource}|${pageSize}|${key}`;
  const [items, setItems] = useState<T[]>(() => (cache.get(ck)?.items as T[] | undefined) ?? []);
  const [total, setTotal] = useState(() => cache.get(ck)?.total ?? 0);
  const [loading, setLoading] = useState(() => !cache.has(ck));
  const [error, setError] = useState("");
  const seq = useRef(0);

  const remember = (list: unknown[], t: number) => {
    cache.delete(ck); cache.set(ck, { items: list, total: t });
    if (cache.size > 40) cache.delete(cache.keys().next().value as string);
  };

  const fetchPage = useCallback(async (offset: number, append: boolean) => {
    const id = ++seq.current;
    setError("");
    const hit = append ? undefined : cache.get(ck);
    if (hit) { setItems(hit.items as T[]); setTotal(hit.total); setLoading(false); } else setLoading(true);
    try {
      const sp = new URLSearchParams({ limit: String(pageSize), offset: String(offset) });
      for (const [k, v] of Object.entries(JSON.parse(key) as Record<string, string | undefined>)) if (v) sp.set(k, v);
      const j = await api<{ data: T[]; total: number | null }>(`/api/crm/${resource}?${sp}`);
      if (id !== seq.current) return;
      const t = j.total ?? j.data.length;
      setItems((p) => { const n = append ? [...p, ...j.data] : j.data; remember(n, t); return n; });
      setTotal(t);
    } catch (e) { if (id === seq.current) setError(e instanceof Error ? e.message : "Couldn’t load this list."); }
    finally { if (id === seq.current) setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource, key, pageSize]);

  useEffect(() => { fetchPage(0, false); }, [fetchPage]);
  const update = (v: T[]) => { setItems(v); remember(v, total); };
  return { items, total, loading, error, hasMore: items.length < total, reload: () => fetchPage(0, false), loadMore: () => fetchPage(items.length, true), setItems: update };
}

export function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}
