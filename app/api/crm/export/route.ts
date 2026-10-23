import { sbRequest } from "@/lib/supabase";
import { dbError, guard } from "@/lib/http";

// Lets a user download everything they have stored (data portability).
export async function GET(req: Request) {
  const g = await guard(req, false);
  if ("res" in g) return g.res;
  const out: Record<string, unknown> = { exported_at: new Date().toISOString(), user: { id: g.auth.user.id, email: g.auth.user.email } };
  for (const t of ["contacts", "leads", "tasks", "activities", "calls"]) {
    const r = await sbRequest(g.auth.token, `${t}?select=*&order=created_at.asc&limit=10000`);
    if (!r.ok) return dbError(r);
    out[t] = r.data;
  }
  return new Response(JSON.stringify(out, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": 'attachment; filename="voice-crm-export.json"', "Cache-Control": "no-store" } });
}
