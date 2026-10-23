import { sttConfigured } from "@/lib/config";
import { err, guard, ok, rateLimit } from "@/lib/http";

export const maxDuration = 60;
const MAX_BYTES = 4 * 1024 * 1024; // stays under Vercel's 4.5 MB request body limit

// Forwards one audio clip to the configured speech-to-text provider (any OpenAI-compatible /audio/transcriptions endpoint). Audio is never stored.
export async function POST(req: Request) {
  const g = await guard(req, true);
  if ("res" in g) return g.res;
  if (!sttConfigured()) return err("Transcription isn’t configured yet. An admin needs to set STT_API_URL, STT_API_KEY and STT_MODEL.", 503);
  if (Number(req.headers.get("content-length") || 0) > MAX_BYTES + 50_000) return err("That audio is too large. The limit is 4 MB, roughly 20 minutes of recording.", 413);

  const form = await req.formData().catch(() => null);
  if (!form) return err("Couldn’t read the upload.", 400);
  if (form.get("consent") !== "yes") return err("Confirm you have permission to record or upload this call first.", 400);
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return err("Choose an audio file.", 400);
  if (file.size > MAX_BYTES) return err("That audio is too large. The limit is 4 MB.", 413);
  if (!/^(audio\/|video\/(webm|mp4))/.test(file.type)) return err("That file type isn’t supported. Use an audio file such as MP3, M4A, WAV or WebM.", 415);

  const limited = await rateLimit(g.auth.token, "stt", 15, 10);
  if (limited) return limited;

  const fd = new FormData();
  fd.append("file", file, file.name || "audio.webm");
  fd.append("model", process.env.STT_MODEL as string);
  fd.append("response_format", "json");
  try {
    const r = await fetch(process.env.STT_API_URL as string, { method: "POST", headers: { Authorization: `Bearer ${process.env.STT_API_KEY}` }, body: fd, signal: AbortSignal.timeout(55000) });
    if (!r.ok) {
      if (r.status === 401 || r.status === 403) return err("The transcription provider rejected the API key. Check STT_API_KEY.", 502);
      if (r.status === 413) return err("The transcription provider says that audio is too large.", 413);
      if (r.status === 429) return err("The transcription provider is busy. Please try again shortly.", 429);
      return err("Transcription failed. Check the audio file and STT_MODEL, then try again.", 502);
    }
    const j = await r.json().catch(() => null);
    const text = typeof j?.text === "string" ? j.text.trim() : "";
    if (!text) return err("No speech was detected in that audio.", 422);
    return ok({ text: text.slice(0, 50000) });
  } catch (e) {
    const n = (e as { name?: string })?.name;
    return err(n === "TimeoutError" || n === "AbortError" ? "Transcription took too long. Try a shorter clip." : "Couldn’t reach the transcription provider.", 504);
  }
}
