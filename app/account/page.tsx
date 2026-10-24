import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarClock, CheckSquare, Database, ListPlus, Target, UserPlus, Users } from "lucide-react";
import { getAuth } from "@/lib/supabase";
import { getDashboard, STAGES, STAGE_LABEL } from "@/lib/crm-data";
import { aiConfigured, sttConfigured } from "@/lib/config";
import { Card, Empty, Stat } from "@/components/crm/kit";
import { Greeting } from "@/components/crm/fx";
import VoiceCapture from "@/components/crm/VoiceCapture";
import InstallPrompt from "@/components/crm/InstallPrompt";

export const dynamic = "force-dynamic";
export const metadata = { title: "Home — Voice CRM", robots: { index: false } };

const fmt = (d: string) => new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString("en", { month: "short", day: "numeric" });
const STAGE_COLOR: Record<string, string> = { new: "#F3C9A8", contacted: "#EDA46F", qualified: "#E0652A", proposal: "#B8440F", won: "#2F7D46", lost: "#A3A3A3" };

export default async function Dashboard() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  const d = await getDashboard(auth.token);
  const m = auth.user.user_metadata;
  const first = (m?.name || m?.full_name || "").split(" ")[0];
  const todayStr = new Date().toISOString().slice(0, 10);
  const total = STAGES.reduce((a, s) => a + d.pipeline[s], 0);
  const summary = d.setupNeeded ? "" : d.overdue ? `${d.overdue} follow-up${d.overdue === 1 ? " is" : "s are"} overdue.` : d.openTasks ? `${d.openTasks} open task${d.openTasks === 1 ? "" : "s"}, nothing overdue.` : "You’re all caught up.";

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      {/* Hero: the whole job is one button */}
      <div className="glow-border rise rounded-[2rem] p-[1.5px]">
        <section className="relative overflow-hidden rounded-[calc(2rem-1.5px)] bg-ink p-6 text-paper sm:p-10">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <span className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/50 blur-3xl" style={{ animation: "drift-a 18s ease-in-out infinite" }} />
            <span className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-[#F6A56B]/25 blur-3xl" style={{ animation: "drift-b 24s ease-in-out infinite" }} />
            <span className="absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(255,255,255,.09)_1px,transparent_1px)] [background-size:22px_22px]" />
          </div>
          <div className="relative grid gap-10 lg:grid-cols-[1fr,1.05fr] lg:items-center">
            <div>
              <Greeting name={first} />
              <h1 className="mt-5 font-serif text-5xl font-semibold leading-[1.02] sm:text-6xl"><span className="shimmer-text">Just say it.</span><br />We’ll file it.</h1>
              <p className="mt-4 max-w-md text-paper/70">Tap the orb and talk the way you normally do, in English, Hindi or Hinglish. Notes, follow-ups, expenses and new contacts go straight into your CRM.</p>
              {summary && <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur"><span className={`h-2 w-2 rounded-full ${d.overdue ? "bg-red-400" : "bg-emerald-400"}`} aria-hidden />{summary}</p>}
              <div className="mt-6 flex flex-wrap gap-2.5">
                <Link href="/account/contacts?new=1" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm backdrop-blur transition hover:bg-white/20 active:scale-95"><UserPlus size={16} aria-hidden />Add contact</Link>
                <Link href="/account/tasks?new=1" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm backdrop-blur transition hover:bg-white/20 active:scale-95"><ListPlus size={16} aria-hidden />Create task</Link>
              </div>
            </div>
            <VoiceCapture sttReady={sttConfigured()} aiReady={aiConfigured()} />
          </div>
        </section>
      </div>

      <InstallPrompt />

      {d.setupNeeded ? (
        <div role="status" className="glass rise flex gap-3 rounded-3xl p-5" style={{ animationDelay: "120ms" }}>
          <Database className="mt-0.5 shrink-0 text-accent" size={20} aria-hidden />
          <div className="text-sm"><p className="font-medium">Your CRM database isn’t set up yet.</p>
            <p className="mt-1 text-ink/70">Run <code className="rounded bg-ink/5 px-1">supabase/crm-schema.sql</code> in the Supabase SQL editor, then refresh. Until then, saving is switched off and the numbers stay hidden instead of showing zeros.</p></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Contacts" value={d.contacts} icon={<Users size={17} aria-hidden />} delay={100} />
            <Stat label="Active leads" value={d.activeLeads} hint="Not yet won or lost" icon={<Target size={17} aria-hidden />} delay={170} />
            <Stat label="Open tasks" value={d.openTasks} hint={d.overdue ? `${d.overdue} overdue` : "None overdue"} icon={<CheckSquare size={17} aria-hidden />} delay={240} />
            <Stat label="Coming up" value={d.upcoming} hint="Due today or later" icon={<CalendarClock size={17} aria-hidden />} delay={310} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="Pipeline" className="lg:col-span-2" delay={380} action={<Link href="/account/leads" className="text-sm text-accent hover:underline">Open board</Link>}>
              {total === 0 ? <Empty>No leads yet. Add one and watch it move through the stages here.</Empty> : (
                <>
                  <div className="flex h-4 w-full gap-1 overflow-hidden rounded-full" role="img" aria-label={`Pipeline: ${STAGES.map((s) => `${STAGE_LABEL[s]} ${d.pipeline[s]}`).join(", ")}`}>
                    {STAGES.filter((s) => d.pipeline[s] > 0).map((s, i) => <span key={s} className="grow-x block h-full rounded-full" style={{ width: `${(d.pipeline[s] / total) * 100}%`, background: STAGE_COLOR[s], animationDelay: `${450 + i * 110}ms` }} />)}
                  </div>
                  <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {STAGES.map((s) => (
                      <li key={s}><Link href="/account/leads" className="flex items-center gap-3 rounded-2xl bg-white/60 px-3.5 py-3 text-sm transition hover:bg-white">
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: STAGE_COLOR[s] }} aria-hidden /><span className="text-ink/70">{STAGE_LABEL[s]}</span><span className="ml-auto font-serif text-xl font-semibold tabular-nums">{d.pipeline[s]}</span></Link></li>
                    ))}
                  </ul>
                </>
              )}
            </Card>

            <Card title="Follow-ups" delay={450} action={<Link href="/account/tasks" className="text-sm text-accent hover:underline">All tasks</Link>}>
              {d.followUps.length === 0 ? <Empty>Nothing scheduled. Say “kal client aayega” and it shows up here.</Empty> : (
                <ul className="space-y-2">{d.followUps.map((t) => { const late = !!t.due_date && t.due_date < todayStr; return (
                  <li key={t.id} className="flex items-center gap-3 rounded-2xl bg-white/60 px-3.5 py-2.5 text-sm"><span className={`h-2 w-2 shrink-0 rounded-full ${late ? "bg-red-500" : "bg-accent"}`} aria-hidden /><span className="min-w-0 flex-1 truncate">{t.title}</span><span className={`shrink-0 text-xs ${late ? "font-medium text-red-700" : "text-ink/55"}`}>{late ? "Overdue · " : ""}{t.due_date ? fmt(t.due_date) : ""}</span></li>
                ); })}</ul>
              )}
            </Card>

            <Card title="Recent activity" className="lg:col-span-2" delay={520} action={<Link href="/account/activities" className="text-sm text-accent hover:underline">See all</Link>}>
              {d.activities.length === 0 ? <Empty>No activity yet. Tap the orb and tell me about your day.</Empty> : (
                <ol className="relative space-y-3 border-l border-ink/10 pl-5">{d.activities.map((a) => (
                  <li key={a.id} className="relative"><span className="absolute -left-[1.62rem] top-1.5 h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-white/80" aria-hidden /><p className="text-sm">{a.summary}</p><p className="text-xs text-ink/55">{a.type} · {fmt(a.occurred_at)}</p></li>
                ))}</ol>
              )}
            </Card>

            <Card title="Latest calls" delay={590} action={<Link href="/account/activities?tab=calls" className="text-sm text-accent hover:underline">All calls</Link>}>
              {d.calls.length === 0 ? <Empty>No calls saved yet.</Empty> : (
                <ul className="space-y-2">{d.calls.map((c) => (
                  <li key={c.id} className="rounded-2xl bg-white/60 px-3.5 py-2.5 text-sm"><p className="line-clamp-2">{c.summary || "No summary saved."}</p><p className="mt-0.5 text-xs text-ink/55">{fmt(c.occurred_at)}</p></li>
                ))}</ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
