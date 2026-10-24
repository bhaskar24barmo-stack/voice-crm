"use client";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";

export { field, btnP, btnS, btnD } from "./styles";
import { btnD, btnS } from "./styles";

type Kind = "ok" | "err";
const ToastCtx = createContext<(msg: string, kind?: Kind) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; msg: string; kind: Kind }[]>([]);
  const n = useRef(0);
  const push = useCallback((msg: string, kind: Kind = "ok") => {
    const id = ++n.current;
    setItems((p) => [...p, { id, msg, kind }]);
    setTimeout(() => setItems((p) => p.filter((t) => t.id !== id)), 4500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex max-w-[calc(100vw-2rem)] flex-col gap-2">
        {items.map((t) => <div key={t.id} role="status" className={`pointer-events-auto rounded-xl px-4 py-3 text-sm shadow-lg ${t.kind === "ok" ? "bg-ink text-paper" : "bg-red-600 text-white"}`}>{t.msg}</div>)}
      </div>
    </ToastCtx.Provider>
  );
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose); close.current = onClose;
  const id = useId();
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const items = (): HTMLElement[] => Array.from(el?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])') ?? []);
    (el?.querySelector<HTMLElement>("[data-autofocus]") || items()[0] || el)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); close.current(); }
      if (e.key === "Tab") {
        const f = items(); if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; prev?.focus?.(); };
  }, []);
  const drag = useRef<number | null>(null);
  const down = (e: any) => { drag.current = e.clientY; e.currentTarget.setPointerCapture?.(e.pointerId); if (ref.current) ref.current.style.transition = "none"; };
  const move = (e: any) => { if (drag.current == null || !ref.current) return; ref.current.style.transform = `translateY(${Math.max(0, e.clientY - drag.current)}px)`; };
  const up = (e: any) => {
    if (drag.current == null || !ref.current) return;
    const dy = e.clientY - drag.current; drag.current = null;
    ref.current.style.transition = "transform .25s cubic-bezier(.2,.8,.2,1)";
    if (dy > 110) { ref.current.style.transform = "translateY(100%)"; setTimeout(() => close.current(), 200); } else ref.current.style.transform = "";
  };
  return (
    <div className="fade-in fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1} className={`sheet max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl outline-none sm:rounded-2xl sm:p-6 ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"}`}>
        <div className="-mx-5 -mt-5 mb-1 flex h-9 touch-none items-center justify-center sm:hidden" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} aria-hidden><span className="h-1.5 w-11 rounded-full bg-ink/15" /></div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={id} className="font-serif text-2xl font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-ink/60 hover:bg-ink/5"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Confirm({ title, message, confirmLabel = "Delete", onConfirm, onCancel }: { title: string; message: string; confirmLabel?: string; onConfirm: () => Promise<void>; onCancel: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-ink/75">{message}</p>
      {err && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className={btnS} onClick={onCancel} data-autofocus>Cancel</button>
        <button type="button" className={btnD} disabled={busy} onClick={async () => { setBusy(true); setErr(""); try { await onConfirm(); } catch (e) { setErr(e instanceof Error ? e.message : "Couldn’t delete."); setBusy(false); } }}>{busy && <Loader2 size={16} className="animate-spin" aria-hidden />}{confirmLabel}</button>
      </div>
    </Modal>
  );
}

export const Spinner = ({ label = "Loading" }: { label?: string }) => (
  <div role="status" className="space-y-3 py-2"><span className="sr-only">{label}…</span>
    {[0, 1, 2, 3].map((i) => <div key={i} aria-hidden className="skeleton h-16 rounded-2xl" style={{ animationDelay: `${i * 120}ms` }} />)}
  </div>
);
export const ErrorNote = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle size={16} aria-hidden />{message}{onRetry && <button onClick={onRetry} className="font-medium underline">Try again</button>}</div>
);
export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: "gray" | "accent" | "green" | "red" | "amber" }) {
  const c = { gray: "bg-ink/5 text-ink/70", accent: "bg-accent/10 text-accent", green: "bg-[#EAF5EC] text-[#1F6B34]", red: "bg-red-50 text-red-700", amber: "bg-amber-50 text-amber-800" }[tone];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${c}`}>{children}</span>;
}
export const PageHeader = ({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div><h1 className="font-serif text-3xl font-semibold sm:text-4xl">{title}</h1>{desc && <p className="mt-1 max-w-prose text-ink/65">{desc}</p>}</div>
    {action}
  </div>
);
export const L = ({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) => (
  <label className="block text-sm font-medium">{label}{children}{hint && <span className="mt-1 block text-xs font-normal text-ink/55">{hint}</span>}</label>
);
export const Tabs = ({ tabs, value, onChange, label }: { tabs: [string, string][]; value: string; onChange: (v: string) => void; label: string }) => (
  <div role="tablist" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-xl bg-ink/5 p-1 text-sm">
    {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={value === k} onClick={() => onChange(k)} className={`rounded-lg px-3.5 py-1.5 transition ${value === k ? "bg-white font-medium shadow-sm" : "text-ink/65 hover:text-ink"}`}>{l}</button>)}
  </div>
);
