import { Mic, Sparkles, CalendarClock, ArrowLeft } from "lucide-react";

const points = [[Mic, "Update records by simply talking"], [Sparkles, "Review every change before it’s saved"], [CalendarClock, "Follow-ups created for you"]] as const;

export default function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr,1fr]">
      <aside style={{ position: "sticky", top: 0 }} className="aurora hidden overflow-hidden bg-ink p-10 text-paper lg:flex lg:h-screen lg:flex-col lg:justify-between">
        <a href="/" className="flex items-center gap-2 font-serif text-xl font-semibold"><span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-white"><Mic size={16} aria-hidden /></span>Voice CRM</a>
        <div>
          <h2 className="font-serif text-5xl font-semibold leading-[1.05]">Speak it.<br />CRM gets it done.</h2>
          <ul className="mt-8 space-y-4">{points.map(([I, t]) => <li key={t} className="flex items-center gap-3 text-lg text-paper/80"><span className="grid h-9 w-9 place-items-center rounded-full bg-white/10"><I size={16} aria-hidden /></span>{t}</li>)}</ul>
          <div className="floaty mt-8 max-w-sm rounded-2xl border border-white/15 bg-white/[.07] p-5 backdrop-blur-md">
            <p className="font-serif text-lg">“Met Rahul from ABC. Interested in Pro. Follow up Tuesday.”</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">{["Rahul", "ABC", "Pro plan", "Tuesday"].map((c) => <span key={c} className="rounded-full bg-accent/25 px-2.5 py-1 text-[#F7C9AE]">{c}</span>)}</div>
          </div>
          <p className="mt-3 text-xs text-paper/40">Illustration with sample data.</p>
        </div>
        <p className="text-sm text-paper/40">Currently in early development.</p>
      </aside>
      <section className="hero-bg flex flex-col px-5 py-8 sm:px-10">
        <a href="/" className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-accent"><ArrowLeft size={14} aria-hidden />Back to site</a>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <span className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-accent text-white lg:hidden"><Mic size={20} aria-hidden /></span>
          <h1 className="font-serif text-4xl font-semibold">{title}</h1>
          <p className="mt-2 text-ink/70">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-sm text-ink/70">{footer}</p>
        </div>
      </section>
    </main>
  );
}
