import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Action, Stage } from "../../../lib/crm";

export const runtime = "nodejs";
const STAGES = ["New", "Contacted", "Proposal", "Won"];
const SYSTEM = `You are the assistant inside Voice CRM, a CRM for salespeople. Turn the user's message into a short reply plus proposed CRM actions.
Respond with ONLY a JSON object: {"reply": string, "actions": Action[]}.
Action is one of:
{"kind":"contact","name":string,"company":string,"interest":string}
{"kind":"task","title":string,"due":string}
{"kind":"move","name":string,"stage":"New"|"Contacted"|"Proposal"|"Won"}
{"kind":"note","name":string,"text":string}
Rules: propose only what the user asked for or clearly implied. Never invent people, companies or facts. "due" is a short label such as Today, Tomorrow or a weekday name, resolved from today's date. "move" and "note" must use a name from the contacts list. If unsure, ask one short question in "reply" and return no actions. Keep "reply" under 40 words.`;
const EMAIL = `You write short, warm, professional sales follow-up emails: a Subject line, then under 90 words. Use only the facts given. Do not invent details, prices or dates. Respond with ONLY a JSON object: {"reply": string}.`;

const s = (v: unknown, n = 120) => String(v ?? "").trim().slice(0, n);
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const isStage = (v: unknown): v is Stage => typeof v === "string" && STAGES.includes(v);
const hits = new Map<string, number[]>(); // best-effort per-instance limit; use Upstash/Redis for a hard limit

async function userId(): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return "demo";
  const store = cookies();
  const sb = createServerClient(url, key, { cookies: { getAll: () => store.getAll(), setAll: () => {} } });
  const { data } = await sb.auth.getUser();
  return data.user?.id ?? null;
}

export async function POST(req: Request) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const now = Date.now();
  const recent = (hits.get(uid) ?? []).filter((t) => now - t < 60000);
  if (recent.length >= 20) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  hits.set(uid, [...recent, now]);

  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return NextResponse.json({ error: "no_key" }, { status: 503 });

  let body: { mode?: string; text?: string; today?: string; contacts?: { name: string; company: string; stage: string; interest: string }[]; tasks?: { title: string; due: string; done: boolean }[] };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  const text = s(body.text, 1000);
  if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });

  const contacts = (body.contacts ?? []).slice(0, 100).map((c) => ({ name: s(c.name, 60), company: s(c.company, 60), stage: s(c.stage, 20), interest: s(c.interest, 30) }));
  const open = (body.tasks ?? []).filter((t) => !t.done).slice(0, 50).map((t) => `${s(t.title, 80)} (${s(t.due, 20)})`);
  const email = body.mode === "email";
  const target = contacts.find((c) => c.name === text);
  if (email && !target) return NextResponse.json({ error: "unknown_contact" }, { status: 400 });

  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Title": "Voice CRM" },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "openrouter/auto", temperature: 0.2, max_tokens: 600,
      messages: [
        { role: "system", content: email ? EMAIL : SYSTEM },
        { role: "user", content: email
          ? `Today is ${s(body.today, 40)}.\nContact: ${JSON.stringify(target)}\nOpen tasks: ${open.join("; ") || "none"}\nWrite the follow-up email.`
          : `Today is ${s(body.today, 40)}.\nContacts: ${JSON.stringify(contacts)}\nOpen tasks: ${open.join("; ") || "none"}\nUser message: ${text}` },
      ],
    }),
  }).catch(() => null);
  if (!r || !r.ok) return NextResponse.json({ error: "upstream" }, { status: 502 });

  const raw: string = (await r.json())?.choices?.[0]?.message?.content ?? "";
  const m = raw.match(/\{[\s\S]*\}/);
  let parsed: { reply?: unknown; actions?: unknown[] } = {};
  try { parsed = m ? JSON.parse(m[0]) : {}; } catch { /* handled below */ }
  if (!parsed.reply) return NextResponse.json({ error: "bad_model_output" }, { status: 502 });
  if (email) return NextResponse.json({ reply: s(parsed.reply, 1500), actions: [] });

  const known = new Set(contacts.map((c) => c.name));
  const actions = (Array.isArray(parsed.actions) ? parsed.actions : []).slice(0, 5).flatMap((value): Action[] => {
    if (!isRecord(value)) return [];
    const a = value;
    if (a?.kind === "contact" && s(a.name)) return [{ kind: "contact", name: s(a.name, 60), company: s(a.company, 60), interest: s(a.interest, 30) }];
    if (a?.kind === "task" && s(a.title)) return [{ kind: "task", title: s(a.title, 100), due: s(a.due, 20) || "This week" }];
    if (a?.kind === "move" && known.has(s(a.name)) && isStage(a.stage)) return [{ kind: "move", name: s(a.name), stage: a.stage }];
    if (a?.kind === "note" && known.has(s(a.name)) && s(a.text)) return [{ kind: "note", name: s(a.name), text: s(a.text, 200) }];
    return [];
  });
  return NextResponse.json({ reply: s(parsed.reply, 400), actions });
}
