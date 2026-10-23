import { RESOURCES } from "@/lib/crm-config";
import { sbRequest } from "@/lib/supabase";
import { dbError, err, guard, ok, readJson } from "@/lib/http";
import { isUuid, parse } from "@/lib/validate";

type P = { params: { resource: string; id: string } };
const target = ({ params }: P) => { const cfg = RESOURCES[params.resource]; return cfg && isUuid(params.id) ? cfg : null; };

export async function GET(req: Request, ctx: P) {
  const cfg = target(ctx); if (!cfg) return err("Not found.", 404);
  const g = await guard(req, false); if ("res" in g) return g.res;
  const r = await sbRequest<unknown[]>(g.auth.token, `${cfg.table}?id=eq.${ctx.params.id}&select=${encodeURIComponent(cfg.select)}&limit=1`);
  if (!r.ok) return dbError(r);
  if (!r.data?.length) return err("Not found.", 404);
  return ok({ data: r.data[0] });
}

export async function PATCH(req: Request, ctx: P) {
  const cfg = target(ctx); if (!cfg) return err("Not found.", 404);
  const g = await guard(req, true); if ("res" in g) return g.res;
  const body = await readJson(req); if ("error" in body) return err(body.error, body.status);
  const p = parse(cfg.fields, body.data, true);
  if ("error" in p) return err(p.error, 400);
  if (!Object.keys(p.data).length) return err("Nothing to update.", 400);
  cfg.before?.(p.data);
  const r = await sbRequest<unknown[]>(g.auth.token, `${cfg.table}?id=eq.${ctx.params.id}`, { method: "PATCH", body: p.data });
  if (!r.ok) return dbError(r);
  if (!r.data?.length) return err("Not found.", 404);
  return ok({ data: r.data[0] });
}

export async function DELETE(req: Request, ctx: P) {
  const cfg = target(ctx); if (!cfg) return err("Not found.", 404);
  const g = await guard(req, true); if ("res" in g) return g.res;
  const r = await sbRequest<unknown[]>(g.auth.token, `${cfg.table}?id=eq.${ctx.params.id}`, { method: "DELETE" });
  if (!r.ok) return dbError(r);
  if (!r.data?.length) return err("Not found.", 404);
  return ok({ ok: true });
}
