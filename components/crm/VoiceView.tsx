"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Mic, Sparkles, Square, Upload } from "lucide-react";
import { api, today } from "@/lib/client";
import { PRIORITIES } from "@/lib/crm-types";
import { ErrorNote, L, PageHeader, btnP, btnS, field } from "./ui";
import { ContactSelect } from "./forms";

type Item = { on: boolean; title: string; due_date: string; priority: string };
const MAX = 4 * 1024 * 1024;
const Step = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-line bg-white p-5"><h2 className="mb-3 flex items-center gap-2.5 font-serif text-xl font-semibold"><span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-sm text-white" aria-hidden>{n}</span>{title}</h2>{children}</section>
);

export default function VoiceView({ sttReady, aiReady }: { sttReady: boolean; aiReady: boolean }) {
  const [consent, setConsent] = useState(false);
  const [rec, setRec] = useState<"idle" | "recording" | "ready">("idle");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState("");
  const [secs, setSecs] = useState(0);
  const [source, setSource] = useState<"manual" | "recorded" | "uploaded">("manual");
  const [transcript, setTranscript] = useState("");
  const [contact, setContact] = useState("");
  const [summary, setSummary] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState<"" | "transcribe" | "analyze" | "save">("");
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState<{ callId?: string; tasksCreated: number; warning?: string } | null>(null);
  const mr = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const bytes = useRef(0);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<number>();

  useEffect(() => () => { stream.current?.getTracks().forEach((t) => t.stop()); window.clearInterval(timer.current); }, []);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  async function start() {
    setErr("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setErr("Recording isn’t supported in this browser. Upload an audio file instead."); return; }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported(m));
      const r = new MediaRecorder(s, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: 24000 });
      chunks.current = []; bytes.current = 0;
      r.ondataavailable = (e) => {
        if (!e.data.size) return;
        chunks.current.push(e.data); bytes.current += e.data.size;
        if (bytes.current > 3.8 * 1024 * 1024 && r.state === "recording") { r.stop(); setErr("Recording stopped at the 4 MB limit. Transcribe this part, then record the rest."); }
      };
      r.onstop = () => {
        s.getTracks().forEach((t) => t.stop()); window.clearInterval(timer.current);
        const b = new Blob(chunks.current, { type: r.mimeType || "audio/webm" });
        setBlob(b); setUrl(URL.createObjectURL(b)); setSource("recorded"); setRec("ready");
      };
      r.start(1000); mr.current = r; setRec("recording"); setSecs(0);
      timer.current = window.setInterval(() => setSecs((x) => x + 1), 1000);
    } catch { setErr("Microphone access was blocked. Allow it in your browser settings, or upload a file instead."); }
  }
  const stop = () => mr.current?.state === "recording" && mr.current.stop();

  function pick(f: File | undefined) {
    if (!f) return; setErr("");
    if (f.size > MAX) { setErr("That file is over 4 MB. Trim it or upload a shorter clip."); return; }
    setBlob(f); setUrl(URL.createObjectURL(f)); setSource("uploaded"); setRec("ready"); setSecs(0);
  }

  async function transcribe() {
    if (!blob) return; setBusy("transcribe"); setErr("");
    try {
      const fd = new FormData();
      fd.append("file", blob, blob instanceof File ? blob.name : `recording.${blob.type.includes("mp4") ? "m4a" : "webm"}`);
      fd.append("consent", "yes");
      const j = await api<{ text: string }>("/api/voice/transcribe", { form: fd });
      setTranscript(j.text);
    } catch (e) { setErr(e instanceof Error ? e.message : "Transcription failed."); }
    setBusy("");
  }

  async function analyze() {
    setBusy("analyze"); setErr("");
    try {
      const j = await api<{ data: { summary: string; action_items: { title: string; due_date: string | null; priority: string }[] } }>("/api/ai", { body: { task: "action_items", text: transcript, today: today() } });
      setSummary(j.data.summary);
      setItems(j.data.action_items.map((i) => ({ on: true, title: i.title, due_date: i.due_date ?? "", priority: i.priority })));
    } catch (e) { setErr(e instanceof Error ? e.message : "Analysis failed."); }
    setBusy("");
  }

  async function save() {
    setBusy("save"); setErr("");
    try {
      const j = await api<{ callId?: string; tasksCreated: number; warning?: string }>("/api/voice/save", { body: {
        contact_id: contact || undefined, summary: summary || undefined, source,
        ...(source === "manual" ? { notes: transcript } : { transcript }),
        duration_seconds: secs > 0 ? secs : undefined,
        tasks: items.filter((i) => i.on && i.title.trim()).map((i) => ({ title: i.title, due_date: i.due_date || null, priority: i.priority })),
      } });
      setSaved(j);
    } catch (e) { setErr(e instanceof Error ? e.message : "Couldn’t save the call."); }
    setBusy("");
  }

  const reset = () => { setSaved(null); setTranscript(""); setSummary(""); setItems([]); setBlob(null); setUrl(""); setRec("idle"); setSecs(0); setSource("manual"); setContact(""); };
  const mmss = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

  if (saved) return (
    <div className="mx-auto max-w-3xl"><PageHeader title="Voice" />
      <div role="status" className="rounded-2xl border border-line bg-white p-6">
        <h2 className="font-serif text-2xl font-semibold">Call saved</h2>
        <p className="mt-1 text-sm text-ink/70">{saved.tasksCreated} follow-up task{saved.tasksCreated === 1 ? "" : "s"} created.</p>
        {saved.warning && <p className="mt-2 text-sm text-red-700">{saved.warning}</p>}
        <div className="mt-4 flex flex-wrap gap-2"><Link href="/account/activities?tab=calls" className={btnP}>View calls</Link><Link href="/account/tasks" className={btnS}>View tasks</Link><button className={btnS} onClick={reset}>Add another call</button></div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Voice" desc="Capture a call, get a transcript and summary, and turn the follow-ups into tasks. You review everything before it’s saved." />
      <div className="space-y-4">
        {!sttReady && <div role="status" className="rounded-2xl border border-accent/30 bg-accent/5 p-4 text-sm"><p className="font-medium">Audio transcription isn’t configured yet.</p><p className="mt-1 text-ink/70">You can still paste or type call notes below. To transcribe recordings, an admin must set <code className="rounded bg-ink/5 px-1">STT_API_URL</code>, <code className="rounded bg-ink/5 px-1">STT_API_KEY</code> and <code className="rounded bg-ink/5 px-1">STT_MODEL</code>. See the README.</p></div>}

        {sttReady && (
          <Step n={1} title="Record or upload audio">
            <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#C2501A]" /><span>I have permission from everyone on this call to record or upload it. The audio is sent to the transcription provider and is not stored by Voice CRM.</span></label>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {rec !== "recording" ? <button className={btnP} disabled={!consent} onClick={start}><Mic size={16} aria-hidden />Start recording</button> : <button className={btnP} onClick={stop}><Square size={16} aria-hidden />Stop ({mmss})</button>}
              <label className={`${btnS} ${!consent || rec === "recording" ? "pointer-events-none opacity-60" : "cursor-pointer"}`}><Upload size={16} aria-hidden />Upload audio<input type="file" accept="audio/*" disabled={!consent || rec === "recording"} className="sr-only" onChange={(e) => pick(e.target.files?.[0])} /></label>
              <span className="text-xs text-ink/55">Up to 4 MB (about 20 minutes of recording).</span>
            </div>
            {rec === "recording" && <p role="status" className="mt-3 flex items-center gap-2 text-sm text-red-700"><span className="h-2 w-2 animate-pulse rounded-full bg-red-600" aria-hidden />Recording {mmss}</p>}
            {rec === "ready" && url && (
              <div className="mt-4 space-y-3"><audio controls src={url} className="w-full" />
                <button className={btnP} disabled={busy !== "" || !consent} onClick={transcribe}>{busy === "transcribe" && <Loader2 size={16} className="animate-spin" aria-hidden />}{busy === "transcribe" ? "Transcribing…" : "Transcribe"}</button></div>
            )}
          </Step>
        )}

        <Step n={sttReady ? 2 : 1} title="Call notes">
          <L label={source === "manual" ? "Notes (type or paste)" : "Transcript (edit if needed)"}><textarea rows={8} maxLength={50000} value={transcript} onChange={(e) => setTranscript(e.target.value)} className={field} placeholder={sttReady ? "Your transcript appears here after transcription." : "Type or paste your call notes."} /></L>
          <div className="mt-3"><ContactSelect value={contact} onChange={setContact} label="Link to contact" /></div>
        </Step>

        <Step n={sttReady ? 3 : 2} title="Summary and follow-ups">
          <p className="mb-3 text-sm text-ink/65">{aiReady ? "Voice CRM sends only the text above to the AI provider to draft a summary and follow-up tasks." : "AI summaries need OPENROUTER_API_KEY and OPENROUTER_MODEL. You can still write the summary and tasks yourself."}</p>
          <button className={btnP} disabled={!aiReady || !transcript.trim() || busy !== ""} onClick={analyze}>{busy === "analyze" ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Sparkles size={16} aria-hidden />}{busy === "analyze" ? "Analyzing…" : "Summarize and find tasks"}</button>
          <div className="mt-4 space-y-4">
            <L label="Summary"><textarea rows={3} maxLength={5000} value={summary} onChange={(e) => setSummary(e.target.value)} className={field} /></L>
            {items.length > 0 && (
              <fieldset><legend className="text-sm font-medium">Follow-up tasks (untick to skip)</legend>
                <ul className="mt-2 space-y-2">
                  {items.map((it, i) => (
                    <li key={i} className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-[auto,1fr,9rem,7rem] sm:items-center">
                      <input type="checkbox" checked={it.on} aria-label={`Create task ${it.title}`} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, on: e.target.checked } : x)))} className="h-4 w-4 accent-[#C2501A]" />
                      <input aria-label="Task title" value={it.title} maxLength={200} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} className={`${field} !mt-0`} />
                      <input aria-label="Due date" type="date" value={it.due_date} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, due_date: e.target.value } : x)))} className={`${field} !mt-0`} />
                      <select aria-label="Priority" value={it.priority} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, priority: e.target.value } : x)))} className={`${field} !mt-0`}>{PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}</select>
                    </li>
                  ))}
                </ul>
              </fieldset>
            )}
          </div>
        </Step>

        {err && <ErrorNote message={err} />}
        <div className="flex justify-end"><button className={btnP} disabled={busy !== "" || (!transcript.trim() && !summary.trim())} onClick={save}>{busy === "save" && <Loader2 size={16} className="animate-spin" aria-hidden />}Save call{items.some((i) => i.on) ? " and tasks" : ""}</button></div>
      </div>
    </div>
  );
}
