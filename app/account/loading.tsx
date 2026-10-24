import LogoMark from "@/components/LogoMark";

// Shown while a page loads: the logo's bars dance.
export default function Loading() {
  return (
    <div role="status" className="grid min-h-[60vh] place-items-center">
      <div className="text-center"><LogoMark size={76} mode="live" hover={false} /><p className="mt-4 text-sm text-ink/55">Loading…</p></div>
    </div>
  );
}
