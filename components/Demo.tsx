"use client";
import { useState } from "react";
import { Check, Mic } from "lucide-react";
import { primary, secondary } from "./ui";

const out = ["Meeting note saved", "Rahul’s contact record updated", "Pro plan interest recorded", "Follow-up task prepared for next Tuesday"];

export default function Demo() {
  const [s, setS] = useState<"idle" | "review" | "done">("idle");
  return (
    <div className="mt-10 grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <p className="mb-3 flex items-center gap-2 text-sm font-medium text-ink/60"><Mic size={16} aria-hidden />You say</p>
        <p className="font-serif text-xl leading-snug">“Met Rahul from ABC Technologies today. He’s interested in the Pro plan. Follow up next Tuesday.”</p>
        {s === "idle"
          ? <button onClick={() => setS("review")} className={`${primary} mt-6`}>See what the AI prepares</button>
          : <button onClick={() => setS("idle")} className={`${secondary} mt-6`}>Reset example</button>}
      </div>
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm" aria-live="polite">
        <p className="mb-3 text-sm font-medium text-ink/60">{s === "done" ? "Confirmed (example)" : "Proposed CRM updates"}</p>
        {s === "idle" ? <p className="text-ink/50">Your structured update appears here.</p> : (
          <ul className="space-y-3">{out.map((o) => <li key={o} className="flex gap-3"><Check className="mt-0.5 shrink-0 text-accent" size={18} aria-hidden />{o}</li>)}</ul>
        )}
        {s === "review" && (
          <div className="mt-6">
            <button onClick={() => setS("done")} className={primary}>Confirm update</button>
            <p className="mt-3 text-sm text-ink/60">You review, and can edit, everything before anything is saved.</p>
          </div>
        )}
        {s === "done" && <p className="mt-6 text-sm text-ink/60">Interactive example only. Nothing was saved.</p>}
      </div>
    </div>
  );
}
