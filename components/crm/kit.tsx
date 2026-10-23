import type { ReactNode } from "react";

export const Card = ({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) => (
  <section className={`rounded-2xl border border-line bg-white p-5 ${className}`}>
    {title && <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-serif text-xl font-semibold">{title}</h2>{action}</div>}
    {children}
  </section>
);
export const Stat = ({ label, value, hint }: { label: string; value: number; hint?: string }) => (
  <div className="rounded-2xl border border-line bg-white p-5">
    <p className="text-sm text-ink/65">{label}</p>
    <p className="mt-2 font-serif text-4xl font-semibold tabular-nums">{value}</p>
    {hint && <p className="mt-1 text-xs text-ink/55">{hint}</p>}
  </div>
);
export const Empty = ({ children }: { children: ReactNode }) => <p className="rounded-xl bg-paper px-4 py-5 text-sm text-ink/65">{children}</p>;
export const Unavailable = ({ label, icon }: { label: string; icon: ReactNode }) => (
  <span aria-disabled="true" title="Not available yet" className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-dashed border-ink/20 px-4 py-2.5 text-sm text-ink/45">{icon}{label}<span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px]">Soon</span></span>
);
