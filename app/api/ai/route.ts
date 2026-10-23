import { AI_TASKS, buildPrompt, formatActionItems, loadContext, parseActionItems, type AiTask } from "@/lib/ai";
import { aiConfigured } from "@/lib/config";
import { err, guard, ok, rateLimit, readJson } from "@/lib/http";
import { chat } from "@/lib/openrouter";
import { isDate, isUuid } from "@/lib/validate";

export const maxDuration = 45;

export async function POST(req: Request) {
  const g = await guard(req, true);
  if ("res" in g) return g.res;
  if (!aiConfigured()) return err("The AI assistant isn’t configured yet. An admin needs to set OPENROUTER_API_KEY and OPENROUTER_MODEL.", 503);

  const body = await readJson(req, 20_000);
  if ("error" in body) return err(body.error, body.status);
  const b = (body.data ?? {}) as Record<string, unknown>;
  const task = b.task as AiTask;
  if (!AI_TASKS.includes(task)) return err("Choose what you want the assistant to do.", 400);

  const text = typeof b.text === "string" ? b.text.trim() : "";
  const instruction = typeof b.instruction === "string" ? b.instruction.trim() : "";
  if (text.length > 8000) return err("That text is too long. Keep it under 8,000 characters.", 400);
  if (instruction.length > 500) return err("Keep the instruction under 500 characters.", 400);
  const contactId = b.contactId ? String(b.contactId) : undefined, leadId = b.leadId ? String(b.leadId) : undefined;
  if ((contactId && !isUuid(contactId)) || (leadId && !isUuid(leadId))) return err("Invalid contact or lead.", 400);
  const today = isDate(b.today) ? (b.today as string) : new Date().toISOString().slice(0, 10);

  const needs: Record<AiTask, boolean> = {
    summarize_notes: !!(text || contactId || leadId), action_items: !!text, draft_email: !!(contactId || leadId),
    next_steps: !!(contactId || leadId), workflow_help: !!text, summarize_interactions: !!(contactId || leadId),
  };
  if (!needs[task]) return err(task === "action_items" || task === "workflow_help" ? "Add some text first." : "Choose a contact or lead first.", 400);

  const limited = await rateLimit(g.auth.token, "ai", 30, 10);
  if (limited) return limited;

  let context = "";
  if (task !== "workflow_help" && (contactId || leadId)) {
    const c = await loadContext(g.auth.token, { contactId, leadId });
    if ("fail" in c) return err(c.fail.message, c.fail.status);
    context = c.text;
  }
  const prompt = buildPrompt(task, { text, context, instruction, today });
  const r = await chat([{ role: "system", content: prompt.system }, { role: "user", content: prompt.user }], { maxTokens: prompt.json ? 1200 : 900 });
  if (!r.ok) return err(r.error, r.status);

  if (prompt.json) {
    const parsed = parseActionItems(r.text);
    if (!parsed) return err("The AI’s answer couldn’t be read. Please try again.", 502);
    return ok({ result: formatActionItems(parsed), data: parsed });
  }
  return ok({ result: r.text });
}
