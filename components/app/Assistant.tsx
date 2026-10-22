"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, Send, X, Sparkles, Check } from "lucide-react";
import { useCrm } from "./Store";
import { interpret } from "@/lib/assistant";
import type { Action } from "@/lib/crm";

type Msg = { role: "ai" | "me"; text: string; actions?: Action[]; status?: "open" | "done" | "no" };
const label = (a: Action) =>
  a.kind === "contact" ? `Add contact: ${a.name}${a.company ? `, ${a.company}` : ""}${a.interest ? ` · ${a.interest} plan` : ""}`
  : a.kind === "task" ? `Create follow-up: ${a.title} (${a.due})`
  : a.kind === "move" ? `Move ${a.name} to ${a.stage}`
  : `Log note on ${a.name}: ${a.text}`;
const chips = ["Plan my day", "Met Rahul from ABC Technologies, he wants the Pro plan, follow up Tuesday", "Move Sam to Proposal"];
const orb = "bg-[radial-gradient(circle_at_30%_25%,#F6B08A,#C2501A_55%,#8a3410)]";

export default function Assistant() {
  const { contacts, tasks, apply, saveVoice } = useCrm();
  const due = tasks.filter((t) => !t.done && t.due === "Today").length;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "ai", text: `Welcome back. You have ${due} follow-up${due === 1 ? "" : "s"} due today. I can add contacts, schedule follow-ups and update your pipeline from a sentence or your voice. Try one of these:` }]);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { const t = setTimeout(() => setOpen(true), 900); return () => clearTimeout(t); }, []);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs, open]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  async function send(v: string) {
    const q = v.trim();
    if (!q || busy) return;
    setMsgs((m) => [...m, { role: "me", text: q }]);
    setText("");
    setBusy(true);
    let r: { reply: string; actions: Action[] };
    try {
      const res = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: q, contacts, tasks, today: new Date().toDateString() }) });
      if (!res.ok) throw new Error("offline");
      r = await res.json();
      setLive(true);
    } catch {
      setLive(false);
      r = interpret(q, contacts, tasks);
    }
    setBusy(false);
    setMsgs((m) => [...m, { role: "ai", text: r.reply, actions: r.actions?.length ? r.actions : undefined, status: "open" }]);
  }
  function decide(i: number, ok: boolean) {
    if (ok) msgs[i].actions?.forEach(apply);
    saveVoice(msgs[i - 1]?.text ?? "", msgs[i].actions ?? [], ok ? "confirmed" : "dismissed");
    setMsgs((ms) => ms.map((x, j) => (j === i ? { ...x, status: ok ? "done" : "no" } : x)));
  }
  function mic() {
    const W = window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any };
    const SR = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!SR) { setMsgs((m) => [...m, { role: "ai", text: "Voice input isn’t supported in this browser. Chrome or Edge work best, or you can type." }]); return; }
    const r = new SR();
    r.lang = "en-IN"; r.interimResults = false;
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.onresult = (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => send(e.results[0][0].transcript);
    r.start();
  }

  return (
    <>
      {open && (
        <section role="dialog" aria-label="Voice CRM assistant" className="pop fixed bottom-24 right-4 z-50 flex h-[min(34rem,calc(100vh-8rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
          <header className="flex items-center gap-3 border-b border-line px-4 py-3">
            <span className={`grid h-8 w-8 place-items-center rounded-full text-white ${orb}`}><Sparkles size={15} aria-hidden /></span>
            <div className="flex-1"><p className="text-sm font-semibold">Assistant</p><p className="text-xs text-ink/50">{live ? "Connected via OpenRouter" : "Offline mode: simulated AI"}</p></div>
            <button onClick={() => setOpen(false)} aria-label="Close assistant" className="p-1 text-ink/60 hover:text-ink"><X size={18} /></button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "me" ? "ml-8 rounded-2xl rounded-tr-sm bg-ink px-3 py-2 text-paper" : "mr-6 rounded-2xl rounded-tl-sm bg-paper px-3 py-2"}>
                <p>{m.text}</p>
                {m.actions && (
                  <div className="mt-2 rounded-lg border border-accent/30 bg-white p-2.5">
                    <ul className="space-y-1">{m.actions.map((a, k) => <li key={k} className="flex gap-2"><Check size={14} className="mt-0.5 shrink-0 text-accent" aria-hidden />{label(a)}</li>)}</ul>
                    {m.status === "open" ? (
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => decide(i, true)} className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white">Confirm</button>
                        <button onClick={() => decide(i, false)} className="rounded-md border border-ink/20 px-3 py-1.5 text-xs">Dismiss</button>
                      </div>
                    ) : <p className="mt-2 text-xs text-ink/50">{m.status === "done" ? "Done, updated your CRM." : "Dismissed."}</p>}
                  </div>
                )}
              </div>
            ))}
            {msgs.length === 1 && <div className="flex flex-col items-start gap-2">{chips.map((c) => <button key={c} onClick={() => send(c)} className="rounded-xl border border-line bg-white px-3 py-2 text-left text-xs hover:border-accent">{c}</button>)}</div>}
            {busy && <p className="text-xs text-ink/50">Thinking…</p>}
            <div ref={end} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="flex items-center gap-2 border-t border-line p-3">
            <button type="button" onClick={mic} aria-label="Speak" className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-white ${orb} ${listening ? "animate-pulse" : ""}`}><Mic size={16} /></button>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder={listening ? "Listening…" : "Tell me what happened…"} aria-label="Message the assistant" className="min-w-0 flex-1 rounded-lg border border-ink/20 px-3 py-2 text-sm" />
            <button aria-label="Send" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink text-paper"><Send size={15} /></button>
          </form>
        </section>
      )}
      <button onClick={() => setOpen(!open)} aria-label={open ? "Close assistant" : "Open assistant"} aria-expanded={open}
        className={`fixed bottom-5 right-4 z-50 grid h-14 w-14 place-items-center rounded-full text-white shadow-xl transition hover:scale-105 ${orb}`}>
        {!open && <span className="absolute inset-0 animate-ping rounded-full bg-accent/30" />}
        {open ? <X /> : <Sparkles />}
      </button>
    </>
  );
}
