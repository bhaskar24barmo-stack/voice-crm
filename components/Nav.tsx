"use client";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo, primary } from "./ui";

const links = [["Product", "/#product"], ["How It Works", "/#how"], ["Pricing", "/#pricing"]];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 8);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  return (
    <header className={`sticky top-0 z-50 transition ${scrolled || open ? "border-b border-line bg-paper/90 backdrop-blur" : ""}`}>
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <ul className="hidden items-center gap-8 text-sm md:flex">
          {links.map(([l, h]) => <li key={h}><a href={h} className="hover:text-accent">{l}</a></li>)}
          <li><a href="/blog" className="hover:text-accent">Blog</a></li>
        </ul>
        <div className="hidden items-center gap-4 md:flex">
          <a href="/login" className="text-sm hover:text-accent">Log in</a>
          <a href="/#waitlist" className={`${primary} !py-2 text-sm`}>Join Waitlist</a>
        </div>
        <button className="p-2 md:hidden" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      {open && (
        <div id="mobile-menu" className="border-t border-line px-5 pb-5 md:hidden">
          <ul className="flex flex-col py-3">
            {links.map(([l, h]) => <li key={h}><a href={h} onClick={() => setOpen(false)} className="block py-2.5 text-lg">{l}</a></li>)}
            <li><a href="/blog" onClick={() => setOpen(false)} className="block py-2.5 text-lg">Blog</a></li><li><a href="/login" onClick={() => setOpen(false)} className="block py-2.5 text-lg">Log in</a></li>
          </ul>
          <a href="/#waitlist" onClick={() => setOpen(false)} className={`${primary} w-full`}>Join Waitlist</a>
        </div>
      )}
    </header>
  );
}
