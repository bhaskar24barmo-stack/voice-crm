"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Send, X } from "lucide-react";
import { api } from "@/lib/client";

type Mood = "idle" | "think" | "happy";
type Look = { x: number; y: number };

// The character. Pupils follow `look`; the mouth changes with `mood`.
export function JellyFace({ size, look = { x: 0, y: 0 }, mood = "idle", className = "" }: { size: number; look?: Look; mood?: Mood; className?: string }) {
  const px = look.x * 3, py = look.y * 3;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className={className} style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id="jelly-body" cx="35%" cy="25%" r="85%"><stop offset="0" stopColor="#F59A5E" /><stop offset=".55" stopColor="#E0652A" /><stop offset="1" stopColor="#B8440F" /></radialGradient>
      </defs>
      <ellipse cx="50" cy="94" rx="30" ry="4.5" fill="#191919" opacity=".12" />
      <path d="M50 12 C75 12 91 33 89 58 C87 79 72 90 50 90 C28 90 13 79 11 58 C9 33 25 12 50 12 Z" fill="url(#jelly-body)" />
      <ellipse cx="33" cy="29" rx="11" ry="6" fill="#fff" opacity=".4" transform="rotate(-28 33 29)" />
      <circle cx="26" cy="64" r="5" fill="#FF8FA3" opacity=".4" /><circle cx="74" cy="64" r="5" fill="#FF8FA3" opacity=".4" />
      <g className="jelly-eye"><circle cx="37" cy="50" r="9" fill="#fff" /><circle cx="63" cy="50" r="9" fill="#fff" />
        <circle cx={37 + px} cy={50 + py} r="4.6" fill="#191919" /><circle cx={63 + px} cy={50 + py} r="4.6" fill="#191919" />
        <circle cx={38.6 + px} cy={48.4 + py} r="1.4" fill="#fff" /><circle cx={64.6 + px} cy={48.4 + py} r="1.4" fill="#fff" /></g>
      {mood === "think" ? <ellipse cx="50" cy="70" rx="3.6" ry="4.4" fill="#5A1F05" />
        : mood === "happy" ? <path d="M40 66 Q50 80 60 66 Z" fill="#5A1F05" />
        : <path d="M41 67 Q50 74 59 67" fill="none" stroke="#5A1F05" strokeWidth="3" strokeLinecap="round" />}
    </svg>
  );
}

const SUGGESTIONS = ["How should I follow up after a demo?", "What’s a good way to qualify a lead?", "How do I run a weekly pipeline review?"];
type Msg = { from: "me" | "jelly"; text: string };

function Panel({ aiReady, wander, setWander, onClose }: { aiReady: boolean; wander: boolean; setWander: (v: boolean) => void; onClose: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [mood, setMood] = useState<Mood>("idle");
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { input.current?.focus(); const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k); }, [onClose]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, busy]);

  async function ask(text: string) {
    const t = text.trim(); if (!t || busy) return;
    setMsgs((m) => [...m, { from: "me", text: t }]); setQ(""); setBusy(true); setErr(""); setMood("think");
    try { const j = await api<{ result: string }>("/api/ai", { body: { task: "workflow_help", text: t } }); setMsgs((m) => [...m, { from: "jelly", text: j.result }]); setMood("happy"); }
    catch (e) { setErr(e instanceof Error ? e.message : "Jelly got confused. Try again."); setMood("idle"); }
    setBusy(false);
  }

  return (
    <div role="dialog" aria-label="Ask Jelly" className="sheet-up fixed inset-x-3 bottom-[5.5rem] z-[55] flex max-h-[70vh] flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-2xl sm:left-auto sm:right-4 sm:w-[24rem] lg:bottom-4">
      <div className="flex items-center gap-3 bg-gradient-to-r from-accent/15 to-transparent px-4 py-3">
        <JellyFace size={40} mood={mood} className={busy ? "jelly-think" : "jelly-idle"} />
        <div className="min-w-0 flex-1"><p className="font-serif text-lg font-semibold leading-tight">Jelly</p><p className="text-xs text-ink/60">Your CRM helper</p></div>
        <button onClick={onClose} aria-label="Close Jelly" className="rounded-lg p-2 text-ink/60 hover:bg-ink/5"><X size={18} /></button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm" aria-live="polite">
        {!aiReady && <p className="rounded-xl bg-accent/10 p-3 text-ink/80">I’m asleep for now. An admin needs to set <code>OPENROUTER_API_KEY</code> and <code>OPENROUTER_MODEL</code> to wake me up.</p>}
        {aiReady && !msgs.length && (<>
          <p className="text-ink/75">Hi! Ask me how to handle a sales situation or a CRM workflow. I can’t see your customer records here. For summaries of a contact, use the <Link href="/account/assistant" className="text-accent underline">AI assistant</Link>.</p>
          <div className="flex flex-wrap gap-2">{SUGGESTIONS.map((s) => <button key={s} onClick={() => ask(s)} className="rounded-full border border-line bg-paper px-3 py-1.5 text-left text-xs hover:border-accent/50">{s}</button>)}</div>
        </>)}
        {msgs.map((m, i) => <div key={i} className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 ${m.from === "me" ? "ml-auto bg-ink text-paper" : "bg-paper text-ink/90"}`}>{m.text}</div>)}
        {busy && <p className="text-xs text-ink/55">Jelly is thinking…</p>}
        {err && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); ask(q); }} className="flex gap-2 border-t border-line p-3">
        <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} disabled={!aiReady} maxLength={1000} placeholder="Ask Jelly…" aria-label="Ask Jelly" className="min-w-0 flex-1 rounded-xl border border-ink/15 px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:bg-ink/5" />
        <button disabled={!aiReady || busy || !q.trim()} aria-label="Send" className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-white disabled:opacity-50"><Send size={16} /></button>
      </form>
      <label className="flex items-center gap-2 border-t border-line px-4 py-2.5 text-xs text-ink/60"><input type="checkbox" checked={wander} onChange={(e) => setWander(e.target.checked)} className="accent-[#C2501A]" />Let Jelly wander around the screen</label>
    </div>
  );
}

export default function Jelly({ aiReady }: { aiReady: boolean }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [size, setSize] = useState(76);
  const [moving, setMoving] = useState(false);
  const [look, setLook] = useState<Look>({ x: 0, y: 0 });
  const [open, setOpen] = useState(false);
  const [wander, setWanderState] = useState(true);
  const [pop, setPop] = useState(false);
  const el = useRef<HTMLButtonElement>(null);
  const reduced = useRef(false);
  const flags = useRef({ wander: true, open: false });
  flags.current = { wander, open };
  const lastPointer = useRef(0);

  const bounds = () => {
    const w = window.innerWidth, h = window.innerHeight, mobile = w < 1024, s = mobile ? 56 : 76, bottom = mobile ? 96 : 20;
    return { s, minX: 8, maxX: Math.max(8, w - s - 8), minY: mobile ? h - s - bottom : Math.max(96, h * 0.45), maxY: h - s - bottom };
  };
  const setWander = (v: boolean) => { setWanderState(v); try { localStorage.setItem("jelly-wander", v ? "1" : "0"); } catch { /* storage unavailable */ } };

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try { if (localStorage.getItem("jelly-wander") === "0") setWanderState(false); } catch { /* storage unavailable */ }
    const dock = () => { const b = bounds(); setSize(b.s); setPos({ x: b.maxX, y: b.maxY }); };
    dock();
    window.addEventListener("resize", dock);

    let raf = 0;
    const onPointer = (e: PointerEvent) => {
      lastPointer.current = Date.now();
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0; const r = el.current?.getBoundingClientRect(); if (!r) return;
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), d = Math.hypot(dx, dy) || 1;
        setLook({ x: dx / d, y: dy / d });
      });
    };
    window.addEventListener("pointermove", onPointer);

    let timer: number, stop: number;
    const hop = () => {
      const f = flags.current;
      if (f.wander && !f.open && !reduced.current && !document.hidden) {
        const b = bounds();
        const x = b.minX + Math.random() * (b.maxX - b.minX), y = b.minY + Math.random() * (b.maxY - b.minY);
        setPos((p) => { if (p && Date.now() - lastPointer.current > 3000) setLook({ x: Math.sign(x - p.x), y: 0 }); return { x, y }; });
        setMoving(true);
        window.clearTimeout(stop); stop = window.setTimeout(() => { setMoving(false); setLook({ x: 0, y: 0 }); }, 2800);
      }
      timer = window.setTimeout(hop, 5000 + Math.random() * 4000);
    };
    timer = window.setTimeout(hop, 3500);
    return () => { window.removeEventListener("resize", dock); window.removeEventListener("pointermove", onPointer); window.clearTimeout(timer); window.clearTimeout(stop); if (raf) cancelAnimationFrame(raf); };
  }, []);

  if (!pos) return null;
  return (
    <>
      {!open && (
        <div className="jelly-travel pointer-events-none fixed left-0 top-0 z-40" style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}>
          <button ref={el} onClick={() => { setPop(true); setTimeout(() => setPop(false), 500); setOpen(true); }} aria-label="Ask Jelly, your CRM helper" className="pointer-events-auto block rounded-full outline-none focus-visible:ring-4 focus-visible:ring-accent/40">
            <JellyFace size={size} look={look} className={pop ? "jelly-pop" : moving ? "jelly-move" : "jelly-idle"} />
          </button>
        </div>
      )}
      {open && <Panel aiReady={aiReady} wander={wander} setWander={setWander} onClose={() => { setOpen(false); el.current?.focus(); }} />}
    </>
  );
}
