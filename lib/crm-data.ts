import { STAGES, STAGE_LABEL, type Stage } from "./crm-types";
import { sbQuery } from "./supabase";

export { STAGES, STAGE_LABEL };
export type TaskRow = { id: string; title: string; due_date: string | null; priority: string };
export type ActivityRow = { id: string; type: string; summary: string; occurred_at: string };
export type CallRow = { id: string; summary: string | null; occurred_at: string };

export type Dashboard = {
  setupNeeded: boolean; // true when the CRM tables can't be read (schema not applied yet, or Supabase unavailable)
  contacts: number; activeLeads: number; openTasks: number; overdue: number; upcoming: number;
  pipeline: Record<Stage, number>;
  followUps: TaskRow[]; activities: ActivityRow[]; calls: CallRow[];
};

// Everything here comes from the signed-in user's own rows (RLS). Nothing is invented: a failed read shows "not set up", never zeros.
export async function getDashboard(token: string): Promise<Dashboard> {
  const today = new Date().toISOString().slice(0, 10);
  const [contacts, active, open, overdue, upcoming, leads, followUps, activities, calls] = await Promise.all([
    sbQuery(token, "contacts?select=id&limit=1", { count: true }),
    sbQuery(token, "leads?select=id&status=not.in.(won,lost)&limit=1", { count: true }),
    sbQuery(token, "tasks?select=id&done=eq.false&limit=1", { count: true }),
    sbQuery(token, `tasks?select=id&done=eq.false&due_date=lt.${today}&limit=1`, { count: true }),
    sbQuery(token, `tasks?select=id&done=eq.false&due_date=gte.${today}&limit=1`, { count: true }),
    sbQuery<{ status: Stage }[]>(token, "leads?select=status&limit=1000"),
    sbQuery<TaskRow[]>(token, `tasks?select=id,title,due_date,priority&done=eq.false&due_date=not.is.null&order=due_date.asc&limit=5`),
    sbQuery<ActivityRow[]>(token, "activities?select=id,type,summary,occurred_at&order=occurred_at.desc&limit=5"),
    sbQuery<CallRow[]>(token, "calls?select=id,summary,occurred_at&order=occurred_at.desc&limit=3"),
  ]);
  const pipeline = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<Stage, number>;
  for (const l of leads.data ?? []) if (l.status in pipeline) pipeline[l.status]++;
  return {
    setupNeeded: ![contacts, active, open, leads].every((r) => r.ok),
    contacts: contacts.count ?? 0, activeLeads: active.count ?? 0, openTasks: open.count ?? 0, overdue: overdue.count ?? 0, upcoming: upcoming.count ?? 0,
    pipeline, followUps: followUps.data ?? [], activities: activities.data ?? [], calls: calls.data ?? [],
  };
}
