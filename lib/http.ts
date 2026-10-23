import { NextResponse } from "next/server";
import { getAuth, sbRequest, type SbResponse } from "./supabase";

export const err = (message: string, status = 400) => NextResponse.json({ error: message }, { status });
export const ok = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

// Blocks cross-site form posts. Browsers always send Origin on POST/PATCH/DELETE; non-browser clients have no cookie anyway.
export function sameOrigin(req: Request) {
  const o = req.headers.get("origin");
  if (!o) return true;
  try { return new URL(o).host === req.headers.get("host"); } catch { return false; }
}

export async function guard(req: Request, write: boolean) {
  if (write && !sameOrigin(req)) return { res: err("Request blocked.", 403) };
  const auth = await getAuth();
  if (!auth) return { res: err("Please log in again.", 401) };
  return { auth };
}

export async function readJson(req: Request, maxBytes = 64_000): Promise<{ data: unknown } | { error: string; status: number }> {
  if (Number(req.headers.get("content-length") || 0) > maxBytes) return { error: "That request is too large.", status: 413 };
  const text = await req.text();
  if (text.length > maxBytes) return { error: "That request is too large.", status: 413 };
  try { return { data: JSON.parse(text) }; } catch { return { error: "Invalid JSON.", status: 400 }; }
}

export function dbFail(r: Pick<SbResponse<unknown>, "status" | "code">): { status: number; message: string } {
  if (r.status === 0) return { status: 503, message: "The database couldn’t be reached. Please try again." };
  if (r.code === "42P01" || r.code === "PGRST205" || r.code === "PGRST200") return { status: 503, message: "The CRM database isn’t set up yet. Run supabase/crm-schema.sql in Supabase." };
  if (r.status === 401 || r.code === "PGRST301") return { status: 401, message: "Please log in again." };
  if (r.code === "23503") return { status: 400, message: "The linked contact or lead no longer exists." };
  if (r.code === "42501" || r.status === 403) return { status: 403, message: "You don’t have access to that." };
  if (r.code && /^(22|23)/.test(r.code)) return { status: 400, message: "Some of those values aren’t valid." };
  return { status: 500, message: "Something went wrong. Please try again." };
}
export const dbError = (r: Pick<SbResponse<unknown>, "status" | "code">) => { const f = dbFail(r); return err(f.message, f.status); };

// Per-user limit on costly calls (AI, transcription), stored in ai_usage so it works across serverless instances.
export async function rateLimit(token: string, kind: "ai" | "stt", max: number, windowMin: number) {
  const since = new Date(Date.now() - windowMin * 60_000).toISOString();
  const c = await sbRequest(token, `ai_usage?select=id&kind=eq.${kind}&created_at=gte.${encodeURIComponent(since)}&limit=1`, { count: true });
  if (!c.ok) return dbError(c);
  if ((c.count ?? 0) >= max) return err(`You’ve reached the limit of ${max} requests per ${windowMin} minutes. Please wait a little and try again.`, 429);
  await sbRequest(token, "ai_usage", { method: "POST", body: { kind } });
  return null;
}
