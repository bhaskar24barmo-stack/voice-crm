import type { Action, Contact, Task, Stage } from "./crm";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

/**
 * MOCK interpreter (rule-based). Swap the body for a call to your LLM route
 * (e.g. POST /api/assistant) that returns the same { reply, actions } shape.
 * Actions are only proposals; the UI applies them after the user confirms.
 */
export function interpret(text: string, contacts: Contact[], tasks: Task[]): { reply: string; actions: Action[] } {
  const t = text.trim();
  const low = t.toLowerCase();

  const mv = low.match(/move (\w+) to (new|contacted|proposal|won)/);
  if (mv) {
    const c = contacts.find((x) => x.name.toLowerCase().startsWith(mv[1]));
    const stage = cap(mv[2]) as Stage;
    return c
      ? { reply: `I can move ${c.name} to ${stage}.`, actions: [{ kind: "move", name: c.name, stage }] }
      : { reply: `I couldn’t find a contact called ${cap(mv[1])}.`, actions: [] };
  }

  if (/plan my day|what.*(today|due)|summar/.test(low)) {
    const due = tasks.filter((x) => !x.done && x.due === "Today");
    return {
      reply: due.length
        ? `Today you have ${due.length} follow-up${due.length > 1 ? "s" : ""}: ${due.map((x) => x.title).join("; ")}. Start with the first one.`
        : "Nothing is due today. A good use of the time: follow up with leads still in New.",
      actions: [],
    };
  }

  const day = low.match(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  const who = t.match(/(?:^|\s)(?:[Mm]et|[Ww]ith|[Aa]dd|[Cc]all|[Tt]alked to|[Ss]poke to)\s+([A-Z][a-z]+)/);
  const co = t.match(/from\s+([A-Z][\w&.]*(?:\s+[A-Z][\w&.]*)*)/);
  const plan = low.match(/(starter|pro|business|enterprise)/);
  const actions: Action[] = [];
  if (who && /met|add|talked|spoke|meeting/.test(low))
    actions.push({ kind: "contact", name: who[1], company: co ? co[1] : "", interest: plan ? cap(plan[1]) : "" });
  if (/follow|remind|call|schedule/.test(low) && (day || who))
    actions.push({ kind: "task", title: `Follow up with ${who ? who[1] : "contact"}`, due: day ? cap(day[1]) : "This week" });

  return actions.length
    ? { reply: "Here’s what I understood. Review it, then confirm.", actions }
    : { reply: "I can add contacts, schedule follow-ups, move deals between stages, or plan your day. Try: “Met Rahul from ABC Technologies, he wants the Pro plan, follow up Tuesday.”", actions: [] };
}
