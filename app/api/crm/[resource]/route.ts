import { RESOURCES } from "@/lib/crm-config";
import { sbRequest } from "@/lib/supabase";
import { dbError, err, guard, ok, readJson } from "@/lib/http";
import { parse } from "@/lib/validate";

const int = (v: string | null, d: number, min: number, max: number) => { const n = Number.parseInt(v ?? "", 10); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d; };

export async function GET(req: Request, { params }: { params: { resource: string } }) {
  const cfg = RESOURCES[params.resource];
  if (!cfg) return err("Not found.", 404);
  const g = await guard(req, false);
  if ("res" in g) return g.res;

  const sp = new URL(req.url).searchParams;
  const q = new URLSearchParams({ select: cfg.select, order: cfg.order, limit: String(int(sp.get("limit"), 25, 1, 100)), offset: String(int(sp.get("offset"), 0, 0, 100000)) });
  const term = (sp.get("q") ?? "").replace(/[,()*%\\"':]/g, " ").trim().slice(0, 80);
  if (term) q.set("or", `(${cfg.search.map((c) => `${c}.ilike.*${term}*`).join(",")})`);
  for (const f of cfg.filters) { const v = sp.get(f); if (v && /^[A-Za-z0-9_-]{1,40}$/.test(v)) q.set(f, `eq.${v}`); }
  cfg.extra?.(sp, q);

  const r = await sbRequest(g.auth.token, `${cfg.table}?${q}`, { count: true });
  if (!r.ok) return dbError(r);
  return ok({ data: r.data, total: r.count });
}

export async function POST(req: Request, { params }: { params: { resource: string } }) {
  const cfg = RESOURCES[params.resource];
  if (!cfg) return err("Not found.", 404);
  const g = await guard(req, true);
  if ("res" in g) return g.res;
  const body = await readJson(req);
  if ("error" in body) return err(body.error, body.status);
  const p = parse(cfg.fields, body.data, false);
  if ("error" in p) return err(p.error, 400);
  cfg.before?.(p.data);
  const r = await sbRequest<unknown[]>(g.auth.token, cfg.table, { method: "POST", body: p.data });
  if (!r.ok) return dbError(r);
  return ok({ data: r.data?.[0] ?? null }, 201);
}
