"use client";
import { useEffect, useState, type CSSProperties } from "react";
import { Search, Mic, Bell } from "lucide-react";

const QUOTE = "Add Rahul from ABC Technologies. We discussed the Pro plan. Schedule a follow-up for next Tuesday.";
const FIELDS = [["Contact", "Rahul"], ["Company", "ABC Technologies"], ["Interest", "Pro Plan"], ["Activity", "Sales meeting"], ["Follow-up", "Next Tuesday"]];
const z = (n: number) => ({ "--z": `${n}px` }) as CSSProperties;

export default function HeroPreview() {
  const [typed, setTyped] = useState(0);
  const [shown, setShown] = useState(0);
  const [done, setDone] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [still, setStill] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStill(true); setTyped(QUOTE.length); setShown(FIELDS.length); return;
    }
    let alive = true;
    const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    (async () => {
      while (alive) {
        setTyped(0); setShown(0); setDone(false);
        await wait(800);
        for (let i = 1; i <= QUOTE.length && alive; i++) { setTyped(i); await wait(28); }
        await wait(500);
        for (let i = 1; i <= FIELDS.length && alive; i++) { setShown(i); await wait(380); }
        await wait(1800); setDone(true); await wait(4000);
      }
    })();
    return () => { alive = false; };
  }, []);

  const typing = typed > 0 && typed < QUOTE.length;
  const ready = shown >= FIELDS.length;
  const status = done ? "Update confirmed" : ready ? "Ready to review" : shown > 0 ? "Understanding…" : typed > 0 ? "Listening…" : "Tap to speak";
  const stages = [["New", done ? 7 : 6], ["Contacted", 5], ["Proposal", 4], ["Won", 3]] as const;
  const bar = ["bg-ink/15", "bg-ink/30", "bg-accent/60", "bg-accent"];

  return (
    <div className="relative px-1 pb-10 pt-8 sm:px-6" style={{ perspective: "1600px" }}
      onMouseMove={(e) => {
        if (still) return;
        const r = e.currentTarget.getBoundingClientRect();
        setTilt({ x: -((e.clientY - r.top) / r.height - 0.5) * 10, y: ((e.clientX - r.left) / r.width - 0.5) * 14 });
      }}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}>
      <div className="relative" style={{ transformStyle: "preserve-3d", transform: `rotateX(${4 + tilt.x}deg) rotateY(${-8 + tilt.y}deg)`, transition: "transform .25s ease-out" }}>
        <div role="img" aria-label="Illustrative preview of the Voice CRM workspace: a spoken update is transcribed, understood, and confirmed"
          className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_40px_80px_-30px_rgba(25,25,25,.35)]">
          <div className="flex">
            <aside className="hidden w-32 shrink-0 border-r border-line bg-paper/60 p-3 text-sm sm:block">
              {["Overview", "Contacts", "Leads", "Follow-ups", "Activity"].map((n, i) => (
                <div key={n} className={`rounded-md px-3 py-2 ${i === 0 ? "bg-white font-medium shadow-sm" : "text-ink/60"}`}>{n}</div>
              ))}
            </aside>
            <div className="min-w-0 flex-1 space-y-3 p-4 text-left">
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-md border border-line px-3 py-1.5 text-xs text-ink/50"><Search size={12} />Search contacts, deals, notes</div>
                <div className="grid h-7 w-7 place-items-center rounded-full bg-ink text-[10px] text-paper">You</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[["Open leads", done ? 19 : 18], ["Follow-ups this week", done ? 8 : 7]].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-line p-3"><p className="text-xs text-ink/60">{k}</p><p className="font-serif text-2xl font-semibold tabular-nums">{v}</p></div>
                ))}
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium">Pipeline</p>
                <div className="flex gap-1">
                  {stages.map(([s, n], i) => (
                    <div key={s} style={{ flexGrow: n }} className="basis-0 transition-all duration-500">
                      <div className={`h-2 rounded-full ${bar[i]}`} />
                      <p className="mt-1 truncate text-[10px] text-ink/60">{s} {n}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-accent/30 bg-[#FBF1EA] p-3">
                <p className="min-h-[2.5rem] text-xs leading-snug">“{QUOTE.slice(0, typed)}{typing && <span className="caret">|</span>}{typed === 0 && <span className="text-ink/40">Say what happened…</span>}”</p>
                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 rounded-md bg-white p-3 text-xs">
                  {FIELDS.map(([k, v], i) => (
                    <p key={k} className={`transition-all duration-300 ${i < shown ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}><span className="text-ink/50">{k}: </span><span className="font-medium">{v}</span></p>
                  ))}
                </div>
                <div className="mt-3 flex gap-2 text-xs font-medium">
                  <span className={`rounded-md px-3 py-1.5 text-white transition ${done ? "bg-ink" : "bg-accent"}`}>{done ? "Saved ✓" : "Confirm update"}</span>
                  <span className="rounded-md border border-ink/20 bg-white px-3 py-1.5">Edit details</span>
                </div>
              </div>
              <div className="text-xs">
                <p className="mb-1 font-medium">Recent activity</p>
                {done && <p className="flex justify-between border-t border-line py-1.5 font-medium"><span>Sales meeting · Rahul, ABC Technologies</span><span className="text-ink/50">Just now</span></p>}
                {[["Call logged · Priya, Northwind Traders", "2h ago"], ["Follow-up due · Sam, Lumen Co.", "Today"]].map(([a, t]) => (
                  <p key={a} className="flex justify-between gap-2 border-t border-line py-1.5 text-ink/70"><span className="truncate">{a}</span><span className="shrink-0 text-ink/40">{t}</span></p>
                ))}
              </div>
              <p className="text-[10px] text-ink/40">Product preview with sample data.</p>
            </div>
          </div>
        </div>

        <div className="floaty absolute -left-1 -top-6 flex items-center gap-3 rounded-2xl border border-line bg-white/95 p-3 pr-4 shadow-xl sm:-left-8" style={z(70)}>
          <span className="relative grid h-11 w-11 place-items-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#F6B08A,#C2501A_55%,#8a3410)] text-white shadow-[inset_-4px_-6px_10px_rgba(0,0,0,.25),0_8px_16px_-4px_rgba(194,80,26,.6)]">
            <Mic size={18} aria-hidden />
            {typing && <span className="absolute inset-0 animate-ping rounded-full bg-accent/30" />}
          </span>
          <div>
            <div className="flex h-4 items-center gap-0.5" aria-hidden>
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <span key={i} className="h-full w-0.5 origin-center rounded bg-accent" style={{ transform: typing ? undefined : "scaleY(.3)", animation: typing ? `wave 1s ease-in-out ${i * 0.09}s infinite` : "none" }} />
              ))}
            </div>
            <p className="mt-1 text-xs font-medium">{status}</p>
          </div>
        </div>

        <div className={`floaty absolute -bottom-6 -right-1 flex items-center gap-3 rounded-2xl border border-line bg-white p-3 pr-4 shadow-xl transition-opacity duration-500 sm:-right-6 ${done ? "opacity-100" : "opacity-0"}`} style={z(90)} aria-hidden>
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#FBF1EA] text-accent"><Bell size={16} /></span>
          <div className="text-xs"><p className="font-medium">Follow-up scheduled</p><p className="text-ink/60">Rahul · Tuesday</p></div>
        </div>
      </div>
    </div>
  );
}
