import Link from "next/link";
import { redirect } from "next/navigation";
import { UserPlus, ListPlus, Sparkles, Database, AudioLines } from "lucide-react";
import { getAuth } from "@/lib/supabase";
import { getDashboard, STAGES, STAGE_LABEL } from "@/lib/crm-data";
import { Card, Stat, Empty } from "@/components/crm/kit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard — Voice CRM", robots: { index: false } };

const fmt = (d: string) => new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString("en", { month: "short", day: "numeric" });

export default async function Dashboard() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  const d = await getDashboard(auth.token);
  const m = auth.user.user_metadata;
  const first = (m?.name || m?.full_name || "").split(" ")[0];
  const noData = !d.setupNeeded && d.contacts + d.activeLeads + d.openTasks === 0 && d.activities.length === 0 && d.calls.length === 0;
  const maxStage = Math.max(1, ...STAGES.map((s) => d.pipeline[s]));
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-6xl">
      <section className="rounded-3xl border border-line bg-gradient-to-br from-accent/10 via-white to-white p-6 sm:p-8">
        <p className="text-sm text-ink/60">{new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold sm:text-4xl">{first ? `Hi ${first}, let’s get to it` : "Let’s get to it"}</h1>
        {!d.setupNeeded && <p className="mt-2 max-w-prose text-ink/70">{d.overdue ? `${d.overdue} follow-up${d.overdue === 1 ? " is" : "s are"} overdue. Start there.` : d.openTasks ? `You have ${d.openTasks} open task${d.openTasks === 1 ? "" : "s"}. Nothing is overdue.` : "You’re all caught up. Add a contact or log a call to keep things moving."}</p>}
      </section>

      {d.setupNeeded && (
        <div role="status" className="mt-6 flex gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-5">
          <Database className="mt-0.5 shrink-0 text-accent" size={20} aria-hidden />
          <div className="text-sm"><p className="font-medium">Your CRM database isn’t set up yet.</p>
            <p className="mt-1 text-ink/70">Run <code className="rounded bg-ink/5 px-1">supabase/crm-schema.sql</code> in the Supabase SQL editor, then refresh this page. Until then the numbers stay hidden instead of showing zeros.</p></div>
        </div>
      )}

      {noData && (
        <div className="mt-6 rounded-2xl border border-line bg-white p-5">
          <h2 className="font-serif text-xl font-semibold">Start with your first contact</h2>
          <p className="mt-1 max-w-prose text-sm text-ink/70">Add the people you work with, log a call, and set a follow-up. This dashboard fills in from your own records as you go.</p>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["/account/contacts?new=1", UserPlus, "Add contact"], ["/account/tasks?new=1", ListPlus, "Create task"], ["/account/voice", AudioLines, "Log a call by voice"], ["/account/assistant", Sparkles, "AI assistant"]].map(([href, I, label]) => { const Icon = I as typeof UserPlus; return (
          <Link key={href as string} href={href as string} className="group flex items-center gap-3 rounded-2xl border border-line bg-white p-4 text-sm font-medium transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md active:scale-[.98]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent transition group-hover:bg-accent group-hover:text-white"><Icon size={18} aria-hidden /></span>{label as string}</Link>
        ); })}
      </div>

      {!d.setupNeeded && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Total contacts" value={d.contacts} />
            <Stat label="Active leads" value={d.activeLeads} hint="Not yet won or lost" />
            <Stat label="Open tasks" value={d.openTasks} hint={d.overdue ? `${d.overdue} overdue` : undefined} />
            <Stat label="Upcoming follow-ups" value={d.upcoming} hint="Open tasks due today or later" />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card title="Sales pipeline" action={<Link href="/account/leads" className="text-sm text-accent hover:underline">Open pipeline</Link>}>
              <ul className="space-y-3">
                {STAGES.map((s) => (
                  <li key={s} className="grid grid-cols-[5.5rem,1fr,2rem] items-center gap-3 text-sm">
                    <span className="text-ink/70">{STAGE_LABEL[s]}</span>
                    <span className="h-2 rounded-full bg-ink/5"><span className="block h-2 rounded-full bg-accent" style={{ width: `${(d.pipeline[s] / maxStage) * 100}%` }} /></span>
                    <span className="text-right tabular-nums">{d.pipeline[s]}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card title="Follow-ups" action={<Link href="/account/tasks" className="text-sm text-accent hover:underline">All tasks</Link>}>
              {d.followUps.length === 0 ? <Empty>No follow-ups scheduled. Open tasks with a due date appear here.</Empty> : (
                <ul className="divide-y divide-line">{d.followUps.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span className="truncate">{t.title}</span><span className={`shrink-0 ${t.due_date && t.due_date < todayStr ? "font-medium text-red-700" : "text-ink/60"}`}>{t.due_date && t.due_date < todayStr ? "Overdue · " : ""}{t.due_date ? fmt(t.due_date) : ""}</span></li>
                ))}</ul>
              )}
            </Card>
            <Card title="Recent activity" action={<Link href="/account/activities" className="text-sm text-accent hover:underline">All activity</Link>}>
              {d.activities.length === 0 ? <Empty>No activity yet. Emails, meetings and notes you log will show up here.</Empty> : (
                <ul className="divide-y divide-line">{d.activities.map((a) => (
                  <li key={a.id} className="py-2.5 text-sm"><p className="truncate">{a.summary}</p><p className="text-xs text-ink/55">{a.type} · {fmt(a.occurred_at)}</p></li>
                ))}</ul>
              )}
            </Card>
            <Card title="Recent call summaries" action={<Link href="/account/activities?tab=calls" className="text-sm text-accent hover:underline">All calls</Link>}>
              {d.calls.length === 0 ? <Empty>No calls saved yet. Log or record a call and its summary appears here.</Empty> : (
                <ul className="divide-y divide-line">{d.calls.map((c) => (
                  <li key={c.id} className="py-2.5 text-sm"><p className="line-clamp-2">{c.summary || "No summary saved."}</p><p className="text-xs text-ink/55">{fmt(c.occurred_at)}</p></li>
                ))}</ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
