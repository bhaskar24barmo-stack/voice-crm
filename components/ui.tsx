import { AudioLines } from "lucide-react";
import type { ReactNode } from "react";

export const Logo = () => (
  <a href="/" className="flex items-center gap-2 font-serif text-xl font-semibold">
    <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-paper"><AudioLines size={18} aria-hidden /></span>
    Voice CRM
  </a>
);
export const Eyebrow = ({ children }: { children: ReactNode }) => (
  <p className="mb-3 text-sm font-medium uppercase tracking-widest text-accent">{children}</p>
);
export const H2 = ({ children }: { children: ReactNode }) => (
  <h2 className="max-w-3xl font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl">{children}</h2>
);
const btn = "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-base font-medium transition hover:-translate-y-0.5";
export const primary = `${btn} bg-accent text-white shadow-sm hover:bg-[#a84315]`;
export const secondary = `${btn} border border-ink/20 bg-white hover:border-ink/50`;
