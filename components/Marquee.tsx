const rowA = ["“Log a call with Priya from Northwind.”", "“Remind me to send the proposal Friday.”", "“Add Acme Logistics as a new lead.”", "“Summarize my last chat with Marcus.”"];
const rowB = ["“Show leads I haven’t contacted this week.”", "“Move Helio Health to Proposal.”", "“Create a task: call Sara on Monday.”", "“What did Aiko say about pricing?”"];

function Row({ items, reverse }: { items: string[]; reverse?: boolean }) {
  return (
    <div className="marquee-mask overflow-hidden">
      <div className={`marquee-track flex w-max gap-3 ${reverse ? "marquee-rev" : ""}`}>
        {[...items, ...items].map((t, i) => (
          <span key={i} aria-hidden={i >= items.length} className={`${i >= items.length ? "marquee-dup " : ""}whitespace-nowrap rounded-full border border-line bg-white px-4 py-2 text-sm text-ink/75 shadow-sm`}>{t}</span>
        ))}
      </div>
    </div>
  );
}

export default function Marquee() {
  return (
    <section aria-label="Example voice commands" className="space-y-3 border-y border-line bg-white/50 py-6">
      <Row items={rowA} />
      <Row items={rowB} reverse />
    </section>
  );
}
