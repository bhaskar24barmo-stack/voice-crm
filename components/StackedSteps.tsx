const visuals = [
  <div key="a" className="flex h-16 items-end gap-1" aria-hidden>{Array.from({ length: 24 }).map((_, i) => <span key={i} className="w-1.5 origin-bottom rounded-full bg-accent/70" style={{ height: "100%", animation: `wave ${1.1 + (i % 5) * 0.15}s ease-in-out ${i * 0.05}s infinite` }} />)}</div>,
  <div key="b" className="flex flex-wrap gap-2 text-sm" aria-hidden>{["Rahul", "ABC Technologies", "Pro plan", "Next Tuesday"].map((c) => <span key={c} className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-accent">{c}</span>)}</div>,
  <div key="c" className="flex items-center gap-3 text-sm" aria-hidden><span className="rounded-lg bg-accent px-4 py-2 font-medium text-white">Confirm</span><span className="rounded-lg border border-ink/20 px-4 py-2">Edit</span><span className="text-ink/50">You stay in control</span></div>,
];

export default function StackedSteps({ steps }: { steps: string[][] }) {
  return (
    <ol className="mt-10 space-y-6 md:space-y-16">
      {steps.map(([n, t, d], i) => (
        <li key={n} className="spot rounded-3xl border border-line bg-white p-7 shadow-[0_30px_60px_-35px_rgba(25,25,25,.35)] md:sticky md:p-10"
          style={{ top: `${5.5 + i * 1.25}rem` }}>
          <div className="grid items-center gap-6 md:grid-cols-[auto,1fr,1fr] md:gap-10">
            <span className="font-serif text-6xl text-accent md:text-7xl">{n}</span>
            <div><h3 className="text-2xl font-semibold">{t}</h3><p className="mt-2 text-lg text-ink/70">{d}</p></div>
            <div className="rounded-2xl bg-paper p-5">{visuals[i]}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
