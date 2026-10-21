"use client";
import { FormEvent, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { primary } from "./ui";

type Errs = { name?: string; email?: string };
const input = "mt-1 w-full rounded-lg border border-ink/20 bg-white px-4 py-3 text-base";

export default function Waitlist() {
  const [errs, setErrs] = useState<Errs>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [srv, setSrv] = useState("");

  async function submit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const d = new FormData(ev.currentTarget);
    const name = String(d.get("name") || "").trim();
    const email = String(d.get("email") || "").trim();
    const e: Errs = {};
    if (!name) e.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Please enter a valid email address.";
    setErrs(e);
    if (e.name || e.email) return;
    setBusy(true); setSrv("");
    try {
      const r = await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, website: String(d.get("website") || "") }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) setDone(name); else setSrv(j.error || "Something went wrong. Please try again.");
    } catch { setSrv("Network error. Please try again."); }
    setBusy(false);
  }

  if (done) return (
    <div role="status" className="rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
      <CheckCircle2 className="mx-auto text-accent" size={40} aria-hidden />
      <h3 className="mt-4 font-serif text-2xl font-semibold">You’re on the list, {done}.</h3>
      <p className="mt-2 text-ink/70">We’ll email you when early access opens.</p>
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="text-sm font-medium">Name *</label>
          <input id="name" name="name" autoComplete="name" required aria-invalid={!!errs.name} aria-describedby={errs.name ? "name-err" : undefined} className={input} />
          {errs.name && <p id="name-err" className="mt-1 text-sm text-red-700">{errs.name}</p>}
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-medium">Email *</label>
          <input id="email" name="email" type="email" autoComplete="email" required aria-invalid={!!errs.email} aria-describedby={errs.email ? "email-err" : undefined} className={input} />
          {errs.email && <p id="email-err" className="mt-1 text-sm text-red-700">{errs.email}</p>}
        </div>
        <div>
          <label htmlFor="company" className="text-sm font-medium">Company <span className="text-ink/50">(optional)</span></label>
          <input id="company" name="company" autoComplete="organization" className={input} />
        </div>
        <div>
          <label htmlFor="role" className="text-sm font-medium">Role <span className="text-ink/50">(optional)</span></label>
          <input id="role" name="role" autoComplete="organization-title" className={input} />
        </div>
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {srv && <p role="alert" className="mt-4 text-sm text-red-700">{srv}</p>}
      <button disabled={busy} className={`${primary} mt-6 w-full disabled:opacity-60`}>{busy ? "Joining…" : "Join the Waitlist"}</button>
      <p className="mt-3 text-center text-sm text-ink/60">Demo form: no backend is connected yet. We only ask for the fields shown here.</p>
    </form>
  );
}
