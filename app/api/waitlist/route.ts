import { NextResponse } from "next/server";
import { SB_URL, SB_SERVICE } from "@/lib/site";

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const name = String(b?.name || "").trim().slice(0, 120);
  const email = String(b?.email || "").trim().toLowerCase().slice(0, 200);
  if (b?.website) return NextResponse.json({ ok: true }); // honeypot: bots fill this hidden field
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Please enter your name and a valid email." }, { status: 400 });
  const hook = process.env.WAITLIST_WEBHOOK_URL;
  try {
    if (SB_URL && SB_SERVICE) {
      const r = await fetch(`${SB_URL}/rest/v1/waitlist`, { method: "POST", headers: { apikey: SB_SERVICE, ...(SB_SERVICE.startsWith("sb_") ? {} : { Authorization: `Bearer ${SB_SERVICE}` }), "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ name, email }) });
      if (r.ok || r.status === 409) return NextResponse.json({ ok: true }); // 409 = already on the list
      throw new Error(`supabase ${r.status}`);
    }
    if (hook) {
      const r = await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, at: new Date().toISOString() }) });
      if (r.ok) return NextResponse.json({ ok: true });
      throw new Error(`webhook ${r.status}`);
    }
  } catch (e) { console.error("waitlist failed", e); return NextResponse.json({ error: "Something went wrong. Please try again in a moment." }, { status: 502 }); }
  return NextResponse.json({ error: "The waitlist isn’t connected yet. Please try again soon." }, { status: 503 });
}
