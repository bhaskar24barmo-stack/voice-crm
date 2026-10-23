"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, Kanban } from "lucide-react";
import { api, fmtDate, money } from "@/lib/client";
import { useList } from "@/lib/hooks";
import { STAGES, STAGE_LABEL, type Lead, type Stage } from "@/lib/crm-types";
import { Confirm, ErrorNote, PageHeader, Spinner, btnP, btnS, field, useToast } from "./ui";
import { LeadFormModal } from "./forms";

export default function LeadsView() {
  const list = useList<Lead>("leads", {}, 100);
  const [form, setForm] = useState<Lead | "new" | null>(null);
  const [del, setDel] = useState<Lead | null>(null);
  const toast = useToast();

  async function move(l: Lead, status: Stage) {
    const prev = list.items;
    list.setItems(prev.map((x) => (x.id === l.id ? { ...x, status } : x))); // optimistic
    try { await api(`/api/crm/leads/${l.id}`, { method: "PATCH", body: { status } }); toast(`Moved to ${STAGE_LABEL[status]}.`); }
    catch (e) { list.setItems(prev); toast(e instanceof Error ? e.message : "Couldn’t move the lead.", "err"); }
  }

  return (
    <div className="mx-auto max-w-[96rem]">
      <PageHeader title="Leads & pipeline" desc="Track every opportunity from first contact to won or lost." action={<button className={btnP} onClick={() => setForm("new")}><Plus size={16} aria-hidden />Add lead</button>} />
      {list.error && <ErrorNote message={list.error} onRetry={list.reload} />}
      {list.loading && !list.items.length && <Spinner label="Loading pipeline" />}
      {!list.loading && !list.error && !list.items.length ? (
        <div className="rounded-2xl border border-dashed border-ink/20 bg-white p-10 text-center">
          <Kanban className="mx-auto text-ink/30" size={32} aria-hidden />
          <h2 className="mt-3 font-serif text-xl font-semibold">No leads yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink/65">Add a lead to see it move through New, Contacted, Qualified, Proposal, Won and Lost.</p>
          <button className={`${btnP} mt-4`} onClick={() => setForm("new")}><Plus size={16} aria-hidden />Add lead</button>
        </div>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0">
          <div className="grid min-w-max grid-flow-col auto-cols-[16.5rem] gap-3 lg:min-w-0 lg:auto-cols-fr">
            {STAGES.map((s) => {
              const col = list.items.filter((l) => l.status === s);
              const sum = col.reduce((a, l) => a + (l.value ?? 0), 0);
              return (
                <section key={s} aria-label={STAGE_LABEL[s]} className="rounded-2xl bg-ink/[.04] p-3">
                  <h2 className="mb-3 flex items-center justify-between text-sm font-medium"><span>{STAGE_LABEL[s]}</span><span className="rounded-full bg-white px-2 py-0.5 text-xs text-ink/60">{col.length}</span></h2>
                  {sum > 0 && <p className="-mt-1 mb-3 text-xs text-ink/55">{money(sum)}</p>}
                  <ul className="space-y-2.5">
                    {col.map((l) => (
                      <li key={l.id} className="rounded-xl border border-line bg-white p-3 shadow-sm">
                        <button className="text-left text-sm font-semibold hover:text-accent" onClick={() => setForm(l)}>{l.title}</button>
                        {l.contact && <p className="mt-0.5 text-xs text-ink/60"><Link href={`/account/contacts/${l.contact.id}`} className="hover:text-accent">{l.contact.name}</Link>{l.contact.company ? ` · ${l.contact.company}` : ""}</p>}
                        <p className="mt-2 flex items-center justify-between text-xs text-ink/60"><span className="font-medium text-accent">{money(l.value)}</span>{l.expected_close && <span>Close {fmtDate(l.expected_close)}</span>}</p>
                        <label className="mt-2 block text-xs text-ink/55">Stage
                          <select value={l.status} onChange={(e) => move(l, e.target.value as Stage)} className={`${field} !mt-1 !py-1.5 !text-xs`}>{STAGES.map((x) => <option key={x} value={x}>{STAGE_LABEL[x]}</option>)}</select>
                        </label>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      )}
      {list.hasMore && <div className="mt-2 text-center"><button className={btnS} disabled={list.loading} onClick={list.loadMore}>Load more leads</button></div>}

      {form && <LeadFormModal lead={form === "new" ? null : form} onDelete={() => { if (form !== "new") { setDel(form); setForm(null); } }} onClose={() => setForm(null)} onSaved={list.reload} />}
      {del && <Confirm title="Delete lead?" message={`“${del.title}” will be permanently deleted. Linked tasks stay, but are unlinked.`} onCancel={() => setDel(null)} onConfirm={async () => { await api(`/api/crm/leads/${del.id}`, { method: "DELETE" }); toast("Lead deleted."); setDel(null); list.reload(); }} />}
    </div>
  );
}
