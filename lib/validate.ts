// Small dependency-free request validation. Only fields listed in a spec are ever read, so clients can't set user_id, id, etc.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isUuid = (s: unknown): s is string => typeof s === "string" && UUID.test(s);
export const isDate = (s: unknown): s is string => typeof s === "string" && DATE.test(s) && !Number.isNaN(Date.parse(s));

type Base = { req?: boolean };
export type Spec = Base & (
  | { t: "str"; max: number; email?: boolean }
  | { t: "enum"; values: readonly string[] }
  | { t: "date" } | { t: "datetime" } | { t: "uuid" } | { t: "bool" } | { t: "tags" }
  | { t: "num"; min: number; max: number; int?: boolean }
);
export type Fields = Record<string, Spec>;
export type Parsed = { data: Record<string, unknown> } | { error: string };

const label = (k: string) => { const s = k.replace(/_/g, " "); return s[0].toUpperCase() + s.slice(1); };

export function parse(fields: Fields, body: unknown, partial: boolean): Parsed {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "Invalid request." };
  const src = body as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, s] of Object.entries(fields)) {
    const v = src[k];
    if (v === undefined) { if (!partial && s.req) return { error: `${label(k)} is required.` }; continue; }
    const empty = v === null || (typeof v === "string" && v.trim() === "");
    if (empty) {
      if (s.req) return { error: `${label(k)} is required.` };
      if (s.t === "tags") out[k] = [];
      else if (s.t !== "bool" && s.t !== "enum") out[k] = null; // enums/bools fall back to the database default
      continue;
    }
    switch (s.t) {
      case "str": {
        if (typeof v !== "string") return { error: `${label(k)} must be text.` };
        const t = v.trim();
        if (t.length > s.max) return { error: `${label(k)} must be ${s.max} characters or fewer.` };
        if (s.email && !EMAIL.test(t)) return { error: "Enter a valid email address." };
        out[k] = t; break;
      }
      case "enum":
        if (typeof v !== "string" || !s.values.includes(v)) return { error: `${label(k)} isn’t a valid choice.` };
        out[k] = v; break;
      case "date":
        if (!isDate(v)) return { error: `${label(k)} must be a date.` };
        out[k] = v; break;
      case "datetime": {
        const ms = typeof v === "string" ? Date.parse(v) : NaN;
        if (Number.isNaN(ms)) return { error: `${label(k)} must be a date and time.` };
        out[k] = new Date(ms).toISOString(); break;
      }
      case "uuid":
        if (!isUuid(v)) return { error: `${label(k)} is invalid.` };
        out[k] = v; break;
      case "bool":
        if (typeof v !== "boolean") return { error: `${label(k)} must be true or false.` };
        out[k] = v; break;
      case "num": {
        const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
        if (!Number.isFinite(n) || n < s.min || n > s.max || (s.int && !Number.isInteger(n))) return { error: `${label(k)} must be a ${s.int ? "whole " : ""}number between ${s.min} and ${s.max}.` };
        out[k] = n; break;
      }
      case "tags": {
        if (!Array.isArray(v) || v.length > 20) return { error: "Use at most 20 tags." };
        const tags = [...new Set(v.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean))];
        if (tags.some((x) => x.length > 40)) return { error: "Each tag must be 40 characters or fewer." };
        out[k] = tags; break;
      }
    }
  }
  return { data: out };
}
