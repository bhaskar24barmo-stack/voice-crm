import { NextRequest, NextResponse } from "next/server";

// Keeps CRM sessions alive and keeps signed-out visitors out of /account.
// Supabase access tokens last about an hour; here we swap in a fresh one using the refresh cookie before it expires.
const SB_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const SB_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "";

function expiry(token: string) {
  try { return Number(JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).exp) || 0; } catch { return 0; }
}
const opts = (maxAge: number) => ({ httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge });

export async function middleware(req: NextRequest) {
  const isPage = req.nextUrl.pathname.startsWith("/account");
  const token = req.cookies.get("vc_token")?.value;
  const refresh = req.cookies.get("vc_refresh")?.value;
  const signedOut = () => { const r = isPage ? NextResponse.redirect(new URL("/login", req.url)) : NextResponse.next(); r.cookies.delete("vc_token"); r.cookies.delete("vc_refresh"); return r; };

  if (!token && !refresh) return isPage ? NextResponse.redirect(new URL("/login", req.url)) : NextResponse.next();

  const stale = !token || expiry(token) < Math.floor(Date.now() / 1000) + 60;
  if (stale && refresh && SB_URL && SB_ANON) {
    try {
      const r = await fetch(`${SB_URL}/auth/v1/token?grant_type=refresh_token`, { method: "POST", headers: { apikey: SB_ANON, "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: refresh }), signal: AbortSignal.timeout(5000) });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.access_token) {
        req.cookies.set("vc_token", j.access_token); // so the page or API route handling this same request sees the new token
        if (j.refresh_token) req.cookies.set("vc_refresh", j.refresh_token);
        const res = NextResponse.next({ request: { headers: req.headers } });
        res.cookies.set("vc_token", j.access_token, opts(60 * 60 * 24 * 7));
        if (j.refresh_token) res.cookies.set("vc_refresh", j.refresh_token, opts(60 * 60 * 24 * 30));
        return res;
      }
      if (r.status >= 400 && r.status < 500) return signedOut(); // refresh token revoked or expired
    } catch { /* Supabase unreachable: fall through and let the request fail normally */ }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/account/:path*", "/api/crm/:path*", "/api/ai", "/api/voice/:path*", "/api/account"] };
