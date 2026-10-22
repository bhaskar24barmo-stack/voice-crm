"use client";
import { useEffect, useRef, useState } from "react";

const COLS = ["New", "Contacted", "Proposal", "Won"];
const DEALS: [string, string, number][] = [
  ["Meera Joshi", "Brightwave Studio · Starter", 0],
  ["Sam Fernandes", "Lumen Co. · Pro", 1],
  ["Priya Nair", "Northwind Traders · Business", 2],
  ["Anil Rao", "Kestrel Logistics · Pro", 3],
];

export default function PipelineShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  const [stage, setStage] = useState(2);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setP(1); return; }
    let raf = 0;
    const f = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const v = window.innerHeight;
        setP(Math.min(1, Math.max(0, (v - el.getBoundingClientRect().top) / (v * 0.9))));
      });
    };
    f();
    window.addEventListener("scroll", f, { passive: true });
    window.addEventListener("resize", f);
    const t = setInterval(() => setStage((s) => (s + 1) % 4), 2600);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", f); window.removeEventListener("resize", f); clearInterval(t); };
  }, []);

  return (
    <section className="overflow-hidden bg-ink py-20 text-paper">
      <div className="mx-auto max-w-6xl px-5">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-[#F0A37B]">Your pipeline</p>
        <h2 className="max-w-3xl font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl">See every deal, and what happens next.</h2>
        <p className="mt-4 max-w-xl text-lg text-paper/70">Say “move Rahul to Proposal” and the board follows. Every spoken update lands in the right place on the customer’s timeline.</p>

        <div ref={ref} className="relative mt-14" style={{ perspective: "1800px" }}>
          <div style={{ transformStyle: "preserve-3d", transform: `rotateX(${30 - 26 * p}deg) rotateY(${-12 + 10 * p}deg) scale(${0.92 + 0.08 * p})`, transition: "transform .15s linear" }}>
            <div role="img" aria-label="Illustrative pipeline board: a deal for Rahul moves from column to column as voice updates arrive" className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_50px_100px_-40px_rgba(0,0,0,.8)] md:grid-cols-4">
              {COLS.map((c, i) => (
                <div key={c} className="min-h-[11rem] rounded-xl bg-white/[0.04] p-3">
                  <p className="mb-3 flex justify-between text-xs font-medium uppercase tracking-wide text-paper/60"><span>{c}</span></p>
                  <div className="space-y-2">
                    {DEALS.filter((d) => d[2] === i).map(([n, d]) => (
                      <div key={n} className="rounded-lg border border-white/10 bg-white/5 p-3"><p className="text-sm font-medium">{n}</p><p className="text-xs text-paper/60">{d}</p></div>
                    ))}
                    {stage === i && (
                      <div key={`r${stage}`} className="pop rounded-lg border border-[#F0A37B] bg-white/10 p-3">
                        <p className="text-sm font-medium">Rahul Verma</p>
                        <p className="text-xs text-paper/60">ABC Technologies · Pro</p>
                        <span className="mt-2 inline-block rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-white">Voice update</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="floaty absolute -bottom-8 right-2 hidden w-64 rounded-2xl border border-line bg-white p-4 text-ink shadow-2xl md:block" style={{ ["--z" as string]: "80px" } as React.CSSProperties}>
              <p className="text-xs font-medium text-ink/50">Rahul Verma · timeline</p>
              <ul className="mt-2 space-y-2 text-sm">
                <li>Met in person · sales meeting</li>
                <li>Interested in the Pro plan</li>
                <li className="font-medium text-accent">Follow-up set · next Tuesday</li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-12 text-xs text-paper/40">Product preview with sample data.</p>
      </div>
    </section>
  );
}
