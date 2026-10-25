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

// Today's date in the visitor's time zone (Vercel sends it in a header); falls back to UTC.
export function localToday(tz?: string | null) {
  try { if (tz) return new Date().toLocaleDateString("en-CA", { timeZone: tz }); } catch { /* unknown zone */ }
  return new Date().toISOString().slice(0, 10);
}

// Everything comes from the signed-in user's own rows (RLS). Five parallel reads; counts are worked out from the rows already fetched.
export async function getDashboard(token: string, today: string): Promise<Dashboard> {
  const [contacts, leads, tasks, activities, calls] = await Promise.all([
    sbQuery(token, "contacts?select=id&limit=1", { count: true }),
    sbQuery<{ status: Stage }[]>(token, "leads?select=status&limit=1000"),
    sbQuery<TaskRow[]>(token, "tasks?select=id,title,due_date,priority&done=eq.false&order=due_date.asc.nullslast&limit=500", { count: true }),
    sbQuery<ActivityRow[]>(token, "activities?select=id,type,summary,occurred_at&order=occurred_at.desc&limit=5"),
    sbQuery<CallRow[]>(token, "calls?select=id,summary,occurred_at&order=occurred_at.desc&limit=3"),
  ]);
  const pipeline = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<Stage, number>;
  for (const l of leads.data ?? []) if (l.status in pipeline) pipeline[l.status]++;
  const open = tasks.data ?? [];
  const dated = open.filter((t) => t.due_date);
  return {
    setupNeeded: ![contacts, leads, tasks].every((r) => r.ok),
    contacts: contacts.count ?? 0,
    activeLeads: STAGES.filter((s) => s !== "won" && s !== "lost").reduce((a, s) => a + pipeline[s], 0),
    openTasks: tasks.count ?? open.length,
    overdue: dated.filter((t) => (t.due_date as string) < today).length,
    upcoming: dated.filter((t) => (t.due_date as string) >= today).length,
    pipeline, followUps: dated.slice(0, 5), activities: activities.data ?? [], calls: calls.data ?? [],
  };
}
