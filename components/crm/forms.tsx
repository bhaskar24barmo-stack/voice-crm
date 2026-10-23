"use client";
import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { api, fromLocalInput, today, toLocalInput } from "@/lib/client";
import { ACTIVITY_TYPES, CONTACT_STATUS, PRIORITIES, STAGES, STAGE_LABEL, type Activity, type Call, type Contact, type Lead, type Task } from "@/lib/crm-types";
import { L, Modal, btnP, btnS, field, useToast } from "./ui";

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function FormModal({ title, onClose, onSubmit, children, wide, onDelete }: { title: string; onClose: () => void; onSubmit: () => Promise<void>; children: ReactNode; wide?: boolean; onDelete?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    try { await onSubmit(); } catch (x) { setErr(x instanceof Error ? x.message : "Something went wrong."); setBusy(false); }
  }
  return (
    <Modal title={title} onClose={onClose} wide={wide}>
      <form onSubmit={submit} className="space-y-4">
        {children}
        {err && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        <div className="flex items-center justify-end gap-2 pt-1">
          {onDelete && <button type="button" onClick={onDelete} className="mr-auto px-1 text-sm text-red-700 hover:underline">Delete</button>}
          <button type="button" className={btnS} onClick={onClose}>Cancel</button>
          <button className={btnP} disabled={busy}>{busy && <Loader2 size={16} className="animate-spin" aria-hidden />}Save</button>
        </div>
      </form>
    </Modal>
  );
}

function useSaver(resource: string, id: string | undefined, onSaved: () => void, onClose: () => void, noun: string) {
  const toast = useToast();
  return async (body: Record<string, unknown>) => {
    await api(id ? `/api/crm/${resource}/${id}` : `/api/crm/${resource}`, { method: id ? "PATCH" : "POST", body });
    toast(id ? `${noun} updated.` : `${noun} added.`);
    onSaved(); onClose();
  };
}

// Search-then-pick contact selector (loads 20 at a time, so it stays fast with large contact lists).
export function ContactSelect({ value, onChange, label = "Contact" }: { value: string; onChange: (id: string) => void; label?: string }) {
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState<{ id: string; name: string; company: string | null }[]>([]);
  const [sel, setSel] = useState<{ id: string; name: string; company: string | null } | null>(null);
  useEffect(() => {
    const t = setTimeout(() => { api(`/api/crm/contacts?limit=20&q=${encodeURIComponent(q)}`).then((j) => setOpts(j.data)).catch(() => {}); }, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    if (!value) { setSel(null); return; }
    if (sel?.id !== value) api(`/api/crm/contacts/${value}`).then((j) => setSel(j.data)).catch(() => {});
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  const list = sel && !opts.some((o) => o.id === sel.id) ? [sel, ...opts] : opts;
  return (
    <div>
      <label className="block text-sm font-medium">{label}
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search contacts by name or company" className={field} />
      </label>
      <select aria-label={`${label} (choose)`} value={value} onChange={(e) => onChange(e.target.value)} className={field}>
        <option value="">No contact</option>
        {list.map((o) => <option key={o.id} value={o.id}>{o.name}{o.company ? ` — ${o.company}` : ""}</option>)}
      </select>
    </div>
  );
}

export function LeadSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [opts, setOpts] = useState<{ id: string; title: string }[]>([]);
  useEffect(() => { api("/api/crm/leads?limit=100").then((j) => setOpts(j.data)).catch(() => {}); }, []);
  return <L label="Lead"><select value={value} onChange={(e) => onChange(e.target.value)} className={field}><option value="">No lead</option>{opts.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}</select></L>;
}

export function ContactFormModal({ contact, onClose, onSaved }: { contact?: Contact | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ name: contact?.name ?? "", email: contact?.email ?? "", phone: contact?.phone ?? "", company: contact?.company ?? "", status: contact?.status ?? "lead", tags: (contact?.tags ?? []).join(", "), notes: contact?.notes ?? "" });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const save = useSaver("contacts", contact?.id, onSaved, onClose, "Contact");
  return (
    <FormModal title={contact ? "Edit contact" : "Add contact"} onClose={onClose} onSubmit={() => save({ ...f, tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean) })}>
      <L label="Name"><input data-autofocus required maxLength={120} value={f.name} onChange={set("name")} className={field} autoComplete="off" /></L>
      <div className="grid gap-4 sm:grid-cols-2">
        <L label="Email"><input type="email" maxLength={254} value={f.email} onChange={set("email")} className={field} /></L>
        <L label="Phone"><input type="tel" maxLength={40} value={f.phone} onChange={set("phone")} className={field} /></L>
        <L label="Company"><input maxLength={120} value={f.company} onChange={set("company")} className={field} /></L>
        <L label="Status"><select value={f.status} onChange={set("status")} className={field}>{CONTACT_STATUS.map((s) => <option key={s} value={s}>{cap(s)}</option>)}</select></L>
      </div>
      <L label="Tags" hint="Separate with commas."><input value={f.tags} onChange={set("tags")} className={field} /></L>
      <L label="Notes"><textarea rows={4} maxLength={5000} value={f.notes} onChange={set("notes")} className={field} /></L>
    </FormModal>
  );
}

export function TaskFormModal({ task, preset, onClose, onSaved, onDelete }: { onDelete?: () => void; task?: Task | null; preset?: { contact_id?: string; lead_id?: string }; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ title: task?.title ?? "", description: task?.description ?? "", due_date: task?.due_date ?? "", priority: task?.priority ?? "medium", contact_id: task?.contact_id ?? preset?.contact_id ?? "", lead_id: task?.lead_id ?? preset?.lead_id ?? "" });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const save = useSaver("tasks", task?.id, onSaved, onClose, "Task");
  return (
    <FormModal title={task ? "Edit task" : "Create task"} onDelete={task ? onDelete : undefined} onClose={onClose} onSubmit={() => save(f)}>
      <L label="Title"><input data-autofocus required maxLength={200} value={f.title} onChange={set("title")} className={field} /></L>
      <div className="grid gap-4 sm:grid-cols-2">
        <L label="Due date"><input type="date" value={f.due_date} onChange={set("due_date")} className={field} /></L>
        <L label="Priority"><select value={f.priority} onChange={set("priority")} className={field}>{PRIORITIES.map((p) => <option key={p} value={p}>{cap(p)}</option>)}</select></L>
      </div>
      <L label="Description"><textarea rows={3} maxLength={5000} value={f.description} onChange={set("description")} className={field} /></L>
      <ContactSelect value={f.contact_id} onChange={(id) => setF({ ...f, contact_id: id })} />
      <LeadSelect value={f.lead_id} onChange={(id) => setF({ ...f, lead_id: id })} />
    </FormModal>
  );
}

export function LeadFormModal({ lead, preset, onClose, onSaved, onDelete }: { onDelete?: () => void; lead?: Lead | null; preset?: { contact_id?: string }; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ title: lead?.title ?? "", status: lead?.status ?? "new", value: lead?.value != null ? String(lead.value) : "", expected_close: lead?.expected_close ?? "", contact_id: lead?.contact_id ?? preset?.contact_id ?? "", notes: lead?.notes ?? "" });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const save = useSaver("leads", lead?.id, onSaved, onClose, "Lead");
  return (
    <FormModal title={lead ? "Edit lead" : "Add lead"} onDelete={lead ? onDelete : undefined} onClose={onClose} onSubmit={() => save(f)}>
      <L label="Title" hint="For example, “Website redesign for ABC”."><input data-autofocus required maxLength={160} value={f.title} onChange={set("title")} className={field} /></L>
      <div className="grid gap-4 sm:grid-cols-2">
        <L label="Stage"><select value={f.status} onChange={set("status")} className={field}>{STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}</select></L>
        <L label="Value"><input type="number" min={0} step="0.01" value={f.value} onChange={set("value")} className={field} /></L>
      </div>
      <L label="Expected close date"><input type="date" value={f.expected_close} onChange={set("expected_close")} className={field} /></L>
      <ContactSelect value={f.contact_id} onChange={(id) => setF({ ...f, contact_id: id })} />
      <L label="Notes"><textarea rows={3} maxLength={5000} value={f.notes} onChange={set("notes")} className={field} /></L>
    </FormModal>
  );
}

export function ActivityFormModal({ activity, preset, onClose, onSaved, onDelete }: { onDelete?: () => void; activity?: Activity | null; preset?: { contact_id?: string }; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ type: activity?.type ?? "note", summary: activity?.summary ?? "", details: activity?.details ?? "", when: toLocalInput(activity?.occurred_at), contact_id: activity?.contact_id ?? preset?.contact_id ?? "" });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const save = useSaver("activities", activity?.id, onSaved, onClose, "Activity");
  return (
    <FormModal title={activity ? "Edit activity" : "Log activity"} onDelete={activity ? onDelete : undefined} onClose={onClose} onSubmit={() => save({ type: f.type, summary: f.summary, details: f.details, contact_id: f.contact_id, occurred_at: f.when ? fromLocalInput(f.when) : undefined })}>
      <div className="grid gap-4 sm:grid-cols-2">
        <L label="Type"><select value={f.type} onChange={set("type")} className={field}>{ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{cap(t)}</option>)}</select></L>
        <L label="When"><input type="datetime-local" value={f.when} onChange={set("when")} className={field} /></L>
      </div>
      <L label="Summary"><input data-autofocus required maxLength={2000} value={f.summary} onChange={set("summary")} className={field} /></L>
      <L label="Details"><textarea rows={4} maxLength={8000} value={f.details} onChange={set("details")} className={field} /></L>
      <ContactSelect value={f.contact_id} onChange={(id) => setF({ ...f, contact_id: id })} />
    </FormModal>
  );
}

export function CallFormModal({ call, preset, onClose, onSaved, onDelete }: { onDelete?: () => void; call?: Call | null; preset?: { contact_id?: string }; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ summary: call?.summary ?? "", notes: call?.notes ?? "", minutes: call?.duration_seconds != null ? String(Math.round(call.duration_seconds / 60)) : "", when: toLocalInput(call?.occurred_at), contact_id: call?.contact_id ?? preset?.contact_id ?? "" });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const save = useSaver("calls", call?.id, onSaved, onClose, "Call");
  return (
    <FormModal title={call ? "Edit call" : "Log a call"} onDelete={call ? onDelete : undefined} onClose={onClose} wide onSubmit={() => {
      if (!f.summary.trim() && !f.notes.trim()) throw new Error("Add a summary or notes.");
      return save({ summary: f.summary, notes: f.notes, duration_seconds: f.minutes ? Math.round(Number(f.minutes) * 60) : null, occurred_at: f.when ? fromLocalInput(f.when) : undefined, contact_id: f.contact_id });
    }}>
      <ContactSelect value={f.contact_id} onChange={(id) => setF({ ...f, contact_id: id })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <L label="When"><input type="datetime-local" value={f.when} onChange={set("when")} className={field} /></L>
        <L label="Length (minutes)"><input type="number" min={0} max={1440} value={f.minutes} onChange={set("minutes")} className={field} /></L>
      </div>
      <L label="Summary"><textarea data-autofocus rows={3} maxLength={5000} value={f.summary} onChange={set("summary")} className={field} /></L>
      <L label="Call notes"><textarea rows={5} maxLength={20000} value={f.notes} onChange={set("notes")} className={field} /></L>
    </FormModal>
  );
}

export { today };
