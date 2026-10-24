import type { ReactNode } from "react";
import { CountUp, Spot } from "./fx";

export const Card = ({ title, action, children, className = "", delay = 0 }: { title?: string; action?: ReactNode; children: ReactNode; className?: string; delay?: number }) => (
  <Spot className={`glass rise rounded-3xl p-5 ${className}`} style={{ animationDelay: `${delay}ms` }}>
    {title && <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-serif text-xl font-semibold">{title}</h2>{action}</div>}
    {children}
  </Spot>
);
export const Stat = ({ label, value, hint, icon, delay = 0 }: { label: string; value: number; hint?: string; icon?: ReactNode; delay?: number }) => (
  <Spot className="glass rise rounded-3xl p-5" style={{ animationDelay: `${delay}ms` }}>
    <div className="flex items-start justify-between gap-2"><p className="text-sm text-ink/65">{label}</p>{icon && <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/10 text-accent">{icon}</span>}</div>
    <p className="mt-3 font-serif text-5xl font-semibold leading-none"><CountUp value={value} /></p>
    {hint && <p className="mt-2 text-xs text-ink/55">{hint}</p>}
  </Spot>
);
export const Empty = ({ children }: { children: ReactNode }) => <p className="rounded-2xl bg-ink/[.04] px-4 py-5 text-sm text-ink/65">{children}</p>;
