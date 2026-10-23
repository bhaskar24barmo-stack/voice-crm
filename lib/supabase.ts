import { cache } from "react";
import { cookies } from "next/headers";
import { SB_URL, SB_ANON } from "./site";

export type SbUser = { id: string; email?: string; user_metadata?: { name?: string; full_name?: string } };

// Verifies the vc_token cookie with Supabase. Cached per request, so layouts and pages can both call it.
export const getAuth = cache(async (): Promise<{ token: string; user: SbUser } | null> => {
  const token = cookies().get("vc_token")?.value;
  if (!token || !SB_URL || !SB_ANON) return null;
  try {
    const r = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!r.ok) return null;
    return { token, user: (await r.json()) as SbUser };
  } catch { return null; }
});

export type SbResult<T> = { ok: boolean; data: T | null; count: number | null; status: number };

// Queries Supabase's REST API as the signed-in user, so Row Level Security applies to every request.
export async function sbQuery<T = unknown>(token: string, path: string, opts: { count?: boolean } = {}): Promise<SbResult<T>> {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
      headers: { apikey: SB_ANON, Authorization: `Bearer ${token}`, ...(opts.count ? { Prefer: "count=exact" } : {}) },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const range = r.headers.get("content-range"); // e.g. "0-4/12" or "*/0"
    const total = range?.split("/")[1];
    const count = total && total !== "*" ? Number(total) : null;
    const data = r.ok ? ((await r.json().catch(() => null)) as T | null) : null;
    return { ok: r.ok, data, count, status: r.status };
  } catch { return { ok: false, data: null, count: null, status: 0 }; }
}

export type SbResponse<T> = { ok: boolean; status: number; data: T | null; count: number | null; code?: string; message?: string };

// General REST call as the signed-in user (RLS applies). Used for creates, updates and deletes.
export async function sbRequest<T = any>(token: string, path: string, o: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown; count?: boolean; timeoutMs?: number } = {}): Promise<SbResponse<T>> {
  const method = o.method ?? "GET";
  const prefer = [method !== "GET" ? "return=representation" : "", o.count ? "count=exact" : ""].filter(Boolean).join(",");
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
      method,
      headers: { apikey: SB_ANON, Authorization: `Bearer ${token}`, ...(o.body !== undefined ? { "Content-Type": "application/json" } : {}), ...(prefer ? { Prefer: prefer } : {}) },
      body: o.body !== undefined ? JSON.stringify(o.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(o.timeoutMs ?? 10000),
    });
    const total = r.headers.get("content-range")?.split("/")[1];
    const json = await r.json().catch(() => null);
    if (!r.ok) return { ok: false, status: r.status, data: null, count: null, code: json?.code, message: json?.message };
    return { ok: true, status: r.status, data: json as T, count: total && total !== "*" ? Number(total) : null };
  } catch { return { ok: false, status: 0, data: null, count: null }; }
}
