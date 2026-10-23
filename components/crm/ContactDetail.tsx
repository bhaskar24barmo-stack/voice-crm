"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, Building2, Sparkles, PhoneCall, StickyNote, CalendarDays, MailOpen } from "lucide-react";
import { api, fmtDate, fmtDateTime, money, today } from "@/lib/client";
import { useList } from "@/lib/hooks";
import { STAGE_LABEL, type Activity, type Call, type Contact, type Lead, type Task } from "@/lib/crm-types";
import { Badge, Confirm, ErrorNote, Spinner, btnP, btnS, useToast } from "./ui";
import { Card, Empty } from "./kit";
import { ActivityFormModal, CallFormModal, ContactFormModal, LeadFormModal, TaskFormModal } from "./forms";
import { statusTone } from "./ContactsView";

type Modal = "edit" | "delete" | "activity" | "call" | "task" | "lead" | null;
const icon = { call: PhoneCall, email: MailOpen, meeting: CalendarDays, note: StickyNote, other: StickyNote } as const;

export default function ContactDetail({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const [c, setC] = useState<Contact | null>(null);
  const [err, setErr] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const acts = useList<Activity>("activities", { contact_id: id }, 50);
  const calls = useList<Call>("calls", { contact_id: id }, 50);
  const tasks = useList<Task>("tasks", { contact_id: id, view: "open", today: today() }, 50);
  const leads = useList<Lead>("leads", { contact_id: id }, 50);

  const load = () => api<{ data: Contact }>(`/api/crm/contacts/${id}`).then((j) => setC(j.data)).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const timeline = useMemo(() => [
    ...acts.items.map((a) => ({ key: `a${a.id}`, at: a.occurred_at, type: a.type, title: a.summary, body: a.details })),
    ...calls.items.map((k) => ({ key: `c${k.id}`, at: k.occurred_at, type: "call", title: k.summary || "Call", body: k.notes })),
  ].sort((x, y) => +new Date(y.at) - +new Date(x.at)), [acts.items, calls.items]);

  const reloadAll = () => { acts.reload(); calls.reload(); tasks.reload(); leads.reload(); };
  if (err) return <div className="mx-auto max-w-3xl"><ErrorNote message={err} /><Link href="/account/contacts" className="mt-4 inline-block text-accent underline">Back to contacts</Link></div>;
  if (!c) return <Spinner label="Loading contact" />;

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/account/contacts" className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-accent"><ArrowLeft size={14} aria-hidden />All contacts</Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold sm:text-4xl">{c.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/70">
            <Badge tone={statusTone(c.status)}>{c.status}</Badge>
            {c.company && <span className="inline-flex items-center gap-1.5"><Building2 size={14} aria-hidden />{c.company}</span>}
            {c.email && <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 hover:text-accent"><Mail size={14} aria-hidden />{c.email}</a>}
            {c.phone && <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1.5 hover:text-accent"><Phone size={14} aria-hidden />{c.phone}</a>}
          </div>
          {c.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{c.tags.map((t) => <Badge key={t}>{t}</Badge>)}</div>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/account/assistant?contact=${c.id}`} className={btnS}><Sparkles size={16} aria-hidden />Ask AI</Link>
          <button className={btnS} onClick={() => setModal("edit")}>Edit</button>
          <button className={`${btnS} !text-red-700`} onClick={() => setModal("delete")}>Delete</button>
        </div>
      </div>

      {c.notes && <Card title="Notes" className="mt-6"><p className="whitespace-pre-wrap text-sm text-ink/80">{c.notes}</p></Card>}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr,1fr]">
        <Card title="Interaction history" action={<div className="flex gap-2"><button className={btnS} onClick={() => setModal("activity")}>Log activity</button><button className={btnP} onClick={() => setModal("call")}>Log call</button></div>}>
          {(acts.loading || calls.loading) && !timeline.length ? <Spinner /> : timeline.length === 0 ? <Empty>No interactions yet. Log a call, email or note to build this contact’s history.</Empty> : (
            <ol className="space-y-4">
              {timeline.map((t) => { const I = icon[t.type as keyof typeof icon] ?? StickyNote; return (
                <li key={t.key} className="flex gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink/5 text-ink/60"><I size={15} aria-hidden /></span>
                  <div className="min-w-0"><p className="text-sm font-medium">{t.title}</p><p className="text-xs text-ink/55">{t.type} · {fmtDateTime(t.at)}</p>{t.body && <p className="mt-1 whitespace-pre-wrap text-sm text-ink/75">{t.body}</p>}</div>
                </li>
              ); })}
            </ol>
          )}
        </Card>

        <div className="space-y-4">
          <Card title="Open tasks" action={<button className={btnS} onClick={() => setModal("task")}>Add task</button>}>
            {tasks.items.length === 0 ? <Empty>No open tasks for this contact.</Empty> : (
              <ul className="divide-y divide-line">{tasks.items.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span className="truncate">{t.title}</span><span className={`shrink-0 ${t.due_date && t.due_date < today() ? "font-medium text-red-700" : "text-ink/60"}`}>{t.due_date ? fmtDate(t.due_date) : "No date"}</span></li>
              ))}</ul>
            )}
          </Card>
          <Card title="Leads" action={<button className={btnS} onClick={() => setModal("lead")}>Add lead</button>}>
            {leads.items.length === 0 ? <Empty>No leads linked to this contact.</Empty> : (
              <ul className="divide-y divide-line">{leads.items.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span className="truncate">{l.title}</span><span className="shrink-0 text-ink/60">{STAGE_LABEL[l.status]}{l.value != null ? ` · ${money(l.value)}` : ""}</span></li>
              ))}</ul>
            )}
          </Card>
        </div>
      </div>

      {modal === "edit" && <ContactFormModal contact={c} onClose={() => setModal(null)} onSaved={load} />}
      {modal === "activity" && <ActivityFormModal preset={{ contact_id: id }} onClose={() => setModal(null)} onSaved={reloadAll} />}
      {modal === "call" && <CallFormModal preset={{ contact_id: id }} onClose={() => setModal(null)} onSaved={reloadAll} />}
      {modal === "task" && <TaskFormModal preset={{ contact_id: id }} onClose={() => setModal(null)} onSaved={reloadAll} />}
      {modal === "lead" && <LeadFormModal preset={{ contact_id: id }} onClose={() => setModal(null)} onSaved={reloadAll} />}
      {modal === "delete" && <Confirm title="Delete contact?" message={`“${c.name}” and their activities and calls will be permanently deleted. Their leads and tasks stay, but are unlinked.`} onCancel={() => setModal(null)} onConfirm={async () => { await api(`/api/crm/contacts/${id}`, { method: "DELETE" }); toast("Contact deleted."); router.push("/account/contacts"); }} />}
    </div>
  );
}
