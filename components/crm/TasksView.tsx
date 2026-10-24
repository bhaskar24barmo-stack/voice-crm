"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckSquare, Plus } from "lucide-react";
import { api, fmtDate, today } from "@/lib/client";
import { haptic } from "@/lib/haptic";
import { SwipeRow, burst } from "./fx";
import { useList } from "@/lib/hooks";
import type { Task } from "@/lib/crm-types";
import { Badge, Confirm, ErrorNote, PageHeader, Spinner, Tabs, btnP, btnS, useToast } from "./ui";
import { TaskFormModal } from "./forms";

const VIEWS: [string, string][] = [["open", "Open"], ["overdue", "Overdue"], ["upcoming", "Upcoming"], ["done", "Completed"], ["all", "All"]];
const tone = (p: string) => (p === "high" ? "red" : p === "low" ? "gray" : "amber") as "red" | "gray" | "amber";

export default function TasksView({ openNew }: { openNew: boolean }) {
  const [view, setView] = useState("open");
  const t0 = today();
  const list = useList<Task>("tasks", { view: view === "all" ? undefined : view, today: t0 });
  const [form, setForm] = useState<Task | "new" | null>(openNew ? "new" : null);
  const [del, setDel] = useState<Task | null>(null);
  const toast = useToast();

  async function toggle(t: Task, x?: number, y?: number) {
    if (!t.done) { haptic([12, 40, 12]); if (x != null && y != null) burst(x, y); }
    try { await api(`/api/crm/tasks/${t.id}`, { method: "PATCH", body: { done: !t.done } }); toast(t.done ? "Task reopened." : "Task completed."); list.reload(); }
    catch (e) { toast(e instanceof Error ? e.message : "Couldn’t update the task.", "err"); }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Tasks" desc="Follow-ups and to-dos, linked to the people and deals they belong to." action={<button className={btnP} onClick={() => setForm("new")}><Plus size={16} aria-hidden />Create task</button>} />
      <div className="mb-4"><Tabs label="Task filter" tabs={VIEWS} value={view} onChange={setView} /><p className="mt-2 text-xs text-ink/50 lg:hidden">Tip: swipe a task right to complete it.</p></div>
      {list.error && <ErrorNote message={list.error} onRetry={list.reload} />}
      {list.loading && !list.items.length && <Spinner label="Loading tasks" />}
      {!list.loading && !list.error && !list.items.length && (
        <div className="rounded-2xl border border-dashed border-ink/20 bg-white p-10 text-center">
          <CheckSquare className="mx-auto text-ink/30" size={32} aria-hidden />
          <h2 className="mt-3 font-serif text-xl font-semibold">{view === "overdue" ? "Nothing overdue" : view === "done" ? "No completed tasks yet" : "No tasks here"}</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink/65">{view === "overdue" ? "You’re on top of your follow-ups." : "Create a task with a due date to see it in your follow-ups."}</p>
          <button className={`${btnP} mt-4`} onClick={() => setForm("new")}><Plus size={16} aria-hidden />Create task</button>
        </div>
      )}
      {list.items.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {list.items.map((t, i) => {
            const overdue = !t.done && t.due_date && t.due_date < t0;
            return (
              <li key={t.id} className="rise" style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}>
              <SwipeRow disabled={t.done} onSwipe={() => toggle(t, window.innerWidth / 2, window.innerHeight / 2)}>
              <div className="flex items-start gap-1 p-2 pr-4">
                <label className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center"><input type="checkbox" checked={t.done} onChange={(e) => { const r = e.currentTarget.getBoundingClientRect(); toggle(t, r.left + r.width / 2, r.top + r.height / 2); }} aria-label={`${t.done ? "Reopen" : "Complete"} ${t.title}`} className="h-5 w-5 accent-[#C2501A]" /></label>
                <div className="min-w-0 flex-1 py-2.5">
                  <button onClick={() => setForm(t)} className={`text-left text-sm font-medium hover:text-accent ${t.done ? "text-ink/45 line-through" : ""}`}>{t.title}</button>
                  {t.description && <p className="mt-0.5 line-clamp-2 text-sm text-ink/65">{t.description}</p>}
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/60">
                    {t.due_date && <span className={overdue ? "font-medium text-red-700" : ""}>{overdue ? "Overdue · " : "Due "}{fmtDate(t.due_date)}</span>}
                    <Badge tone={tone(t.priority)}>{t.priority}</Badge>
                    {t.contact && <Link href={`/account/contacts/${t.contact.id}`} className="hover:text-accent">{t.contact.name}</Link>}
                    {t.lead && <span>Lead: {t.lead.title}</span>}
                  </p>
                </div>
              </div>
              </SwipeRow>
              </li>
            );
          })}
        </ul>
      )}
      {list.hasMore && <div className="mt-4 text-center"><button className={btnS} disabled={list.loading} onClick={list.loadMore}>Load more</button></div>}

      {form && <TaskFormModal task={form === "new" ? null : form} onDelete={() => { if (form !== "new") { setDel(form); setForm(null); } }} onClose={() => setForm(null)} onSaved={list.reload} />}
      {del && <Confirm title="Delete task?" message={`“${del.title}” will be permanently deleted.`} onCancel={() => setDel(null)} onConfirm={async () => { await api(`/api/crm/tasks/${del.id}`, { method: "DELETE" }); toast("Task deleted."); setDel(null); list.reload(); }} />}
    </div>
  );
}
