"use client";
import { useState } from "react";
import { LayoutDashboard, Users, ListChecks, Mic, Wrench } from "lucide-react";
import { CrmProvider, useCrm } from "@/components/app/Store";
import Assistant from "@/components/app/Assistant";
import { Logo, primary } from "@/components/ui";
import { STAGES, describe, type Stage } from "@/lib/crm";

const views = [["Overview", LayoutDashboard], ["Contacts", Users], ["Tasks", ListChecks], ["Voice notes", Mic], ["Tools", Wrench]] as const;
const card = "rounded-2xl border border-line bg-white p-5 shadow-sm";
const inp = "rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm";
const btn = `${primary} !px-4 !py-2 text-sm`;

function Tasks() {
  const { tasks, toggle, addTask } = useCrm();
  return (
    <div className={card}>
      <h2 className="font-semibold">Follow-ups</h2>
      <ul className="mt-3 divide-y divide-line">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-3 py-2.5">
            <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} aria-label={`Mark done: ${t.title}`} className="h-4 w-4 accent-[#C2501A]" />
            <span className={t.done ? "text-ink/40 line-through" : ""}>{t.title}</span>
            <span className="ml-auto rounded bg-paper px-2 py-0.5 text-xs">{t.due}</span>
          </li>
        ))}
        {!tasks.length && <li className="py-2.5 text-sm text-ink/60">No follow-ups yet. Add one or ask the assistant.</li>}
      </ul>
      <form className="mt-4 flex gap-2" onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget); const t = String(f.get("t") || "").trim();
        if (!t) return;
        addTask(t, String(f.get("d"))); e.currentTarget.reset();
      }}>
        <input name="t" aria-label="New follow-up" placeholder="Add a follow-up" className={`${inp} min-w-0 flex-1`} />
        <select name="d" aria-label="Due" className={inp}><option>Today</option><option>Tomorrow</option><option>This week</option></select>
        <button className={btn}>Add</button>
      </form>
    </div>
  );
}

function Pipeline() {
  const { contacts } = useCrm();
  return (
    <div className={card}>
      <h2 className="font-semibold">Pipeline</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        {STAGES.map((s) => (
          <div key={s} className="rounded-xl bg-paper p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink/60">{s} · {contacts.filter((c) => c.stage === s).length}</p>
            <div className="space-y-2">{contacts.filter((c) => c.stage === s).map((c) => <div key={c.id} className="rounded-lg border border-line bg-white p-2 text-sm"><p className="font-medium">{c.name}</p><p className="text-xs text-ink/60">{c.company}</p></div>)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Activity() {
  const { activity } = useCrm();
  return (
    <div className={card}>
      <h2 className="font-semibold">Recent activity</h2>
      {activity.length ? <ul className="mt-3 space-y-2 text-sm">{activity.map((a) => <li key={a.id}>{a.text}</li>)}</ul> : <p className="mt-2 text-sm text-ink/60">Updates appear here as you work.</p>}
    </div>
  );
}

function ContactsView() {
  const { contacts, addContact, setStage } = useCrm();
  return (
    <div className="space-y-5">
      <form className={`${card} flex flex-wrap gap-2`} onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget); const name = String(f.get("name") || "").trim();
        if (!name) return;
        addContact({ name, company: String(f.get("company") || "").trim(), interest: String(f.get("interest") || "").trim() }); e.currentTarget.reset();
      }}>
        <input name="name" required aria-label="Name" placeholder="Name *" className={`${inp} min-w-[8rem] flex-1`} />
        <input name="company" aria-label="Company" placeholder="Company" className={`${inp} min-w-[8rem] flex-1`} />
        <input name="interest" aria-label="Interested in" placeholder="Plan / interest" className={`${inp} min-w-[8rem] flex-1`} />
        <button className={btn}>Add contact</button>
      </form>
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-ink/50"><tr><th className="pb-2">Name</th><th>Company</th><th>Interest</th><th>Stage</th></tr></thead>
          <tbody className="divide-y divide-line">
            {contacts.map((c) => (
              <tr key={c.id}><td className="py-2.5 font-medium">{c.name}</td><td>{c.company}</td><td>{c.interest}</td>
                <td><select value={c.stage} onChange={(e) => setStage(c.id, e.target.value as Stage)} aria-label={`Stage for ${c.name}`} className={inp}>{STAGES.map((s) => <option key={s}>{s}</option>)}</select></td></tr>
            ))}
          </tbody>
        </table>
        {!contacts.length && <p className="pt-3 text-sm text-ink/60">No contacts yet. Add one above or tell the assistant who you met.</p>}
      </div>
    </div>
  );
}

function VoiceNotes() {
  const { notes } = useCrm();
  return (
    <div className="space-y-3">
      {notes.map((n) => (
        <div key={n.id} className={card}>
          <div className="flex items-center justify-between gap-3 text-xs text-ink/50"><span>{new Date(n.created_at).toLocaleString()}</span><span className={`rounded px-2 py-0.5 ${n.status === "confirmed" ? "bg-[#FBF1EA] text-accent" : "bg-paper"}`}>{n.status}</span></div>
          <p className="mt-2 font-serif text-lg">“{n.transcript}”</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-ink/70">{n.actions.map((a, i) => <li key={i}>{describe(a)}</li>)}</ul>
        </div>
      ))}
      {!notes.length && <p className={`${card} text-sm text-ink/60`}>Every voice or typed update you confirm or dismiss with the assistant is kept here.</p>}
    </div>
  );
}

function Tools() {
  const { contacts, tasks } = useCrm();
  const [who, setWho] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const due = tasks.filter((t) => !t.done && t.due === "Today");
  const fresh = contacts.filter((c) => c.stage === "New");
  const lines = [
    `${due.length} follow-up${due.length === 1 ? "" : "s"} due today${due.length ? ": " + due.map((t) => t.title).join("; ") : ""}.`,
    `${contacts.filter((c) => c.stage !== "Won").length} open leads, ${contacts.filter((c) => c.stage === "Proposal").length} waiting on a proposal.`,
    fresh.length ? `Not yet contacted: ${fresh.map((c) => c.name).join(", ")}.` : "Every lead has been contacted.",
  ];
  async function go() {
    if (!who) return;
    setBusy(true); setDraft("");
    try {
      const r = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "email", text: who, contacts, tasks, today: new Date().toDateString() }) });
      const d = await r.json();
      setDraft(r.ok ? d.reply : "Could not draft the email. Check that OPENROUTER_API_KEY is set and that you are signed in.");
    } catch { setDraft("Could not reach the server."); }
    setBusy(false);
  }
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className={card}><h2 className="font-semibold">Daily brief</h2><ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">{lines.map((l) => <li key={l}>{l}</li>)}</ul></div>
      <div className={card}>
        <h2 className="font-semibold">Follow-up email drafter</h2>
        <div className="mt-3 flex gap-2">
          <select value={who} onChange={(e) => setWho(e.target.value)} aria-label="Contact" className={`${inp} min-w-0 flex-1`}><option value="">Choose a contact</option>{contacts.map((c) => <option key={c.id}>{c.name}</option>)}</select>
          <button onClick={go} disabled={!who || busy} className={`${btn} disabled:opacity-60`}>{busy ? "Drafting…" : "Draft"}</button>
        </div>
        {draft && <textarea readOnly value={draft} aria-label="Drafted email" className={`${inp} mt-3 h-48 w-full`} />}
        <p className="mt-2 text-xs text-ink/50">AI drafts can be wrong. Review before sending.</p>
      </div>
    </div>
  );
}

function Shell() {
  const [v, setV] = useState<string>("Overview");
  const { contacts, tasks, ready, error, demo } = useCrm();
  const kpis = [["Open leads", contacts.filter((c) => c.stage !== "Won").length], ["Due today", tasks.filter((t) => !t.done && t.due === "Today").length], ["Won", contacts.filter((c) => c.stage === "Won").length]];
  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-line bg-white/60 p-4 md:w-56 md:border-b-0 md:border-r">
        <Logo />
        <nav aria-label="App" className="mt-4 flex gap-1 overflow-x-auto md:flex-col">
          {views.map(([n, Icon]) => (
            <button key={n} onClick={() => setV(n)} aria-current={v === n ? "page" : undefined} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm ${v === n ? "bg-ink text-paper" : "hover:bg-ink/5"}`}><Icon size={16} aria-hidden />{n}</button>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 space-y-5 p-5 md:p-8">
        <h1 className="font-serif text-3xl font-semibold">{v === "Overview" ? "Welcome back" : v}</h1>
        {demo && <p role="status" className="rounded-lg bg-[#FBF1EA] px-3 py-2 text-sm">Demo mode: Supabase is not configured, so changes live in this tab only.</p>}
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
        {!ready ? <p className="text-ink/60">Loading your workspace…</p> : (<>
          {v === "Overview" && (<>
            <div className="grid grid-cols-3 gap-4">{kpis.map(([k, n]) => <div key={k} className={card}><p className="text-xs text-ink/60">{k}</p><p className="font-serif text-3xl font-semibold tabular-nums">{n}</p></div>)}</div>
            <Pipeline /><div className="grid gap-5 lg:grid-cols-2"><Tasks /><Activity /></div>
          </>)}
          {v === "Contacts" && <ContactsView />}
          {v === "Tasks" && <Tasks />}
          {v === "Voice notes" && <VoiceNotes />}
          {v === "Tools" && <Tools />}
        </>)}
      </main>
      {ready && <Assistant />}
    </div>
  );
}

export default function AppPage() {
  return <CrmProvider><Shell /></CrmProvider>;
}
