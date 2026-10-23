"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail, KeyRound } from "lucide-react";

const field = "mt-1.5 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-base outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15";
const Google = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.5 17.7 9.5 24 9.5z" /><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.5-4.1 7-10.2 7-17.6z" /><path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" /><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" /></svg>
);

export default function AuthForm({ mode, supabaseUrl }: { mode: "login" | "signup"; supabaseUrl: string }) {
  const router = useRouter();
  const [method, setMethod] = useState<"password" | "link">("password");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState(""), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false);
  const link = mode === "login" && method === "link";

  const google = () => {
    const base = supabaseUrl;
    if (!base) { setErr("Google sign-in isn’t connected yet."); return; }
    window.location.href = `${base}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(`${window.location.origin}/auth/callback`)}`;
  };

  async function submit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault(); setErr(""); setMsg(""); setBusy(true);
    const d = Object.fromEntries(new FormData(ev.currentTarget));
    try {
      const r = await fetch(`/api/auth/${link ? "magic" : mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setErr(j.error || "Something went wrong."); else if (mode === "login" && !link) router.push("/account"); else setMsg(j.message);
    } catch { setErr("Network error. Please try again."); }
    setBusy(false);
  }

  return (
    <div>
      <button type="button" onClick={google} className="flex w-full items-center justify-center gap-3 rounded-xl border border-ink/15 bg-white px-4 py-3 font-medium shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><Google />Continue with Google</button>
      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-ink/40"><span className="h-px flex-1 bg-line" />or use email<span className="h-px flex-1 bg-line" /></div>
      {mode === "login" && (
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-ink/5 p-1 text-sm" role="tablist">
          {([["password", "Password", KeyRound], ["link", "Email me a link", Mail]] as const).map(([k, l, I]) => (
            <button key={k} type="button" role="tab" aria-selected={method === k} onClick={() => { setMethod(k); setErr(""); setMsg(""); }} className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${method === k ? "bg-white font-medium shadow-sm" : "text-ink/60"}`}><I size={14} aria-hidden />{l}</button>
          ))}
        </div>
      )}
      <form onSubmit={submit}>
        {mode === "signup" && <label className="mb-4 block text-sm font-medium">Name<input name="name" autoComplete="name" required className={field} /></label>}
        <label className="block text-sm font-medium">Email<input name="email" type="email" autoComplete="email" required className={field} /></label>
        {!link && (
          <label className="mt-4 block text-sm font-medium">Password
            <span className="relative block"><input name="password" type={show ? "text" : "password"} minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} required className={`${field} pr-12`} />
              <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/50 hover:text-ink">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></span>
            {mode === "signup" && <span className="mt-1 block text-xs font-normal text-ink/50">At least 8 characters.</span>}
          </label>
        )}
        {err && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        {msg && <p role="status" className="mt-4 rounded-lg bg-[#EAF5EC] px-3 py-2 text-sm text-[#1F6B34]">{msg}</p>}
        <button disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3.5 font-medium text-white transition hover:bg-[#a84315] disabled:opacity-60">{busy && <Loader2 size={18} className="animate-spin" aria-hidden />}{link ? "Send me a sign-in link" : mode === "login" ? "Log in" : "Create account"}</button>
      </form>
    </div>
  );
}
