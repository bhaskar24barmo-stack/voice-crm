// Browser helpers: one fetch wrapper for every CRM call, plus small date helpers.
export async function api<T = any>(path: string, init: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  const r = await fetch(path, {
    method: init.method ?? (init.body !== undefined || init.form ? "POST" : "GET"),
    headers: init.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init.form ?? (init.body !== undefined ? JSON.stringify(init.body) : undefined),
  });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401) { window.location.href = "/login"; throw new Error("Please log in again."); }
  if (!r.ok) throw new Error(j.error || "Something went wrong. Please try again.");
  return j as T;
}
const pad = (n: number) => String(n).padStart(2, "0");
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
export const toLocalInput = (iso?: string | null) => { const d = iso ? new Date(iso) : new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
export const fromLocalInput = (v: string) => new Date(v).toISOString();
export const fmtDate = (s?: string | null) => (s ? new Date(s.length === 10 ? `${s}T00:00:00` : s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "");
export const fmtDateTime = (s: string) => new Date(s).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
export const money = (n: number | null | undefined) => (n == null ? "" : new Intl.NumberFormat(undefined, { style: "currency", currency: process.env.NEXT_PUBLIC_CURRENCY || "USD", maximumFractionDigits: 0 }).format(n));
