"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, Check, ListTodo, Loader2, Mic, Receipt, Send, Square, StickyNote, Undo2, UserPlus } from "lucide-react";
import { api, fmtDate, today } from "@/lib/client";
import { haptic } from "@/lib/haptic";
import { burst } from "./fx";

type Created = { kind: string; resource: "activities" | "tasks" | "contacts"; id: string; title: string; due_date: string | null; contact: string | null };
type Phase = "idle" | "listening" | "transcribing" | "understanding" | "done" | "error";
const MAX_SECS = 180;
const EXAMPLES = ["“Aaj Rahul se call hui, usne price puchha.”", "“Kal ka petrol kharcha 800 rupaye tha.”", "“Kal client office aayega, demo ready rakhna.”", "“Add Priya from Northwind, Friday ko follow up.”"];
const ICON: Record<string, typeof Mic> = { note: StickyNote, task: ListTodo, meeting: CalendarClock, expense: Receipt, contact: UserPlus };
const LABEL: Record<string, string> = { note: "Note", task: "Task", meeting: "Meeting", expense: "Expense", contact: "New contact" };
const HREF: Record<Created["resource"], (c: Created) => string> = { tasks: () => "/account/tasks", activities: () => "/account/activities", contacts: (c) => `/account/contacts/${c.id}` };

export default function VoiceCapture({ sttReady, aiReady }: { sttReady: boolean; aiReady: boolean }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [secs, setSecs] = useState(0);
  const [heard, setHeard] = useState("");
  const [created, setCreated] = useState<Created[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [undone, setUndone] = useState(false);
  const [err, setErr] = useState("");
  const [typed, setTyped] = useState("");
  const [consent, setConsent] = useState(false);
  const [askConsent, setAskConsent] = useState(false);
  const [ex, setEx] = useState(0);
  const orb = useRef<HTMLDivElement>(null);
  const mr = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const bytes = useRef(0);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<number>();
  const audioCtx = useRef<AudioContext | null>(null);
  const raf = useRef(0);

  useEffect(() => { try { setConsent(localStorage.getItem("vc-voice-ok") === "1"); } catch { /* storage unavailable */ } }, []);
  useEffect(() => { const t = window.setInterval(() => setEx((x) => (x + 1) % EXAMPLES.length), 3800); return () => window.clearInterval(t); }, []);
  const cleanup = () => { stream.current?.getTracks().forEach((t) => t.stop()); window.clearInterval(timer.current); cancelAnimationFrame(raf.current); audioCtx.current?.close().catch(() => {}); audioCtx.current = null; orb.current?.style.setProperty("--lvl", "0"); };
  useEffect(() => cleanup, []);

  function meter(s: MediaStream) {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ac = new AC(); audioCtx.current = ac;
      const an = ac.createAnalyser(); an.fftSize = 256; ac.createMediaStreamSource(s).connect(an);
      const buf = new Uint8Array(an.fftSize);
      const loop = () => { an.getByteTimeDomainData(buf); let sum = 0; for (let i = 0; i < buf.length; i++) { const d = (buf[i] - 128) / 128; sum += d * d; } orb.current?.style.setProperty("--lvl", String(Math.min(1, Math.sqrt(sum / buf.length) * 4))); raf.current = requestAnimationFrame(loop); };
      loop();
    } catch { /* the orb still animates without live levels */ }
  }

  async function start() {
    setErr(""); setCreated([]); setUndone(false); setHeard("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setErr("Recording isn’t supported in this browser. Type your note below instead."); setPhase("error"); return; }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s; meter(s);
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported(m));
      const r = new MediaRecorder(s, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: 24000 });
      chunks.current = []; bytes.current = 0;
      r.ondataavailable = (e) => { if (e.data.size) { chunks.current.push(e.data); bytes.current += e.data.size; if (bytes.current > 3.8 * 1024 * 1024 && r.state === "recording") r.stop(); } };
      r.onstop = () => { cleanup(); process(new Blob(chunks.current, { type: r.mimeType || "audio/webm" })); };
      r.start(1000); mr.current = r; setSecs(0); setPhase("listening"); haptic(20);
      timer.current = window.setInterval(() => setSecs((x) => { if (x + 1 >= MAX_SECS && r.state === "recording") r.stop(); return x + 1; }), 1000);
    } catch { cleanup(); setErr("Microphone access was blocked. Allow it in your browser’s address bar, or type your note below."); setPhase("error"); }
  }
  const stop = () => { if (mr.current?.state === "recording") { haptic(12); mr.current.stop(); } };

  async function process(blob: Blob) {
    if (blob.size < 1500) { setErr("I didn’t catch anything. Tap the orb and try again."); setPhase("error"); return; }
    setPhase("transcribing");
    try {
      const fd = new FormData();
      fd.append("file", blob, `note.${blob.type.includes("mp4") ? "m4a" : "webm"}`);
      fd.append("consent", "yes");
      const t = await api<{ text: string }>("/api/voice/transcribe", { form: fd });
      await save(t.text);
    } catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong."); setPhase("error"); }
  }

  async function save(text: string, mode?: "note") {
    setPhase("understanding"); setHeard(text); setErr("");
    try {
      const j = await api<{ created: Created[]; skipped: number }>("/api/capture", { body: { text, today: today(), mode } });
      setCreated(j.created); setSkipped(j.skipped); setUndone(false); setPhase("done"); setTyped("");
      if (j.created.length) { haptic([15, 50, 15]); const r = orb.current?.getBoundingClientRect(); if (r) burst(r.left + r.width / 2, r.top + r.height / 2); }
      router.refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : "Couldn’t save that."); setPhase("error"); }
  }

  async function undo() {
    await Promise.all(created.map((c) => api(`/api/crm/${c.resource}/${c.id}`, { method: "DELETE" }).catch(() => {})));
    setUndone(true); router.refresh();
  }

  const onOrb = () => {
    if (phase === "listening") return stop();
    if (phase === "transcribing" || phase === "understanding") return;
    if (!sttReady) { setErr("Voice needs a transcription service. Type your note below for now."); setPhase("error"); return; }
    if (!consent) { setAskConsent(true); return; }
    start();
  };
  const onOrbRef = useRef<() => void>(() => {});
  onOrbRef.current = onOrb;
  useEffect(() => {
    const h = () => onOrbRef.current();
    window.addEventListener("vc:voice", h);
    let t: number | undefined;
    try { if (sessionStorage.getItem("vc-autostart") === "1") { sessionStorage.removeItem("vc-autostart"); t = window.setTimeout(h, 500); } } catch { /* storage unavailable */ }
    return () => { window.removeEventListener("vc:voice", h); window.clearTimeout(t); };
  }, []);
  const busy = phase === "transcribing" || phase === "understanding";
  const mmss = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  const status = phase === "listening" ? `Listening… ${mmss}` : phase === "transcribing" ? "Transcribing…" : phase === "understanding" ? "Understanding and saving…" : phase === "done" ? "Saved" : "Tap and speak";

  return (
    <div className="flex flex-col items-center">
      <div className={`relative grid place-items-center ${phase === "listening" ? "listening" : ""}`}>
        {phase === "listening" && <><span className="orb-ring h-44 w-44 sm:h-48 sm:w-48" style={{ position: "absolute" }} /><span className="orb-ring h-44 w-44 sm:h-48 sm:w-48" style={{ position: "absolute", animationDelay: ".8s" }} /><span className="orb-ring h-44 w-44 sm:h-48 sm:w-48" style={{ position: "absolute", animationDelay: "1.6s" }} /></>}
        <div ref={orb} className="orb-wrap">
          <button onClick={onOrb} disabled={busy} aria-label={phase === "listening" ? "Stop and save" : "Start a voice note"} className="orb-core relative grid h-44 w-44 place-items-center text-white outline-none transition focus-visible:ring-4 focus-visible:ring-white/60 disabled:cursor-wait sm:h-48 sm:w-48">
            {busy ? <Loader2 size={44} className="animate-spin" aria-hidden /> : phase === "listening" ? <Square size={38} fill="currentColor" aria-hidden /> : phase === "done" ? <Check size={46} aria-hidden /> : <Mic size={46} aria-hidden />}
          </button>
        </div>
      </div>
      <div className={`mt-5 flex h-8 items-end gap-1 ${phase === "listening" ? "listening" : ""}`} aria-hidden>
        {Array.from({ length: 21 }).map((_, i) => <span key={i} className="orb-bar block h-8 w-1 rounded-full" style={{ animationDelay: `${(i * 97) % 700}ms`, animationDuration: `${700 + ((i * 131) % 500)}ms` }} />)}
      </div>
      <p role="status" aria-live="polite" className="mt-3 text-base font-medium text-paper">{status}</p>
      {phase === "idle" && <p key={ex} className="swap-in mt-1 min-h-[2.5rem] max-w-xs text-center text-sm text-paper/60">Try saying {EXAMPLES[ex]}</p>}

      {askConsent && (
        <div role="dialog" aria-label="Voice permission" className="fade-in mt-4 w-full max-w-sm rounded-2xl bg-white/10 p-4 text-sm text-paper/85 backdrop-blur">
          <p>I’ll listen only while you’re recording. Record your own notes, or calls where everyone agrees. The audio goes to the transcription service and isn’t stored by Voice CRM.</p>
          <div className="mt-3 flex gap-2"><button className="rounded-xl bg-accent px-4 py-2 font-medium text-white" onClick={() => { try { localStorage.setItem("vc-voice-ok", "1"); } catch { /* storage unavailable */ } setConsent(true); setAskConsent(false); start(); }}>Got it, start</button><button className="rounded-xl px-4 py-2 text-paper/70 hover:bg-white/10" onClick={() => setAskConsent(false)}>Not now</button></div>
        </div>
      )}

      {phase === "error" && <p role="alert" className="fade-in mt-4 max-w-sm rounded-xl bg-red-500/15 px-4 py-3 text-center text-sm text-red-100">{err}</p>}

      {phase === "done" && (
        <div className="fade-in mt-5 w-full max-w-md">
          {heard && <p className="mb-3 line-clamp-3 text-center text-xs italic text-paper/55">You said: “{heard}”</p>}
          {created.length === 0 ? (
            <div className="rounded-2xl bg-white/10 p-4 text-center text-sm text-paper/80"><p>I didn’t find anything to file from that.</p><button className="mt-3 rounded-xl bg-white/15 px-4 py-2 font-medium hover:bg-white/25" onClick={() => save(heard, "note")}>Save it as a note</button></div>
          ) : (
            <>
              <ul className="space-y-2">
                {created.map((c, i) => { const I = ICON[c.kind] ?? StickyNote; return (
                  <li key={c.id} className="rise" style={{ animationDelay: `${i * 90}ms` }}>
                    <Link href={HREF[c.resource](c)} className={`flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-left backdrop-blur transition hover:bg-white/20 ${undone ? "line-through opacity-40" : ""}`}>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/90 text-white"><I size={17} aria-hidden /></span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-paper">{c.title}</span><span className="block text-xs text-paper/60">{LABEL[c.kind]}{c.due_date ? ` · ${fmtDate(c.due_date)}` : ""}{c.contact ? ` · ${c.contact}` : ""}</span></span>
                    </Link>
                  </li>
                ); })}
              </ul>
              {skipped > 0 && <p className="mt-2 text-center text-xs text-paper/50">{skipped} item{skipped === 1 ? "" : "s"} couldn’t be saved.</p>}
              <div className="mt-3 flex justify-center gap-2">
                {!undone ? <button onClick={undo} className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/20"><Undo2 size={15} aria-hidden />Undo</button> : <span className="text-sm text-paper/60">Removed.</span>}
              </div>
            </>
          )}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); if (typed.trim() && !busy) save(typed.trim()); }} className="mt-6 flex w-full max-w-md items-center gap-2 rounded-2xl bg-white/10 p-1.5 backdrop-blur">
        <label className="sr-only" htmlFor="typed-note">Or type a note</label>
        <input id="typed-note" value={typed} onChange={(e) => setTyped(e.target.value)} maxLength={4000} placeholder={sttReady ? "Or type it here…" : "Type your note here…"} className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-paper placeholder:text-paper/40 outline-none" />
        <button disabled={!typed.trim() || busy} aria-label="Save note" className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-white transition disabled:opacity-40"><Send size={16} aria-hidden /></button>
      </form>
      {!aiReady && <p className="mt-2 max-w-sm text-center text-xs text-paper/45">AI sorting is off, so notes are saved as written. Add the OpenRouter settings to split them into tasks, expenses and contacts.</p>}
    </div>
  );
}
