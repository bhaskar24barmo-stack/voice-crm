"use client";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

// Number that counts up when it first appears.
export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!value || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(value); return; }
    const t0 = performance.now(); let raf = 0;
    const tick = (t: number) => { const p = Math.min(1, (t - t0) / duration); setN(Math.round(value * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className="tabular-nums">{n}</span>;
}

// Wrapper that lights up under the cursor (spotlight hover effect).
export function Spot({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} className={`spot ${className}`} style={style} onPointerMove={(e) => { const r = ref.current!.getBoundingClientRect(); ref.current!.style.setProperty("--mx", `${e.clientX - r.left}px`); ref.current!.style.setProperty("--my", `${e.clientY - r.top}px`); }}>
      {children}
    </div>
  );
}

// Greeting uses the visitor's own clock, so "good morning" is right in any time zone.
export function Greeting({ name }: { name: string }) {
  const [g, setG] = useState({ hi: "Hello", date: "" });
  useEffect(() => {
    const h = new Date().getHours();
    setG({ hi: h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening", date: new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) });
  }, []);
  return <><p className="text-sm text-paper/60">{g.date || "\u00A0"}</p><p className="mt-1 text-lg text-paper/85">{g.hi}{name ? `, ${name}` : ""}</p></>;
}
