"use client";
import { useEffect, useState } from "react";
import { Share, X } from "lucide-react";
import LogoMark from "../LogoMark";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

// Phones only: offers "Add to Home Screen" so Voice CRM opens like an app. Hidden once installed or dismissed.
export default function InstallPrompt() {
  const [ev, setEv] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try { dismissed = localStorage.getItem("vc-install-dismissed") === "1"; } catch { /* storage unavailable */ }
    const installed = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (dismissed || installed) return;
    const onPrompt = (e: Event) => { e.preventDefault(); setEv(e as InstallEvent); setShow(true); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIos) { setIos(true); setShow(true); }
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => { setShow(false); try { localStorage.setItem("vc-install-dismissed", "1"); } catch { /* storage unavailable */ } };
  if (!show) return null;
  return (
    <div className="glass rise flex items-center gap-3 rounded-3xl p-4 lg:hidden" role="region" aria-label="Install the app">
      <LogoMark size={44} hover={false} mode="static" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium">Add Voice CRM to your home screen</p>
        <p className="text-ink/60">{ios ? <>Tap <Share size={13} className="inline -translate-y-px" aria-label="Share" /> then “Add to Home Screen”.</> : "Opens full screen, one tap away."}</p>
      </div>
      {ev && <button onClick={async () => { await ev.prompt(); const c = await ev.userChoice; if (c.outcome === "accepted") dismiss(); }} className="shrink-0 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white active:scale-95">Install</button>}
      <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 rounded-lg p-2 text-ink/50 hover:bg-ink/5"><X size={16} /></button>
    </div>
  );
}
