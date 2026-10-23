"use client";
import { useState } from "react";
import Link from "next/link";
import { AudioLines, PhoneCall, Plus, StickyNote } from "lucide-react";
import { api, fmtDateTime } from "@/lib/client";
import { useList } from "@/lib/hooks";
import { ACTIVITY_TYPES, type Activity, type Call } from "@/lib/crm-types";
import { Badge, Confirm, ErrorNote, PageHeader, Spinner, Tabs, btnP, btnS, field, useToast } from "./ui";
import { ActivityFormModal, CallFormModal } from "./forms";

export default function ActivitiesView({ initialTab }: { initialTab: "activities" | "calls" }) {
  const [tab, setTab] = useState<string>(initialTab);
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Activities & calls" desc="Every conversation and touchpoint, linked to the right contact." />
      <div className="mb-4"><Tabs label="Section" tabs={[["activities", "Activities"], ["calls", "Calls"]]} value={tab} onChange={setTab} /></div>
      {tab === "activities" ? <Activities /> : <Calls />}
    </div>
  );
}

function Activities() {
  const [type, setType] = useState("");
  const list = useList<Activity>("activities", { type });
  const [form, setForm] = useState<Activity | "new" | null>(null);
  const [del, setDel] = useState<Activity | null>(null);
  const toast = useToast();
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label><span className="sr-only">Filter by type</span><select value={type} onChange={(e) => setType(e.target.value)} className={`${field} !mt-0`}><option value="">All types</option>{ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}</select></label>
        <button className={btnP} onClick={() => setForm("new")}><Plus size={16} aria-hidden />Log activity</button>
      </div>
      {list.error && <ErrorNote message={list.error} onRetry={list.reload} />}
      {list.loading && !list.items.length && <Spinner label="Loading activities" />}
      {!list.loading && !list.error && !list.items.length && <Empty icon={<StickyNote className="mx-auto text-ink/30" size={32} aria-hidden />} title="No activities yet" text="Log emails, meetings and notes so you always know where each conversation stands." />}
      {list.items.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {list.items.map((a) => (
            <li key={a.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <button className="text-left text-sm font-medium hover:text-accent" onClick={() => setForm(a)}>{a.summary}</button>
                <Badge>{a.type}</Badge>
              </div>
              {a.details && <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-ink/70">{a.details}</p>}
              <p className="mt-1.5 text-xs text-ink/55">{fmtDateTime(a.occurred_at)}{a.contact && <> · <Link href={`/account/contacts/${a.contact.id}`} className="hover:text-accent">{a.contact.name}</Link></>}</p>
            </li>
          ))}
        </ul>
      )}
      {list.hasMore && <div className="mt-4 text-center"><button className={btnS} disabled={list.loading} onClick={list.loadMore}>Load more</button></div>}
      {form && <ActivityFormModal activity={form === "new" ? null : form} onDelete={() => { if (form !== "new") { setDel(form); setForm(null); } }} onClose={() => setForm(null)} onSaved={list.reload} />}
      {del && <Confirm title="Delete activity?" message="This activity will be permanently deleted." onCancel={() => setDel(null)} onConfirm={async () => { await api(`/api/crm/activities/${del.id}`, { method: "DELETE" }); toast("Activity deleted."); setDel(null); list.reload(); }} />}
    </>
  );
}

function Calls() {
  const list = useList<Call>("calls", {});
  const [form, setForm] = useState<Call | "new" | null>(null);
  const [del, setDel] = useState<Call | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const toast = useToast();
  return (
    <>
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <Link href="/account/voice" className={btnS}><AudioLines size={16} aria-hidden />Record or upload</Link>
        <button className={btnP} onClick={() => setForm("new")}><Plus size={16} aria-hidden />Log a call</button>
      </div>
      {list.error && <ErrorNote message={list.error} onRetry={list.reload} />}
      {list.loading && !list.items.length && <Spinner label="Loading calls" />}
      {!list.loading && !list.error && !list.items.length && <Empty icon={<PhoneCall className="mx-auto text-ink/30" size={32} aria-hidden />} title="No calls saved yet" text="Log a call by hand, or record or upload one on the Voice page to get an AI summary." />}
      {list.items.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {list.items.map((k) => (
            <li key={k.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium">{k.summary || "Call"}</p>
                <div className="flex shrink-0 gap-3 text-sm"><button className="text-accent hover:underline" onClick={() => setForm(k)}>Edit</button></div>
              </div>
              <p className="mt-1 text-xs text-ink/55">{fmtDateTime(k.occurred_at)}{k.duration_seconds != null && ` · ${Math.max(1, Math.round(k.duration_seconds / 60))} min`}{k.source !== "manual" && ` · ${k.source}`}{k.contact && <> · <Link href={`/account/contacts/${k.contact.id}`} className="hover:text-accent">{k.contact.name}</Link></>}</p>
              {(k.notes || k.transcript) && (
                <>
                  <button className="mt-2 text-xs font-medium text-accent hover:underline" aria-expanded={open === k.id} onClick={() => setOpen(open === k.id ? null : k.id)}>{open === k.id ? "Hide details" : "Show notes and transcript"}</button>
                  {open === k.id && <div className="mt-2 space-y-3 rounded-xl bg-paper p-3 text-sm text-ink/80">{k.notes && <div><p className="mb-1 text-xs font-medium text-ink/55">Notes</p><p className="whitespace-pre-wrap">{k.notes}</p></div>}{k.transcript && <div><p className="mb-1 text-xs font-medium text-ink/55">Transcript</p><p className="whitespace-pre-wrap">{k.transcript}</p></div>}</div>}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {list.hasMore && <div className="mt-4 text-center"><button className={btnS} disabled={list.loading} onClick={list.loadMore}>Load more</button></div>}
      {form && <CallFormModal call={form === "new" ? null : form} onDelete={() => { if (form !== "new") { setDel(form); setForm(null); } }} onClose={() => setForm(null)} onSaved={list.reload} />}
      {del && <Confirm title="Delete call?" message="This call, its notes and its transcript will be permanently deleted." onCancel={() => setDel(null)} onConfirm={async () => { await api(`/api/crm/calls/${del.id}`, { method: "DELETE" }); toast("Call deleted."); setDel(null); list.reload(); }} />}
    </>
  );
}

function Empty({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="rounded-2xl border border-dashed border-ink/20 bg-white p-10 text-center">{icon}<h2 className="mt-3 font-serif text-xl font-semibold">{title}</h2><p className="mx-auto mt-1 max-w-sm text-sm text-ink/65">{text}</p></div>;
}
