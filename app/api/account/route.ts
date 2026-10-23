import { SB_ANON, SB_URL } from "@/lib/site";
import { err, guard, ok, readJson } from "@/lib/http";

// Updates the display name stored in Supabase Auth user metadata.
export async function PATCH(req: Request) {
  const g = await guard(req, true);
  if ("res" in g) return g.res;
  const body = await readJson(req, 2_000);
  if ("error" in body) return err(body.error, body.status);
  const name = String((body.data as { name?: unknown })?.name ?? "").trim();
  if (!name || name.length > 120) return err("Enter a name of up to 120 characters.", 400);
  const r = await fetch(`${SB_URL}/auth/v1/user`, { method: "PUT", headers: { apikey: SB_ANON, Authorization: `Bearer ${g.auth.token}`, "Content-Type": "application/json" }, body: JSON.stringify({ data: { name } }), cache: "no-store" }).catch(() => null);
  if (!r || !r.ok) return err("Couldn’t update your profile. Please try again.", 502);
  return ok({ ok: true, name });
}
