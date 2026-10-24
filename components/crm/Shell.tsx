"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Mic } from "lucide-react";
import LogoutButton from "../LogoutButton";
import LogoMark from "../LogoMark";
import { haptic } from "@/lib/haptic";
import { NAV } from "./nav";
import { ToastProvider } from "./ui";

const isActive = (pathname: string, href: string) => (href === "/account" ? pathname === href : pathname === href || pathname.startsWith(href + "/"));
const TABS = NAV.filter((n) => n.href !== "/account/settings"); // Settings lives behind the avatar on phones

function Brand() {
  return <Link href="/account" className="flex items-center gap-2.5 font-serif text-xl font-semibold"><LogoMark size={36} />Voice CRM</Link>;
}

export default function Shell({ name, email, children }: { name: string; email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const initial = (name || email || "?").slice(0, 1).toUpperCase();
  const [hideHeader, setHideHeader] = useState(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const busy = useRef(false);

  // Lets phones install the app to the home screen (the worker only passes requests through; nothing is cached).
  useEffect(() => { if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {}); }, []);

  // Phones: the top bar slides away while you scroll down and returns when you scroll up.
  useEffect(() => {
    let last = window.scrollY;
    const on = () => { const y = window.scrollY; if (y > 90 && y > last + 8) setHideHeader(true); else if (y < last - 8 || y <= 90) setHideHeader(false); last = y; };
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // Phones: pull down from the top to refresh the data on screen.
  useEffect(() => {
    if (window.innerWidth >= 1024) return;
    let startY = 0, active = false, cur = 0;
    const ts = (e: TouchEvent) => { if (window.scrollY <= 0 && !busy.current && document.body.style.overflow !== "hidden") { startY = e.touches[0].clientY; active = true; cur = 0; } };
    const tm = (e: TouchEvent) => {
      if (!active) return;
      const dy = e.touches[0].clientY - startY;
      if (dy <= 0 || window.scrollY > 0) { cur = 0; setPull(0); if (window.scrollY > 0) active = false; return; }
      cur = Math.min(dy * 0.5, 90); setPull(cur);
    };
    const te = () => {
      if (!active) return;
      active = false;
      if (cur >= 64) { busy.current = true; setRefreshing(true); setPull(56); haptic(12); router.refresh(); setTimeout(() => { busy.current = false; setRefreshing(false); setPull(0); }, 1000); }
      else setPull(0);
      cur = 0;
    };
    window.addEventListener("touchstart", ts, { passive: true });
    window.addEventListener("touchmove", tm, { passive: true });
    window.addEventListener("touchend", te);
    return () => { window.removeEventListener("touchstart", ts); window.removeEventListener("touchmove", tm); window.removeEventListener("touchend", te); };
  }, [router]);

  // The mic button in the dock: on Home it starts recording; elsewhere it jumps Home and starts there.
  const speak = () => {
    haptic(15);
    if (pathname === "/account") { window.scrollTo({ top: 0, behavior: "smooth" }); window.dispatchEvent(new Event("vc:voice")); }
    else { try { sessionStorage.setItem("vc-autostart", "1"); } catch { /* storage unavailable */ } router.push("/account"); }
  };

  const tab = (href: string, label: string, I: typeof Mic) => {
    const a = isActive(pathname, href);
    return (
      <li key={href}>
        <Link href={href} aria-current={a ? "page" : undefined} onClick={() => haptic(6)} className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[10.5px] transition active:scale-90 ${a ? "font-medium text-white" : "text-paper/55"}`}>
          <span key={a ? "on" : "off"} className={`grid h-7 w-12 place-items-center rounded-full ${a ? "tab-pop bg-accent shadow-[0_6px_16px_-4px_rgba(194,80,26,.9)]" : ""}`}><I size={19} aria-hidden /></span>{label}
        </Link>
      </li>
    );
  };

  return (
    <ToastProvider>
      <div className="crm-aurora" aria-hidden><span /><span /><span /></div>
      {(pull > 0 || refreshing) && (
        <div aria-hidden className="pointer-events-none fixed left-1/2 z-30 lg:hidden" style={{ top: "calc(3.5rem + env(safe-area-inset-top))", transform: `translate(-50%, ${pull - 44}px)`, opacity: Math.min(1, pull / 50), transition: pull === 0 || refreshing ? "all .3s" : "none" }}>
          <LogoMark size={40} mode={refreshing ? "live" : "static"} hover={false} />
        </div>
      )}
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

        <header className={`sticky top-0 z-30 flex items-center justify-between bg-white/80 px-4 backdrop-blur-xl transition-transform duration-300 lg:hidden ${hideHeader ? "-translate-y-full" : ""}`} style={{ paddingTop: "env(safe-area-inset-top)", height: "calc(3.5rem + env(safe-area-inset-top))" }}>
          <Brand />
          <Link href="/account/settings" aria-label="Settings and profile" className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-accent to-[#8F2F06] text-sm font-medium text-white transition active:scale-90">{initial}</Link>
        </header>

        <main id="main" className="min-w-0 px-4 pb-36 pt-5 sm:px-8 lg:px-8 lg:pb-12 lg:pt-6">
          <div key={pathname} className="page-in">{children}</div>
        </main>

        {/* phone dock: four tabs and a raised mic button in the middle */}
        <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <ul className="mx-auto mb-3 grid w-[calc(100%-1.5rem)] max-w-md grid-cols-5 items-end rounded-[1.75rem] bg-ink/95 px-1.5 py-1 shadow-2xl shadow-ink/40 backdrop-blur-xl">
            {tab(TABS[0].href, TABS[0].label, TABS[0].icon)}
            {tab(TABS[1].href, TABS[1].label, TABS[1].icon)}
            <li className="relative h-14">
              <button onClick={speak} aria-label="Record a voice note" className="fab absolute -top-7 left-1/2 grid h-16 w-16 -translate-x-1/2 place-items-center rounded-full bg-gradient-to-br from-[#F59A5E] via-[#E0652A] to-[#B8440F] text-white outline-none ring-4 ring-[#141414] transition active:scale-90 focus-visible:ring-white/70"><Mic size={26} aria-hidden /></button>
              <span aria-hidden className="absolute inset-x-0 bottom-0.5 text-center text-[10.5px] text-paper/70">Speak</span>
            </li>
            {tab(TABS[2].href, TABS[2].label, TABS[2].icon)}
            {tab(TABS[3].href, TABS[3].label, TABS[3].icon)}
          </ul>
        </nav>
      </div>
    </ToastProvider>
  );
}
