"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Kanban, CheckSquare, Ellipsis, X, Mic } from "lucide-react";
import LogoutButton from "../LogoutButton";
import { NAV } from "./nav";
import Jelly from "./Jelly";
import { ToastProvider } from "./ui";

const isActive = (pathname: string, href: string) => (href === "/account" ? pathname === href : pathname === href || pathname.startsWith(href + "/"));
const TABS = [
  { href: "/account", label: "Home", icon: LayoutDashboard },
  { href: "/account/contacts", label: "Contacts", icon: Users },
  { href: "/account/leads", label: "Pipeline", icon: Kanban },
  { href: "/account/tasks", label: "Tasks", icon: CheckSquare },
];
const MORE = NAV.filter((n) => !TABS.some((t) => t.href === n.href));

function Brand() {
  return <Link href="/account" className="flex items-center gap-2 font-serif text-xl font-semibold"><span className="grid h-8 w-8 place-items-center rounded-xl bg-accent text-white"><Mic size={16} aria-hidden /></span>Voice CRM</Link>;
}

function Sidebar({ name, email, pathname }: { name: string; email: string; pathname: string }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-2"><Brand /></div>
      <nav aria-label="CRM" className="mt-8 flex-1 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: I }) => {
          const a = isActive(pathname, href);
          return <Link key={href} href={href} aria-current={a ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${a ? "bg-accent/10 font-medium text-accent" : "text-ink/75 hover:bg-ink/5"}`}><I size={18} aria-hidden />{label}</Link>;
        })}
      </nav>
      <div className="border-t border-line pt-4">
        <div className="flex items-center gap-3 px-2">
          <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-sm font-medium text-paper">{(name || email || "?").slice(0, 1).toUpperCase()}</span>
          <div className="min-w-0"><p className="truncate text-sm font-medium">{name || "Your account"}</p><p className="truncate text-xs text-ink/60">{email}</p></div>
        </div>
        <LogoutButton className="mt-3 w-full rounded-xl border border-ink/15 bg-white px-4 py-2 text-sm font-medium transition hover:border-ink/40" />
      </div>
    </div>
  );
}

export default function Shell({ name, email, aiReady, children }: { name: string; email: string; aiReady: boolean; children: React.ReactNode }) {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  useEffect(() => { setMore(false); }, [pathname]);
  useEffect(() => {
    if (!more) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setMore(false);
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [more]);
  const current = NAV.find((n) => isActive(pathname, n.href));
  const moreActive = MORE.some((n) => isActive(pathname, n.href));

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[radial-gradient(60rem_30rem_at_90%_-10%,rgba(194,80,26,.07),transparent)] lg:grid lg:grid-cols-[16rem,1fr]">
        <aside className="sticky top-0 hidden h-screen border-r border-line bg-white/80 p-4 backdrop-blur lg:block"><Sidebar name={name} email={email} pathname={pathname} /></aside>

        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur lg:hidden" style={{ paddingTop: "env(safe-area-inset-top)", height: "calc(3.5rem + env(safe-area-inset-top))" }}>
          <Brand />
          <Link href="/account/settings" aria-label="Settings and profile" className="grid h-9 w-9 place-items-center rounded-full bg-ink text-sm font-medium text-paper">{(name || email || "?").slice(0, 1).toUpperCase()}</Link>
        </header>

        <main id="main" className="min-w-0 px-4 pb-32 pt-6 sm:px-8 lg:px-10 lg:pb-12 lg:pt-8">
          <p className="sr-only" aria-live="polite">{current?.label}</p>
          <div key={pathname} className="page-in">{children}</div>
        </main>

        <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <ul className="mx-auto grid max-w-lg grid-cols-5">
            {TABS.map(({ href, label, icon: I }) => { const a = isActive(pathname, href); return (
              <li key={href}><Link href={href} aria-current={a ? "page" : undefined} className={`flex min-h-[3.75rem] flex-col items-center justify-center gap-0.5 text-[11px] transition active:scale-95 ${a ? "font-medium text-accent" : "text-ink/60"}`}>
                <span className={`grid h-7 w-12 place-items-center rounded-full transition ${a ? "bg-accent/10" : ""}`}><I size={20} aria-hidden /></span>{label}</Link></li>
            ); })}
            <li><button onClick={() => setMore(true)} aria-haspopup="dialog" aria-expanded={more} className={`flex min-h-[3.75rem] w-full flex-col items-center justify-center gap-0.5 text-[11px] transition active:scale-95 ${moreActive ? "font-medium text-accent" : "text-ink/60"}`}>
              <span className={`grid h-7 w-12 place-items-center rounded-full ${moreActive ? "bg-accent/10" : ""}`}><Ellipsis size={20} aria-hidden /></span>More</button></li>
          </ul>
        </nav>

        {more && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="More">
            <button aria-label="Close menu" className="fade-in absolute inset-0 bg-ink/40" onClick={() => setMore(false)} />
            <div className="sheet-up absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-4 shadow-2xl" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-ink/15" aria-hidden />
              <div className="mb-2 flex items-center justify-between px-1"><p className="font-serif text-xl font-semibold">More</p><button onClick={() => setMore(false)} aria-label="Close" className="rounded-lg p-2 text-ink/60 hover:bg-ink/5"><X size={18} /></button></div>
              <ul className="grid grid-cols-2 gap-2">
                {MORE.map(({ href, label, icon: I }) => (
                  <li key={href}><Link href={href} className={`flex items-center gap-3 rounded-2xl border border-line p-4 text-sm font-medium active:scale-[.98] ${isActive(pathname, href) ? "border-accent/40 bg-accent/5 text-accent" : ""}`}><I size={20} aria-hidden />{label}</Link></li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-paper p-3"><div className="min-w-0 text-sm"><p className="truncate font-medium">{name || "Your account"}</p><p className="truncate text-xs text-ink/60">{email}</p></div>
                <LogoutButton className="shrink-0 rounded-xl border border-ink/15 bg-white px-4 py-2 text-sm font-medium" /></div>
            </div>
          </div>
        )}
        <Jelly aiReady={aiReady} />
      </div>
    </ToastProvider>
  );
}
