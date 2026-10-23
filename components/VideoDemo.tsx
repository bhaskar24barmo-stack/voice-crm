"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, Check, Play, Pause, RotateCcw, CalendarClock, MousePointer2, Volume2, VolumeX } from "lucide-react";

const QUOTE = "Met Rahul from ABC Technologies today. He’s interested in the Pro plan. Follow up next Tuesday.";
const FIELDS = [["Contact", "Rahul"], ["Company", "ABC Technologies"], ["Interest", "Pro plan"], ["Activity", "Meeting note"], ["Follow-up", "Next Tuesday"]];
const SCENES = [
  { at: 0, name: "Speak", cap: "You say what happened, the way you’d tell a colleague." },
  { at: 4, name: "Understand", cap: "AI picks out the people, company, plan and dates." },
  { at: 8, name: "Review", cap: "You see every proposed change and approve it." },
  { at: 12, name: "Saved", cap: "Records, timeline and follow-up task are updated." },
];
const TOTAL = 16;

// `src`: drop a real recording in /public and pass src="/demo.mp4" to replace the animated walkthrough.
export default function VideoDemo({ src, poster }: { src?: string; poster?: string }) {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const last = useRef(0);

  useEffect(() => {
    if (src || !box.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setPlaying(true); io.disconnect(); } }, { threshold: 0.5 });
    io.observe(box.current);
    return () => io.disconnect();
  }, [src]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0; last.current = performance.now();
    const tick = (now: number) => {
      const dt = (now - last.current) / 1000; last.current = now;
      setT((p) => { const n = p + dt; if (n >= TOTAL) { setPlaying(false); return TOTAL; } return n; });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // --- Sound effects: synthesized with Web Audio (no files). Off by default; browsers need a click to allow audio. ---
  const [sound, setSound] = useState(false);
  const ctx = useRef<AudioContext | null>(null);
  const prev = useRef(0);
  const fired = useRef(new Set<string>());
  const lastTyped = useRef(0);
  const lastShown = useRef(0);
  const tone = (f: number, d: number, type: OscillatorType = "sine", v = 0.07, delay = 0, to?: number) => {
    const c = ctx.current; if (!c) return;
    const o = c.createOscillator(), g = c.createGain(), s0 = c.currentTime + delay;
    o.type = type; o.frequency.setValueAtTime(f, s0);
    if (to) o.frequency.exponentialRampToValueAtTime(to, s0 + d);
    g.gain.setValueAtTime(0.0001, s0); g.gain.exponentialRampToValueAtTime(v, s0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, s0 + d);
    o.connect(g); g.connect(c.destination); o.start(s0); o.stop(s0 + d + 0.05);
  };
  const toggleSound = () => {
    if (sound) { setSound(false); return; }
    const AC = window.AudioContext || (window as any).webkitAudioContext; if (!AC) return;
    ctx.current = ctx.current || new AC(); ctx.current.resume(); setSound(true); tone(660, 0.12, "sine", 0.06, 0, 990);
  };
  useEffect(() => () => { ctx.current?.close(); }, []);
  useEffect(() => {
    const marks: [string, number, () => void][] = [
      ["mic", 0, () => tone(520, 0.18, "sine", 0.07, 0, 880)],
      ["click", 11.2, () => { tone(180, 0.08, "triangle", 0.12); tone(1400, 0.03, "square", 0.04); }],
      ["ok", 12, () => [523, 659, 784].forEach((f, i) => tone(f, 0.5, "sine", 0.07, i * 0.09))],
    ];
    const typed = Math.min(QUOTE.length, Math.floor((t / 3.4) * QUOTE.length));
    const shown = t < 4 ? 0 : Math.min(FIELDS.length, Math.floor((t - 4) / 0.7) + 1);
    const dt = t - prev.current; prev.current = t;
    if (dt < 0 || dt > 0.5) { // seek or replay: resync silently
      fired.current = new Set(marks.filter(([, at]) => at < t).map(([k]) => k));
      lastTyped.current = typed; lastShown.current = shown; return;
    }
    const live = sound && playing;
    for (const [k, at, fn] of marks) if (t >= at && !fired.current.has(k)) { fired.current.add(k); if (live) fn(); }
    if (typed > lastTyped.current) { if (live && typed % 3 === 0) tone(1700 + ((typed * 37) % 400), 0.025, "square", 0.025); lastTyped.current = typed; }
    if (shown > lastShown.current) { if (live) tone(660 + shown * 110, 0.16, "sine", 0.07); lastShown.current = shown; }
  }, [t]); // eslint-disable-line react-hooks/exhaustive-deps

  if (src) return <video className="mt-10 w-full rounded-3xl border border-line shadow-xl" src={src} poster={poster} controls playsInline preload="metadata" />;

  const scene = SCENES.reduce((a, s, i) => (t >= s.at ? i : a), 0);
  const typed = Math.min(QUOTE.length, Math.floor((t / 3.4) * QUOTE.length));
  const shown = scene < 1 ? 0 : Math.min(FIELDS.length, Math.floor((t - 4) / 0.7) + 1);
  const pressed = t > 11.2 && t < 12.2;
  const toggle = () => { if (t >= TOTAL) setT(0); setPlaying((p) => !p); };

  return (
    <div ref={box} className="mt-10">
      <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_40px_80px_-40px_rgba(25,25,25,.4)]">
        <div className="flex items-center gap-2 border-b border-line bg-paper px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-[#E5584F]" /><span className="h-3 w-3 rounded-full bg-[#E8B13A]" /><span className="h-3 w-3 rounded-full bg-[#5BB661]" />
          <span className="mx-auto rounded-md bg-white px-4 py-1 text-xs text-ink/50">voice-crm · Rahul · ABC Technologies</span>
        </div>
        <div className="grid min-h-[22rem] gap-0 md:grid-cols-2">
          <div className="border-b border-line p-6 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <span className={`grid h-11 w-11 place-items-center rounded-full ${scene === 0 && playing ? "bg-accent text-white shadow-[0_0_0_8px_rgba(194,80,26,.15)]" : "bg-ink text-paper"} transition`}><Mic size={18} aria-hidden /></span>
              <div className="flex h-8 items-center gap-1" aria-hidden>{Array.from({ length: 18 }).map((_, i) => <span key={i} className="w-1 rounded-full bg-accent/70" style={{ height: scene === 0 && playing ? `${30 + ((i * 37) % 60)}%` : "12%", transition: "height .25s", animation: scene === 0 && playing ? `wave ${0.9 + (i % 4) * 0.2}s ease-in-out infinite` : "none" }} />)}</div>
            </div>
            <p className="mt-5 min-h-[7rem] font-serif text-xl leading-snug">“{QUOTE.slice(0, typed)}{typed < QUOTE.length && <span className="caret">|</span>}”</p>
          </div>
          <div className="relative p-6" aria-live="polite">
            <p className="mb-3 text-sm font-medium text-ink/60">{scene === 3 ? "Updated" : scene === 0 ? "Waiting for you…" : "Proposed CRM updates"}</p>
            {scene < 3 ? (
              <>
                <ul className="space-y-2">{FIELDS.slice(0, shown).map(([l, v]) => <li key={l} className="deal-in flex items-center gap-3 rounded-xl border border-line bg-paper px-3 py-2"><Check size={16} className="shrink-0 text-accent" aria-hidden /><span className="w-24 shrink-0 text-xs font-medium uppercase tracking-wider text-ink/50">{l}</span><span className="font-medium">{v}</span></li>)}</ul>
                {scene === 2 && <div className="relative mt-5 inline-block"><span className={`inline-flex rounded-lg bg-accent px-5 py-2.5 font-medium text-white transition ${pressed ? "scale-95 bg-[#a84315]" : ""}`}>Confirm update</span><MousePointer2 size={22} aria-hidden className="absolute -bottom-4 left-24 fill-ink text-white transition-transform duration-700" style={{ transform: t > 9.5 ? "translate(-30px,-14px)" : "translate(50px,40px)" }} /></div>}
              </>
            ) : (
              <div className="deal-in space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-[#EAF5EC] px-3 py-2 text-sm text-[#1F6B34]"><Check size={16} aria-hidden />Saved to Rahul’s record</div>
                <div className="rounded-xl border border-line p-3 text-sm"><p className="font-semibold">ABC Technologies</p><p className="text-ink/60">Stage: New lead → <span className="font-medium text-accent">Qualified</span></p></div>
                <div className="flex items-center gap-3 rounded-xl border border-line p-3 text-sm"><CalendarClock size={16} className="text-accent" aria-hidden />Task: Follow up with Rahul · Tuesday</div>
              </div>
            )}
          </div>
        </div>
        <div className="border-t border-line bg-paper px-4 py-3">
          <p className="mb-2 text-sm text-ink/70" aria-live="polite"><span className="font-medium text-accent">{SCENES[scene].name}.</span> {SCENES[scene].cap}</p>
          <div className="flex items-center gap-3">
            <button onClick={toggle} aria-label={playing ? "Pause demo" : t >= TOTAL ? "Replay demo" : "Play demo"} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-paper">{playing ? <Pause size={16} /> : t >= TOTAL ? <RotateCcw size={16} /> : <Play size={16} />}</button>
            <input type="range" min={0} max={TOTAL} step={0.05} value={t} onChange={(e) => { setPlaying(false); setT(Number(e.target.value)); }} aria-label="Demo progress" className="h-1 w-full accent-[#C2501A]" />
            <span className="w-12 shrink-0 text-right text-xs tabular-nums text-ink/50">0:{String(Math.floor(t)).padStart(2, "0")}</span>
            <button onClick={toggleSound} aria-pressed={sound} aria-label={sound ? "Turn sound effects off" : "Turn sound effects on"} className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${sound ? "border-accent bg-accent/10 text-accent" : "border-line bg-white text-ink/60"}`}>{sound ? <Volume2 size={14} aria-hidden /> : <VolumeX size={14} aria-hidden />}<span className="hidden sm:inline">{sound ? "Sound on" : "Sound off"}</span></button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">{SCENES.map((s, i) => <button key={s.name} onClick={() => { setT(s.at); setPlaying(true); }} className={`rounded-full border px-3 py-1 text-xs ${scene === i ? "border-accent bg-accent/10 text-accent" : "border-line bg-white text-ink/60"}`}>{i + 1}. {s.name}</button>)}</div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-ink/50">Animated walkthrough of the planned experience, using sample data. Tap the speaker for soft sound effects. Voice CRM is in development.</p>
    </div>
  );
}
