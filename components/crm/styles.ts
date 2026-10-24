// Class strings live here (not in a "use client" file) so server pages can use them too.
import { primary, secondary } from "../ui";

export const field = "mt-1.5 w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:bg-ink/5";
export const btnP = `${primary} !px-4 !py-2 text-sm disabled:opacity-60 disabled:hover:translate-y-0 active:scale-[.96]`;
export const btnS = `${secondary} !px-4 !py-2 text-sm disabled:opacity-60 disabled:hover:translate-y-0 active:scale-[.96]`;
export const btnD = "inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 active:scale-[.96] disabled:opacity-60";
