"use client";
import { useRef } from "react";
import { Mic, Sparkles, History } from "lucide-react";

export default function ProductTour() {
  const stage = useRef<HTMLDivElement>(null);
  const move = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" || !stage.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    stage.current.style.transform = `rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg)`;
  };
  const reset = () => { if (stage.current) stage.current.style.transform = ""; };
  const glass = "rounded-2xl border border-white/15 bg-white/[.07] p-5 backdrop-blur-md shadow-[0_30px_60px_-30px_rgba(0,0,0,.7)]";
  return (
    <section className="relative overflow-hidden bg-ink py-24 text-paper">
      <div aria-hidden className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-accent/30 blur-[100px]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-[#F0A37B]">Inside the product</p>
          <h2 className="font-serif text-3xl font-semibold leading-tight sm:text-5xl">One conversation. Three layers of clarity.</h2>
          <p className="mt-5 max-w-md text-lg text-paper/70">What you say becomes a clean transcript, structured fields, and a timeline entry, so context never gets scattered.</p>
          <p className="mt-6 text-sm text-paper/45">Illustration with sample data. The product is in development.</p>
        </div>
        <div onPointerMove={move} onPointerLeave={reset} style={{ perspective: "1400px" }}>
          <div ref={stage} className="space-y-4 transition-transform duration-200 ease-out" style={{ transformStyle: "preserve-3d" }}>
            <div className={glass} style={{ transform: "translateZ(20px)" }}>
              <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-paper/50"><Mic size={14} aria-hidden />Transcript</p>
              <p className="font-serif text-lg">“Spoke with Priya at Northwind. Budget approved, wants a proposal by Friday.”</p>
            </div>
            <div className={`${glass} md:ml-10`} style={{ transform: "translateZ(60px)" }}>
              <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-paper/50"><Sparkles size={14} aria-hidden />Extracted fields</p>
              <div className="flex flex-wrap gap-2 text-sm">{["Priya", "Northwind", "Budget approved", "Proposal: Friday"].map((c) => <span key={c} className="rounded-full bg-accent/25 px-3 py-1 text-[#F7C9AE]">{c}</span>)}</div>
            </div>
            <div className={`${glass} md:ml-20`} style={{ transform: "translateZ(100px)" }}>
              <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-paper/50"><History size={14} aria-hidden />Timeline</p>
              <ul className="space-y-1.5 text-sm text-paper/80"><li>Today · Call logged with Priya</li><li>Today · Task created: send proposal</li><li>Friday · Proposal due</li></ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
