import { aiConfigured } from "@/lib/config";
import { capturePrompt, parseItems, type Item } from "@/lib/capture";
import { RESOURCES } from "@/lib/crm-config";
import { dbError, err, guard, ok, rateLimit, readJson } from "@/lib/http";
import { chat } from "@/lib/openrouter";
import { sbRequest } from "@/lib/supabase";
import { isDate, parse } from "@/lib/validate";

export const maxDuration = 45;

type Created = { kind: string; resource: "activities" | "tasks" | "contacts"; id: string; title: string; due_date: string | null; contact: string | null };

// One call turns a spoken or typed note into saved records (notes, tasks, expenses, contacts).
export async function POST(req: Request) {
  const g = await guard(req, true);
  if ("res" in g) return g.res;
  const body = await readJson(req, 20_000);
  if ("error" in body) return err(body.error, body.status);
  const b = (body.data ?? {}) as Record<string, unknown>;
  const text = typeof b.text === "string" ? b.text.trim() : "";
  if (!text) return err("Say or type something first.", 400);
  if (text.length > 4000) return err("That’s a bit long. Try saying it in smaller parts.", 400);
  const today = isDate(b.today) ? (b.today as string) : new Date().toISOString().slice(0, 10);
  const token = g.auth.token;

  let items: Item[];
  if (b.mode !== "note" && aiConfigured()) {
    const limited = await rateLimit(token, "ai", 30, 10);
    if (limited) return limited;
    const p = capturePrompt(text, today);
    const r = await chat([{ role: "system", content: p.system }, { role: "user", content: p.user }], { maxTokens: 900 });
    if (!r.ok) return err(r.error, r.status);
    const parsed = parseItems(r.text);
    if (!parsed) return err("I couldn’t make sense of that. Try again, or say it a little differently.", 502);
    items = parsed;
  } else {
    // No AI (or the user chose "save as note"): keep their words as a single note, never lose them.
    items = [{ kind: "note", title: text.slice(0, 160), details: text.length > 160 ? text : null, due_date: null, amount: null, contact_name: null, company: null, priority: "medium" }];
  }

  const names = new Map<string, string | null>(); // lower-case name -> contact id
  const clean = (s: string) => s.replace(/[,()*%\\"':]/g, " ").trim().slice(0, 80);
  async function findContact(name: string) {
    const key = name.toLowerCase();
    if (names.has(key)) return names.get(key) ?? null;
    let id: string | null = null;
    const safe = clean(name);
    if (safe) {
      const r = await sbRequest<{ id: string; name: string }[]>(token, `contacts?select=id,name&name=ilike.${encodeURIComponent(`*${safe}*`)}&limit=5`);
      if (r.ok && r.data) id = r.data.find((c) => c.name.toLowerCase() === key)?.id ?? (r.data.length === 1 ? r.data[0].id : null);
    }
    names.set(key, id);
    return id;
  }

  const created: Created[] = [];
  let skipped = 0;
  async function save(resource: Created["resource"], row: Record<string, unknown>, it: Item, linked: string | null) {
    const p = parse(RESOURCES[resource].fields, row, false);
    if ("error" in p) { skipped++; return; }
    const r = await sbRequest<{ id: string }[]>(token, resource, { method: "POST", body: p.data });
    if (!r.ok) { if (!created.length && skipped === 0 && r.code) return dbError(r); skipped++; return; }
    created.push({ kind: it.kind, resource, id: r.data![0].id, title: it.title, due_date: it.due_date, contact: linked });
  }

  const ordered = [...items.filter((i) => i.kind === "contact"), ...items.filter((i) => i.kind !== "contact")];
  for (const it of ordered) {
    let fail: Response | undefined | void;
    if (it.kind === "contact") {
      const name = it.contact_name || it.title;
      if (await findContact(name)) continue; // already in the CRM: don't duplicate
      fail = await save("contacts", { name, company: it.company, notes: it.details, status: "lead" }, it, name);
      const made = created.find((c) => c.resource === "contacts" && c.title === it.title);
      if (made) names.set(name.toLowerCase(), made.id);
    } else {
      const cid = it.contact_name ? await findContact(it.contact_name) : null;
      const linked = cid ? it.contact_name : null;
      const at = it.due_date ? `${it.due_date}T12:00:00.000Z` : undefined;
      if (it.kind === "task" || it.kind === "meeting") fail = await save("tasks", { title: it.title, description: it.details, due_date: it.due_date, priority: it.priority, contact_id: cid }, it, linked);
      else if (it.kind === "expense") fail = await save("activities", { type: "note", summary: `Expense${it.amount != null ? ` ${it.amount}` : ""}: ${it.title}`.slice(0, 2000), details: it.details, occurred_at: at, contact_id: cid }, it, linked);
      else fail = await save("activities", { type: "note", summary: it.title, details: it.details, occurred_at: at, contact_id: cid }, it, linked);
    }
    if (fail) return fail;
  }
  return ok({ created, skipped, transcript: text }, 201);
}
