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
    <div ref={ref} className={`crm-spot ${className}`} style={style} onPointerMove={(e) => { const r = ref.current!.getBoundingClientRect(); ref.current!.style.setProperty("--mx", `${e.clientX - r.left}px`); ref.current!.style.setProperty("--my", `${e.clientY - r.top}px`); }}>
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

// Small confetti pop at a screen position (task completed, note saved). Skipped for reduced motion.
export function burst(x: number, y: number) {
  if (typeof document === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#C2501A", "#F6A56B", "#2F7D46", "#191919", "#FFD2A8"];
  for (let i = 0; i < 16; i++) {
    const s = document.createElement("span");
    const size = 5 + Math.random() * 5;
    Object.assign(s.style, { position: "fixed", left: `${x}px`, top: `${y}px`, width: `${size}px`, height: `${size}px`, borderRadius: i % 2 ? "9999px" : "2px", background: colors[i % colors.length], pointerEvents: "none", zIndex: "100" });
    document.body.appendChild(s);
    const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 80;
    s.animate([
      { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d + 36}px)) rotate(${Math.random() * 540}deg) scale(.4)`, opacity: 0 },
    ], { duration: 650 + Math.random() * 400, easing: "cubic-bezier(.2,.8,.3,1)" }).onfinish = () => s.remove();
  }
}

// Row you can swipe right (on a phone) to trigger an action, like completing a task.
export function SwipeRow({ onSwipe, disabled, children }: { onSwipe: () => void; disabled?: boolean; children: ReactNode }) {
  const row = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const dx = useRef(0);
  const moved = useRef(false);
  const reset = () => { start.current = null; dx.current = 0; if (row.current) { row.current.style.transition = "transform .28s cubic-bezier(.2,.8,.2,1)"; row.current.style.transform = ""; } };
  return (
    <div className="relative overflow-hidden" style={{ touchAction: "pan-y" }}>
      <div aria-hidden className="absolute inset-y-0 left-0 grid w-32 place-items-center bg-emerald-500 text-white"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></div>
      <div ref={row} className="relative bg-white"
        onPointerDown={(e) => { if (disabled || e.pointerType === "mouse") return; moved.current = false; start.current = { x: e.clientX, y: e.clientY }; }}
        onClickCapture={(e) => { if (moved.current) { e.preventDefault(); e.stopPropagation(); moved.current = false; } }}
        onPointerMove={(e) => {
          const s = start.current; if (!s || !row.current) return;
          const mx = e.clientX - s.x;
          dx.current = Math.max(0, Math.min(mx, 140)); if (mx > 8) moved.current = true;
          row.current.style.transition = "none"; row.current.style.transform = `translateX(${dx.current}px)`;
        }}
        onPointerUp={() => { const go = dx.current > 90; reset(); if (go) onSwipe(); }}
        onPointerCancel={reset}>
        {children}
      </div>
    </div>
  );
}
