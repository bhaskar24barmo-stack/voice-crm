"use client";
import { useMemo, useRef, useState } from "react";
import { Check, Mic, Square, Sparkles, RotateCcw } from "lucide-react";
import { primary, secondary } from "./ui";

const SAMPLE = "Met Rahul from ABC Technologies today. He’s interested in the Pro plan. Follow up next Tuesday.";
type Field = { label: string; value: string };

// Small on-device heuristic parser: it powers this illustration only, not the real product.
function extract(t: string): Field[] {
  const f: Field[] = [];
  const co = t.match(/\b(?:from|at|of)\s+([A-Z][\w&.-]*(?:\s+[A-Z][\w&.-]*)*)/);
  const who = t.match(/\b(?:[Mm]et|[Cc]alled|[Ss]poke (?:to|with)|[Aa]dd|[Mm]eeting with|[Ee]mailed)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/);
  const plan = t.match(/\b(Free|Starter|Pro|Business)\s+plan\b/i);
  const amt = t.match(/[$₹€£]\s?\d[\d,.]*\s?[kKmM]?/);
  const when = t.match(/\b((?:next |this )?(?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day|tomorrow|next week|next month|in \d+ (?:days|weeks))\b/i);
  const act = t.match(/\b(met|meeting|called|call|spoke|emailed|demo)\b/i);
  if (who) f.push({ label: "Contact", value: who[1] });
  if (co) f.push({ label: "Company", value: co[1] });
  if (plan) f.push({ label: "Interest", value: `${plan[1][0].toUpperCase()}${plan[1].slice(1).toLowerCase()} plan` });
  if (amt) f.push({ label: "Deal value", value: amt[0].trim() });
  if (act) f.push({ label: "Activity", value: /met|meeting/i.test(act[1]) ? "Meeting note" : /call|spoke/i.test(act[1]) ? "Call note" : "Note" });
  if (when && /follow|remind|schedule|call|meet/i.test(t)) f.push({ label: "Follow-up task", value: when[1][0].toUpperCase() + when[1].slice(1) });
  return f;
}

export default function SmartDemo() {
  const [text, setText] = useState(SAMPLE);
  const [stage, setStage] = useState<"edit" | "review" | "done">("edit");
  const [listening, setListening] = useState(false);
  const rec = useRef<any>(null);
  const fields = useMemo(() => extract(text), [text]);
  const SR = typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;

  const toggleMic = () => {
    if (listening) { rec.current?.stop(); return; }
    try {
      const r = new SR(); r.lang = "en-US"; r.interimResults = true; r.continuous = false;
      r.onresult = (e: any) => setText(Array.from(e.results).map((x: any) => x[0].transcript).join(" "));
      r.onend = () => setListening(false); r.onerror = () => setListening(false);
      rec.current = r; r.start(); setListening(true); setStage("edit");
    } catch { setListening(false); }
  };

  return (
    <div className="mt-10 grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <p className="mb-3 flex items-center justify-between text-sm font-medium text-ink/60">
          <span className="flex items-center gap-2"><Mic size={16} aria-hidden />You say (edit it, or try your voice)</span>
          {listening && <span className="flex items-center gap-1.5 text-accent"><span className="h-2 w-2 animate-pulse rounded-full bg-accent" />Listening</span>}
        </p>
        <textarea value={text} onChange={(e) => { setText(e.target.value); setStage("edit"); }} rows={5} aria-label="Describe what happened"
          className="w-full resize-none rounded-xl border border-line bg-paper p-3 font-serif text-lg leading-snug outline-none focus:border-accent" />
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={() => setStage("review")} disabled={!fields.length} className={`${primary} disabled:opacity-50`}><Sparkles size={16} aria-hidden />Prepare CRM updates</button>
          {SR && <button onClick={toggleMic} className={secondary}>{listening ? <Square size={14} aria-hidden /> : <Mic size={16} aria-hidden />}{listening ? "Stop" : "Speak"}</button>}
          <button onClick={() => { setText(SAMPLE); setStage("edit"); }} className={secondary} aria-label="Reset example"><RotateCcw size={16} aria-hidden /></button>
        </div>
      </div>
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm" aria-live="polite">
        <p className="mb-3 text-sm font-medium text-ink/60">{stage === "done" ? "Confirmed (example)" : "Proposed CRM updates"}</p>
        {stage === "edit" ? <p className="text-ink/50">Press “Prepare CRM updates” to see structured fields appear here.</p> : (
          <ul className="space-y-2.5">
            {fields.map((x, i) => (
              <li key={x.label + i} className="deal-in flex items-center gap-3 rounded-xl border border-line bg-paper px-3 py-2" style={{ animationDelay: `${i * 90}ms`, animationFillMode: "backwards" }}>
                <Check className="shrink-0 text-accent" size={16} aria-hidden />
                <span className="w-28 shrink-0 text-xs font-medium uppercase tracking-wider text-ink/50">{x.label}</span>
                <span className="font-medium">{x.value}</span>
              </li>
            ))}
          </ul>
        )}
        {stage === "review" && <div className="mt-5"><button onClick={() => setStage("done")} className={primary}>Confirm update</button><p className="mt-3 text-sm text-ink/60">You review, and can edit, everything before anything is saved.</p></div>}
        {stage === "done" && <p className="mt-5 text-sm text-ink/60">Interactive example only. Nothing was saved or sent anywhere.</p>}
      </div>
    </div>
  );
}
