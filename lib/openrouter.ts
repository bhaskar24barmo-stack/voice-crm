import { SITE_URL } from "./site";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
export type ChatResult = { ok: true; text: string } | { ok: false; status: number; error: string };

const fail = (status: number, error: string): ChatResult => ({ ok: false, status, error });

// Server-only. The key and model come from OPENROUTER_API_KEY and OPENROUTER_MODEL; nothing is hard-coded.
export async function chat(messages: ChatMessage[], opts: { maxTokens?: number } = {}): Promise<ChatResult> {
  const key = process.env.OPENROUTER_API_KEY, model = process.env.OPENROUTER_MODEL;
  if (!key || !model) return fail(503, "The AI assistant isn’t configured yet. An admin needs to set OPENROUTER_API_KEY and OPENROUTER_MODEL.");
  const byStatus = (s: number): ChatResult => {
    if (s === 401 || s === 403) return fail(502, "The AI provider rejected the API key. Check OPENROUTER_API_KEY.");
    if (s === 402) return fail(502, "The AI provider account is out of credits.");
    if (s === 400 || s === 404) return fail(502, "The configured AI model isn’t available. Check OPENROUTER_MODEL.");
    if (s === 429) return fail(429, "The AI provider is busy right now. Please try again in a moment.");
    return fail(502, "The AI provider had a problem. Please try again.");
  };
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "HTTP-Referer": SITE_URL, "X-Title": "Voice CRM" },
      body: JSON.stringify({ model, messages, max_tokens: opts.maxTokens ?? 900, temperature: 0.3 }),
      signal: AbortSignal.timeout(30000),
    });
    if (!r.ok) return byStatus(r.status);
    const j = await r.json().catch(() => null);
    if (j?.error) return byStatus(Number(j.error.code) || 502); // OpenRouter can report errors inside a 200 response
    const text = j?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) return fail(502, "The AI returned an empty answer. Please try again.");
    return { ok: true, text: text.trim() };
  } catch (e) {
    const n = (e as { name?: string })?.name;
    if (n === "TimeoutError" || n === "AbortError") return fail(504, "The AI took too long to answer. Please try again.");
    return fail(502, "Couldn’t reach the AI provider. Please try again.");
  }
}
