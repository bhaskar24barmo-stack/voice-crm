"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { api } from "@/lib/client";
import { useDebounced, useList } from "@/lib/hooks";
import { CONTACT_STATUS, type Contact } from "@/lib/crm-types";
import { Badge, Confirm, ErrorNote, PageHeader, Spinner, btnP, btnS, field, useToast } from "./ui";
import { ContactFormModal } from "./forms";

export const statusTone = (s: string) => (s === "customer" ? "green" : s === "inactive" ? "gray" : "accent") as "green" | "gray" | "accent";

export default function ContactsView({ openNew }: { openNew: boolean }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const dq = useDebounced(q.trim());
  const list = useList<Contact>("contacts", { q: dq, status });
  const [form, setForm] = useState<Contact | "new" | null>(openNew ? "new" : null);
  const [del, setDel] = useState<Contact | null>(null);
  const toast = useToast();
  const filtered = Boolean(dq || status);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Contacts" desc="Everyone you work with, in one place." action={<button className={btnP} onClick={() => setForm("new")}><Plus size={16} aria-hidden />Add contact</button>} />
      <div className="mb-4 flex flex-wrap gap-3">
        <label className="relative min-w-[14rem] flex-1"><span className="sr-only">Search contacts</span>
          <Search size={16} aria-hidden className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, company or phone" className={`${field} !mt-0 pl-10`} />
        </label>
        <label><span className="sr-only">Filter by status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${field} !mt-0`}><option value="">All statuses</option>{CONTACT_STATUS.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select>
        </label>
      </div>

      {list.error && <ErrorNote message={list.error} onRetry={list.reload} />}
      {list.loading && !list.items.length && <Spinner label="Loading contacts" />}

      {!list.loading && !list.error && !list.items.length && (
        <div className="rounded-2xl border border-dashed border-ink/20 bg-white p-10 text-center">
          <Users className="mx-auto text-ink/30" size={32} aria-hidden />
          <h2 className="mt-3 font-serif text-xl font-semibold">{filtered ? "No contacts match that search" : "No contacts yet"}</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink/65">{filtered ? "Try a different name or clear the filters." : "Add your first contact to start tracking calls, leads and follow-ups."}</p>
          {!filtered && <button className={`${btnP} mt-4`} onClick={() => setForm("new")}><Plus size={16} aria-hidden />Add contact</button>}
        </div>
      )}

      {list.items.length > 0 && (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-line bg-white md:block">
            <table className="w-full text-sm">
              <thead className="bg-paper text-left text-ink/60"><tr><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Company</th><th className="px-4 py-3 font-medium">Email</th><th className="px-4 py-3 font-medium">Phone</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody className="divide-y divide-line">
                {list.items.map((c) => (
                  <tr key={c.id} className="hover:bg-paper/60">
                    <td className="px-4 py-3 font-medium"><Link href={`/account/contacts/${c.id}`} className="hover:text-accent">{c.name}</Link></td>
                    <td className="px-4 py-3 text-ink/70">{c.company}</td>
                    <td className="px-4 py-3 text-ink/70">{c.email}</td>
                    <td className="px-4 py-3 text-ink/70">{c.phone}</td>
                    <td className="px-4 py-3"><Badge tone={statusTone(c.status)}>{c.status}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3 text-right"><button className="px-2 text-accent hover:underline" onClick={() => setForm(c)}>Edit</button><button className="px-2 text-red-700 hover:underline" onClick={() => setDel(c)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-3 md:hidden">
            {list.items.map((c) => (
              <li key={c.id} className="rounded-2xl border border-line bg-white p-4">
                <div className="flex items-start justify-between gap-3"><Link href={`/account/contacts/${c.id}`} className="font-medium hover:text-accent">{c.name}</Link><Badge tone={statusTone(c.status)}>{c.status}</Badge></div>
                <p className="mt-1 text-sm text-ink/65">{[c.company, c.email, c.phone].filter(Boolean).join(" · ")}</p>
                <div className="mt-3 flex gap-4 text-sm"><button className="text-accent" onClick={() => setForm(c)}>Edit</button><button className="text-red-700" onClick={() => setDel(c)}>Delete</button></div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between text-sm text-ink/60">
            <span>Showing {list.items.length} of {list.total}</span>
            {list.hasMore && <button className={btnS} disabled={list.loading} onClick={list.loadMore}>Load more</button>}
          </div>
        </>
      )}

      {form && <ContactFormModal contact={form === "new" ? null : form} onClose={() => setForm(null)} onSaved={list.reload} />}
      {del && <Confirm title="Delete contact?" message={`“${del.name}” and their activities and calls will be permanently deleted. Their leads and tasks stay, but are unlinked.`} onCancel={() => setDel(null)} onConfirm={async () => { await api(`/api/crm/contacts/${del.id}`, { method: "DELETE" }); toast("Contact deleted."); setDel(null); list.reload(); }} />}
    </div>
  );
}
