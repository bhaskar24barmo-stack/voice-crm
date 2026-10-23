"use client";
import { useState } from "react";
import { Check, Copy, Loader2, Sparkles } from "lucide-react";
import { api, today } from "@/lib/client";
import { ErrorNote, L, PageHeader, btnP, btnS, field } from "./ui";
import { ContactSelect, LeadSelect } from "./forms";

type Key = "summarize_interactions" | "next_steps" | "draft_email" | "summarize_notes" | "action_items" | "workflow_help";
const TASKS: { key: Key; label: string; contact: boolean; lead: boolean; text: "none" | "optional" | "required" | "question"; sends: string }[] = [
  { key: "summarize_interactions", label: "Summarize a customer’s interactions", contact: true, lead: false, text: "none", sends: "the contact’s name, company, status, notes, tags, their 10 most recent activities, 5 recent call summaries and open task titles" },
  { key: "next_steps", label: "Suggest next steps for a lead", contact: true, lead: true, text: "none", sends: "the lead’s title, stage, value and notes, plus the linked contact’s name, company, notes and recent activity" },
  { key: "draft_email", label: "Draft a follow-up email", contact: true, lead: true, text: "none", sends: "the same record details as above, plus your goal for the email" },
  { key: "summarize_notes", label: "Summarize customer notes", contact: true, lead: false, text: "optional", sends: "the notes you paste, and the contact’s details if you pick one" },
  { key: "action_items", label: "Extract action items from call notes", contact: false, lead: false, text: "required", sends: "only the notes you paste" },
  { key: "workflow_help", label: "Ask about CRM workflows", contact: false, lead: false, text: "question", sends: "only your question. No customer data" },
];

export default function AssistantView({ aiReady, contactId = "", leadId = "" }: { aiReady: boolean; contactId?: string; leadId?: string }) {
  const [task, setTask] = useState<Key>(leadId ? "next_steps" : contactId ? "summarize_interactions" : "workflow_help");
  const [contact, setContact] = useState(contactId);
  const [lead, setLead] = useState(leadId);
  const [text, setText] = useState("");
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const t = TASKS.find((x) => x.key === task)!;

  async function run() {
    setBusy(true); setErr(""); setResult(""); setCopied(false);
    try {
      const j = await api<{ result: string }>("/api/ai", { body: { task, text: t.text === "none" ? undefined : text, instruction: task === "draft_email" ? instruction : undefined, contactId: t.contact ? contact || undefined : undefined, leadId: t.lead ? lead || undefined : undefined, today: today() } });
      setResult(j.result);
    } catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong."); }
    setBusy(false);
  }
  const valid = task === "summarize_interactions" ? !!contact : task === "next_steps" || task === "draft_email" ? !!(contact || lead) : task === "summarize_notes" ? !!(text.trim() || contact) : !!text.trim();
  const ready = aiReady && valid && !busy;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="AI assistant" desc="Summaries, action items, follow-up drafts and next-step ideas. You review everything. Nothing is sent or saved for you." />
      {!aiReady && <div role="status" className="mb-5 rounded-2xl border border-accent/30 bg-accent/5 p-4 text-sm"><p className="font-medium">The AI assistant isn’t configured yet.</p><p className="mt-1 text-ink/70">Set <code className="rounded bg-ink/5 px-1">OPENROUTER_API_KEY</code> and <code className="rounded bg-ink/5 px-1">OPENROUTER_MODEL</code> in your hosting environment, then redeploy.</p></div>}
      <div className="space-y-4 rounded-2xl border border-line bg-white p-5">
        <L label="What do you need?"><select value={task} onChange={(e) => { setTask(e.target.value as Key); setResult(""); setErr(""); }} className={field}>{TASKS.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}</select></L>
        {t.contact && <ContactSelect value={contact} onChange={setContact} />}
        {t.lead && <LeadSelect value={lead} onChange={setLead} />}
        {task === "draft_email" && <L label="What should the email achieve?" hint="Optional. For example, “book a demo next week”."><input value={instruction} maxLength={500} onChange={(e) => setInstruction(e.target.value)} className={field} /></L>}
        {t.text !== "none" && <L label={t.text === "question" ? "Your question" : t.text === "optional" ? "Notes to summarize (optional if you pick a contact)" : "Call notes"}><textarea rows={t.text === "question" ? 3 : 7} maxLength={8000} value={text} onChange={(e) => setText(e.target.value)} className={field} /></L>}
        <p className="rounded-xl bg-paper px-3.5 py-2.5 text-xs text-ink/65">When you run this, Voice CRM sends {t.sends} to the AI provider. Email addresses and phone numbers are never sent.</p>
        <button className={btnP} disabled={!ready} onClick={run}>{busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Sparkles size={16} aria-hidden />}{busy ? "Working…" : "Run"}</button>
      </div>
      {err && <div className="mt-4"><ErrorNote message={err} /></div>}
      {result && (
        <section aria-label="AI result" className="mt-4 rounded-2xl border border-line bg-white p-5">
          <div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-serif text-xl font-semibold">Result</h2>
            <button className={btnS} onClick={async () => { await navigator.clipboard.writeText(result); setCopied(true); }}>{copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}{copied ? "Copied" : "Copy"}</button></div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/85">{result}</p>
          <p className="mt-4 text-xs text-ink/50">AI-generated. Check facts, names and dates before you use it.</p>
        </section>
      )}
    </div>
  );
}
