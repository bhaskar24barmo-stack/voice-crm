"use client";
import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";

const stages = ["New lead", "Qualified", "Proposal", "Won"];
const deals = [
  { name: "Northwind Traders", who: "Priya Menon", value: "$18,000" },
  { name: "Acme Logistics", who: "Daniel Okafor", value: "$42,500" },
  { name: "Bluebird Studio", who: "Sara Lindqvist", value: "$6,200" },
  { name: "Helio Health", who: "Marcus Reid", value: "$27,800" },
  { name: "Fernwood Co.", who: "Aiko Tanaka", value: "$9,400" },
];

export default function PipelineBoard() {
  const root = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState([0, 1, 2, 0, 1]);
  const [cmd, setCmd] = useState("“Move Acme Logistics to Proposal.”");
  const [last, setLast] = useState(-1);

  // Scroll-driven tilt: gentle, capped at ±10° so it never feels dizzying.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = root.current, b = board.current;
      if (!el || !b) return;
      const r = el.getBoundingClientRect(), vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      b.style.transform = `rotateX(${((0.5 - p) * 20).toFixed(2)}deg) rotateY(${(-4 + p * 8).toFixed(2)}deg)`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, []);

  // Cycle deals through stages every few seconds; pause when tab is hidden.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    const id = setInterval(() => {
      if (document.hidden) return;
      const d = i++ % deals.length;
      setPos((p) => {
        const n = [...p]; n[d] = (n[d] + 1) % stages.length;
        setCmd(n[d] === 0 ? `“Add ${deals[d].name} as a new lead.”` : `“Move ${deals[d].name} to ${stages[n[d]]}.”`);
        return n;
      });
      setLast(d);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <div ref={root} className="mt-12" style={{ perspective: "1800px" }}>
      <div className="mx-auto mb-5 flex max-w-md items-center gap-3 rounded-full border border-line bg-white px-4 py-2 text-sm shadow-sm" aria-live="polite">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-white"><Mic size={14} aria-hidden /></span>
        <span key={cmd} className="cmd-in truncate text-ink/80">{cmd}</span>
      </div>
      <div ref={board} className="board3d rounded-3xl border border-line bg-white/70 p-3 shadow-[0_40px_80px_-40px_rgba(25,25,25,.35)] backdrop-blur sm:p-5" style={{ transformStyle: "preserve-3d", transition: "transform .2s ease-out" }}>
        <div className="grid gap-3 md:grid-cols-4">
          {stages.map((s, si) => (
            <div key={s} className="min-h-[9rem] rounded-2xl bg-paper p-3" style={{ transform: "translateZ(10px)" }}>
              <p className="mb-3 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-ink/55">{s}<span className="rounded-full bg-white px-2 py-0.5 text-ink/60">{pos.filter((x) => x === si).length}</span></p>
              <div className="space-y-2.5">
                {deals.map((d, di) => pos[di] !== si ? null : (
                  <div key={d.name + si} className={`${last === di ? "deal-in " : ""}spot rounded-xl border border-line bg-white p-3 shadow-sm`} style={{ transform: "translateZ(28px)" }}>
                    <p className="text-sm font-semibold">{d.name}</p>
                    <p className="text-xs text-ink/60">{d.who}</p>
                    <p className="mt-2 text-sm font-medium text-accent">{d.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-ink/50">Illustration with sample data. Not real customers.</p>
    </div>
  );
}
