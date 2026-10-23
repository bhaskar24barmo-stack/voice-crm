import { RESOURCES } from "@/lib/crm-config";
import { dbError, err, guard, ok, readJson } from "@/lib/http";
import { sbRequest } from "@/lib/supabase";
import { parse } from "@/lib/validate";

// Saves a reviewed call (notes, summary, optional transcript) and the follow-up tasks the user approved.
export async function POST(req: Request) {
  const g = await guard(req, true);
  if ("res" in g) return g.res;
  const body = await readJson(req, 120_000);
  if ("error" in body) return err(body.error, body.status);
  const b = (body.data ?? {}) as Record<string, unknown>;

  const call = parse(RESOURCES.calls.fields, b, false);
  if ("error" in call) return err(call.error, 400);
  if (!call.data.summary && !call.data.notes && !call.data.transcript) return err("Add a summary or notes before saving the call.", 400);

  const rawTasks = Array.isArray(b.tasks) ? b.tasks.slice(0, 10) : [];
  const tasks: Record<string, unknown>[] = [];
  for (const t of rawTasks) {
    const p = parse(RESOURCES.tasks.fields, { title: (t as any)?.title, due_date: (t as any)?.due_date, priority: (t as any)?.priority, contact_id: call.data.contact_id }, false);
    if ("error" in p) return err(p.error, 400);
    tasks.push({ title: p.data.title, due_date: p.data.due_date ?? null, priority: p.data.priority ?? "medium", contact_id: p.data.contact_id ?? null }); // same keys on every row for the bulk insert
  }

  const c = await sbRequest<{ id: string }[]>(g.auth.token, "calls", { method: "POST", body: call.data });
  if (!c.ok) return dbError(c);
  let created = 0;
  if (tasks.length) {
    const t = await sbRequest<unknown[]>(g.auth.token, "tasks", { method: "POST", body: tasks });
    if (!t.ok) return ok({ callId: c.data?.[0]?.id, tasksCreated: 0, warning: "The call was saved, but the tasks couldn’t be created. You can add them from the Tasks page." }, 207);
    created = t.data?.length ?? 0;
  }
  return ok({ callId: c.data?.[0]?.id, tasksCreated: created }, 201);
}
