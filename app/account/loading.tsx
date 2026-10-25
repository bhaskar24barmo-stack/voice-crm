import LogoMark from "@/components/LogoMark";

// Shown the instant a page is tapped: the logo's bars dance above placeholder cards that shimmer, so it feels like content is arriving.
export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="mx-auto max-w-6xl">
      <span className="sr-only">Loading…</span>
      <div className="flex flex-col items-center pb-6 pt-2" aria-hidden>
        <LogoMark size={56} mode="live" hover={false} />
        <p className="mt-3 text-sm text-ink/50">Getting things ready…</p>
      </div>
      <div className="space-y-3" aria-hidden>
        <div className="skeleton h-10 w-2/3 rounded-xl sm:w-1/3" />
        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-3xl" style={{ animationDelay: `${i * 140}ms` }} />)}
      </div>
    </div>
  );
}
