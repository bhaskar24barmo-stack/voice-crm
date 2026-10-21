import { NextResponse } from "next/server";
import { SB_URL, SB_ANON, SITE_URL } from "@/lib/site";

export async function POST(req: Request, { params }: { params: { action: string } }) {
  const res = (body: object, status = 200) => NextResponse.json(body, { status });
  const a = params.action;
  if (a === "logout") { const r = res({ ok: true }); r.cookies.delete("vc_token"); return r; }
  if (!SB_URL || !SB_ANON) return res({ error: "Accounts aren’t available yet." }, 503);
  const b = await req.json().catch(() => null);
  const h = { apikey: SB_ANON, "Content-Type": "application/json" };
  const startSession = (token: string, maxAge: number) => {
    const out = res({ ok: true });
    out.cookies.set("vc_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge });
    return out;
  };

  // Google / magic-link sign-in lands on /auth/callback, which sends us the token to verify and store.
  if (a === "session") {
    const token = String(b?.access_token || "");
    const r = token ? await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` } }) : null;
    if (!r || !r.ok) return res({ error: "That sign-in link has expired. Please try again." }, 401);
    return startSession(token, Math.min(Number(b?.expires_in) || 3600, 604800));
  }

  const email = String(b?.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res({ error: "Enter a valid email address." }, 400);

  if (a === "magic") {
    const r = await fetch(`${SB_URL}/auth/v1/otp?redirect_to=${encodeURIComponent(`${SITE_URL}/auth/callback`)}`, { method: "POST", headers: h, body: JSON.stringify({ email, create_user: true }) });
    if (!r.ok) return res({ error: "Couldn’t send the link. Please try again in a minute." }, 400);
    return res({ ok: true, message: "Check your email. We sent you a sign-in link." });
  }

  const password = String(b?.password || "");
  if (password.length < 8) return res({ error: "Password must be at least 8 characters." }, 400);
  if (a === "signup") {
    const r = await fetch(`${SB_URL}/auth/v1/signup?redirect_to=${encodeURIComponent(`${SITE_URL}/auth/callback`)}`, { method: "POST", headers: h, body: JSON.stringify({ email, password, data: { name: String(b?.name || "").slice(0, 120) } }) });
    if (!r.ok) return res({ error: "Couldn’t create the account. The email may already be registered." }, 400);
    return res({ ok: true, message: "Check your email to confirm your account, then log in." });
  }
  if (a === "login") {
    const r = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, { method: "POST", headers: h, body: JSON.stringify({ email, password }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.access_token) return res({ error: "Incorrect email or password, or the email isn’t confirmed yet." }, 401);
    return startSession(j.access_token, Number(j.expires_in) || 3600);
  }
  return res({ error: "Not found" }, 404);
}
