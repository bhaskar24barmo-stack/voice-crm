import { Check, X, Mic, FileText, CalendarClock, Users, History, ScrollText, ListChecks, SearchCheck } from "lucide-react";
import Nav from "@/components/Nav";
import Demo from "@/components/Demo";
import Waitlist from "@/components/Waitlist";
import HeroPreview from "@/components/HeroPreview";
import PipelineShowcase from "@/components/PipelineShowcase";
import RevealOnScroll from "@/components/RevealOnScroll";
import { Logo, Eyebrow, H2, primary, secondary } from "@/components/ui";

const wrap = "mx-auto max-w-6xl px-5";
const card = "spot card3d rounded-2xl border border-line bg-white p-6 shadow-sm";

const cmds = ["“Log a call with Priya from Northwind”", "“Add Meera as a new lead”", "“Remind me to follow up with Sam on Friday”", "“Summarize my last meeting with ABC Technologies”", "“Move Rahul to Proposal”", "“Who haven’t I contacted this week?”"];
const problems = ["Salespeople forget to log meetings.", "Follow-ups get lost in busy schedules.", "Updating records takes time.", "Important customer context gets scattered."];
const steps = [["01", "Speak naturally", "Tell Voice CRM what happened, what changed, or what needs to happen next."], ["02", "AI understands", "The AI extracts names, companies, notes, tasks, and dates into structured fields."], ["03", "Review and update", "Review the proposed changes, edit anything necessary, and confirm the update."]];
const features = [
  [Mic, "Voice-powered updates", "Speak a lead, a change, or a note instead of filling in forms.", "lg:col-span-2"],
  [FileText, "AI meeting notes", "Conversations become clear, searchable notes.", ""],
  [CalendarClock, "Automatic follow-up preparation", "Follow-ups are drafted from what you said, ready to approve.", ""],
  [Users, "Lead and contact management", "Keep people, companies, and leads organized in one place.", "lg:col-span-2"],
  [History, "Customer interaction timeline", "See every touchpoint with a customer in order.", "lg:col-span-2"],
  [ScrollText, "Conversation summaries", "Catch up on a relationship in seconds.", ""],
  [ListChecks, "Smart task creation", "Tasks and dates are picked out of natural speech.", ""],
  [SearchCheck, "Natural-language CRM search", "Ask for what you need in plain words.", "lg:col-span-2"],
] as const;
const old = ["Manual data entry", "Notes written after meetings", "Follow-ups created separately", "Context spread across records", "Admin work interrupts the day"];
const vc = ["Speak updates naturally", "Capture meeting context quickly", "Prepare follow-ups from conversations", "Keep customer information organized", "Spend more time with customers"];
const who = [["Sales professionals", "Log calls between meetings without opening a form."], ["Founders", "Keep every early customer conversation on record."], ["Small businesses", "Get a tidy CRM without a dedicated admin."], ["Sales teams", "Give everyone a consistent way to capture updates."], ["Freelancers and consultants", "Track clients and follow-ups as you work."], ["Customer-facing teams", "Share context so no one repeats questions."]];
const tiers = [["Free", "A light way to try voice updates."], ["Starter", "For individuals getting organized."], ["Pro", "For professionals who live in their CRM."], ["Business", "For teams that need to work together."]];
const faq = [
  ["What is Voice CRM?", "Voice CRM is a CRM you can talk to. You describe what happened, and AI turns it into structured contacts, notes, and follow-ups."],
  ["How does voice input work?", "You speak, your speech is transcribed, and AI proposes CRM fields from it. The product is in development, and the previews on this page are illustrations."],
  ["Can I edit AI-generated updates?", "Yes. Every proposed update is shown for review first, and you can change anything before you confirm."],
  ["Is my customer data secure?", "Security details will be published as the product is built. We don’t make security claims before they can be backed up."],
  ["Who is Voice CRM designed for?", "Salespeople, founders, small businesses, sales teams, freelancers, consultants, and other customer-facing teams."],
  ["When will Voice CRM be available?", "There is no launch date yet. Join the waitlist for early access and updates."],
];

export default function Home() {
  return (
    <div id="top">
      <Nav />
      <RevealOnScroll />
      <main>
        <section className={`${wrap} grid items-center gap-12 py-14 hero-bg lg:grid-cols-2 lg:py-24`}>
          <div>
            <h1 className="rise font-serif text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">Speak it. <span className="text-accent">CRM gets it done.</span></h1>
            <p className="rise mt-6 max-w-xl [animation-delay:150ms] text-lg leading-relaxed text-ink/75">Your voice is the fastest way to keep your CRM up to date. Capture leads, record conversations, and create follow-ups without the busywork.</p>
            <div className="rise mt-8 flex flex-wrap gap-3 [animation-delay:300ms]">
              <a href="#waitlist" className={primary}>Join the Waitlist</a>
              <a href="#how" className={secondary}>See How It Works</a>
            </div>
            <p className="mt-5 text-sm text-ink/60">Less admin. Better follow-through.</p>
          </div>
          <HeroPreview />
        </section>

        <div aria-hidden className="overflow-hidden border-y border-line py-4 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
          <div className="marquee flex w-max text-ink/70">
            {[...cmds, ...cmds].map((c, i) => <span key={i} className="whitespace-nowrap pr-12 font-serif text-lg">{c}</span>)}
          </div>
        </div>

        <section data-reveal id="product" className={`${wrap} py-20`}>
          <Eyebrow>The problem</Eyebrow>
          <H2>Your CRM should work at the speed of conversation.</H2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {problems.map((p) => <p key={p} className={`${card} text-lg`}>{p}</p>)}
          </div>
          <p className="mt-8 max-w-2xl text-lg text-ink/75">Voice CRM lets you say what happened and moves the typing off your plate, so records stay current while you stay with the customer.</p>
        </section>

        <section data-reveal id="how" className="border-y border-line bg-white/50 py-20">
          <div className={wrap}>
            <Eyebrow>How it works</Eyebrow>
            <H2>From conversation to organized CRM in seconds.</H2>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map(([n, t, d]) => (
                <li key={n} className={card}><span className="font-serif text-4xl text-accent">{n}</span><h3 className="mt-4 text-xl font-semibold">{t}</h3><p className="mt-2 text-ink/70">{d}</p></li>
              ))}
            </ol>
          </div>
        </section>

        <section data-reveal className={`${wrap} py-20`}>
          <Eyebrow>See it in action</Eyebrow>
          <H2>One sentence. An organized customer record.</H2>
          <Demo />
        </section>

        <PipelineShowcase />

        <section data-reveal className={`${wrap} py-20`}>
          <Eyebrow>Features</Eyebrow>
          <H2>Everything you need to keep customer relationships moving.</H2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(([Icon, t, d, span], i) => (
              <div key={t} className={`${i === 0 ? "bg-ink text-paper" : "bg-white"} spot card3d rounded-2xl border border-line p-6 shadow-sm ${span}`}>
                <Icon size={22} className={i === 0 ? "text-[#F0A37B]" : "text-accent"} aria-hidden />
                <h3 className="mt-4 text-lg font-semibold">{t}</h3>
                <p className={`mt-1.5 ${i === 0 ? "text-paper/75" : "text-ink/70"}`}>{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section data-reveal className="border-y border-line bg-white/50 py-20">
          <div className={wrap}>
            <H2>Less data entry. More meaningful conversations.</H2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className={card}>
                <h3 className="font-semibold text-ink/60">Traditional CRM</h3>
                <ul className="mt-4 space-y-3">{old.map((o) => <li key={o} className="flex gap-3 text-ink/70"><X size={18} className="mt-1 shrink-0 text-ink/40" aria-hidden />{o}</li>)}</ul>
              </div>
              <div className={`${card} border-accent/40`}>
                <h3 className="font-semibold text-accent">Voice CRM</h3>
                <ul className="mt-4 space-y-3">{vc.map((o) => <li key={o} className="flex gap-3"><Check size={18} className="mt-1 shrink-0 text-accent" aria-hidden />{o}</li>)}</ul>
              </div>
            </div>
          </div>
        </section>

        <section data-reveal className={`${wrap} py-20`}>
          <H2>Built for people who build relationships.</H2>
          <div className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {who.map(([t, d]) => <div key={t} className="border-t border-ink/15 pt-4"><h3 className="text-lg font-semibold">{t}</h3><p className="mt-1 text-ink/70">{d}</p></div>)}
          </div>
        </section>

        <section data-reveal id="pricing" className="border-y border-line bg-white/50 py-20">
          <div className={wrap}>
            <Eyebrow>Pricing preview</Eyebrow>
            <H2>A simpler way to manage your CRM.</H2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {tiers.map(([t, d]) => (
                <div key={t} className={`${card} ${t === "Pro" ? "border-accent ring-2 ring-accent lg:-my-3 lg:py-9" : ""}`}>
                  <h3 className="font-serif text-2xl font-semibold">{t}</h3>
                  <p className="mt-2 text-ink/70">{d}</p>
                  <p className="mt-6 font-medium">Pricing coming soon</p>
                  <p className="text-sm text-ink/50">Plan details to be announced.</p>
                </div>
              ))}
            </div>
            <a href="#waitlist" className={`${primary} mt-8`}>Join the waitlist for early access and pricing updates</a>
          </div>
        </section>

        <section data-reveal id="faq" className={`${wrap} py-20`}>
          <H2>Questions, answered.</H2>
          <div className="mt-10 max-w-3xl divide-y divide-line border-y border-line">
            {faq.map(([q, a]) => (
              <details key={q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">{q}<span aria-hidden className="text-2xl text-accent transition group-open:rotate-45">+</span></summary>
                <p className="mt-3 max-w-2xl text-ink/75">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section data-reveal id="waitlist" className="bg-ink py-20 text-paper">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 lg:grid-cols-2">
            <div>
              <h2 className="font-serif text-3xl font-semibold leading-tight sm:text-5xl">Be among the first to experience Voice CRM.</h2>
              <p className="mt-5 max-w-md text-lg text-paper/75">Get early access and help shape a more natural way to manage customer relationships.</p>
            </div>
            <div className="text-ink"><Waitlist /></div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className={`${wrap} grid gap-10 py-12 md:grid-cols-3`}>
          <div><Logo /><p className="mt-3 max-w-xs text-sm text-ink/70">A CRM you can simply talk to. Currently in early development.</p></div>
          <div className="text-sm"><p className="mb-3 font-medium">Product</p>
            <ul className="space-y-2 text-ink/70">{[["How it works", "#how"], ["Pricing", "#pricing"], ["FAQ", "#faq"], ["Waitlist", "#waitlist"]].map(([l, h]) => <li key={h}><a href={h} className="hover:text-accent">{l}</a></li>)}</ul></div>
          <div className="text-sm"><p className="mb-3 font-medium">Resources</p>
            <ul className="space-y-2 text-ink/60"><li>Blog (coming soon)</li><li>About (coming soon)</li><li>Privacy policy (coming soon)</li></ul></div>
        </div>
        <p className={`${wrap} pb-8 text-sm text-ink/50`}>© {new Date().getFullYear()} Voice CRM. All rights reserved.</p>
      </footer>
    </div>
  );
}
