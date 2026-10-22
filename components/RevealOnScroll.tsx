"use client";
import { useEffect } from "react";

export default function RevealOnScroll() {
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>(".spot");
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    document.addEventListener("pointermove", move);
    let io: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      document.documentElement.classList.add("js-reveal");
      io = new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io?.unobserve(e.target); }
      }), { threshold: 0.08 });
      document.querySelectorAll("[data-reveal]").forEach((el) => io?.observe(el));
    }
    return () => { document.removeEventListener("pointermove", move); io?.disconnect(); };
  }, []);
  return null;
}
