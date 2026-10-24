"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import LogoMark from "../LogoMark";
import LogoutButton from "../LogoutButton";
import { NAV } from "./nav";
import { ToastProvider } from "./ui";

const isActive = (pathname: string, href: string) => (href === "/account" ? pathname === href : pathname === href || pathname.startsWith(href + "/"));

function Brand() {
  return <Link href="/account" className="flex items-center gap-2.5 font-serif text-xl font-semibold"><LogoMark size={36} />Voice CRM</Link>;
}

export default function Shell({ name, email, children }: { name: string; email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  // Lets phones install the app to the home screen (the worker only passes requests through; nothing is cached).
  useEffect(() => { if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {}); }, []);
  const initial = (name || email || "?").slice(0, 1).toUpperCase();
  return (
    <ToastProvider>
      <div className="aurora" aria-hidden><span /><span /><span /></div>
      <div className="min-h-screen lg:grid lg:grid-cols-[15rem,1fr]">
        <aside className="sticky top-0 hidden h-screen p-4 lg:block">
          <div className="glass flex h-full flex-col rounded-3xl p-4">
            <div className="px-2"><Brand /></div>
            <nav aria-label="CRM" className="mt-8 flex-1 space-y-1">
              {NAV.map(({ href, label, icon: I }) => {
                const a = isActive(pathname, href);
                return <Link key={href} href={href} aria-current={a ? "page" : undefined} className={`group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm transition-all duration-300 ${a ? "bg-ink text-paper shadow-lg shadow-ink/20" : "text-ink/70 hover:translate-x-0.5 hover:bg-white/70"}`}><I size={18} aria-hidden className="transition-transform duration-300 group-hover:scale-110" />{label}{a && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />}</Link>;
              })}
            </nav>
            <div className="border-t border-ink/10 pt-4">
              <div className="flex items-center gap-3 px-1">
                <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-[#8F2F06] text-sm font-medium text-white">{initial}</span>
                <div className="min-w-0"><p className="truncate text-sm font-medium">{name || "Your account"}</p><p className="truncate text-xs text-ink/60">{email}</p></div>
              </div>
              <LogoutButton className="mt-3 w-full rounded-xl border border-ink/15 bg-white/70 px-4 py-2 text-sm font-medium transition hover:border-ink/40" />
            </div>
          </div>
        </aside>

        <header className="sticky top-0 z-30 flex items-center justify-between bg-white/60 px-4 backdrop-blur-xl lg:hidden" style={{ paddingTop: "env(safe-area-inset-top)", height: "calc(3.5rem + env(safe-area-inset-top))" }}>
          <Brand />
          <Link href="/account/settings" aria-label="Settings and profile" className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-accent to-[#8F2F06] text-sm font-medium text-white">{initial}</Link>
        </header>

        <main id="main" className="min-w-0 px-4 pb-32 pt-5 sm:px-8 lg:px-8 lg:pb-12 lg:pt-6">
          <div key={pathname} className="page-in">{children}</div>
        </main>

        {/* floating dock for phones: the active tab expands to show its name */}
        <nav aria-label="Main" className="fixed inset-x-3 z-40 mx-auto max-w-md lg:hidden" style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
          <ul className="flex items-center justify-between gap-1 rounded-[1.75rem] bg-ink/95 p-1.5 shadow-2xl shadow-ink/40 backdrop-blur-xl">
            {NAV.map(({ href, label, icon: I }) => {
              const a = isActive(pathname, href);
              return (
                <li key={href} className={a ? "" : "flex-1"}>
                  <Link href={href} aria-label={label} aria-current={a ? "page" : undefined} className={`flex h-12 items-center justify-center gap-2 rounded-full transition-all duration-300 active:scale-90 ${a ? "bg-accent px-4 text-white shadow-[0_6px_18px_-4px_rgba(194,80,26,.8)]" : "w-full text-paper/60"}`}>
                    <I size={20} aria-hidden />
                    <span className={`overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-300 ${a ? "max-w-[5rem] opacity-100" : "max-w-0 opacity-0"}`}>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </ToastProvider>
  );
}
