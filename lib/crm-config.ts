import { ACTIVITY_TYPES, CALL_SOURCES, CONTACT_STATUS, PRIORITIES, STAGES } from "./crm-types";
import type { Fields } from "./validate";

export type Resource = {
  table: string; fields: Fields; select: string; order: string; search: string[];
  filters: string[]; // query params allowed as simple equality filters
  extra?: (sp: URLSearchParams, q: URLSearchParams) => void;
  before?: (data: Record<string, unknown>) => void;
};

const iso = (d: Date) => d.toISOString().slice(0, 10);

export const RESOURCES: Record<string, Resource> = {
  contacts: {
    table: "contacts", select: "*", order: "name.asc", search: ["name", "email", "company", "phone"], filters: ["status"],
    fields: {
      name: { t: "str", max: 120, req: true }, email: { t: "str", max: 254, email: true }, phone: { t: "str", max: 40 }, company: { t: "str", max: 120 },
      notes: { t: "str", max: 5000 }, tags: { t: "tags" }, status: { t: "enum", values: CONTACT_STATUS },
    },
  },
  leads: {
    table: "leads", select: "*,contact:contacts(id,name,company)", order: "updated_at.desc", search: ["title", "notes"], filters: ["status", "contact_id"],
    fields: {
      title: { t: "str", max: 160, req: true }, contact_id: { t: "uuid" }, status: { t: "enum", values: STAGES }, value: { t: "num", min: 0, max: 1e12 },
      expected_close: { t: "date" }, notes: { t: "str", max: 5000 },
    },
  },
  tasks: {
    table: "tasks", select: "*,contact:contacts(id,name),lead:leads(id,title)", order: "due_date.asc.nullslast,created_at.desc", search: ["title", "description"], filters: ["contact_id", "lead_id", "priority"],
    fields: {
      title: { t: "str", max: 200, req: true }, description: { t: "str", max: 5000 }, due_date: { t: "date" }, priority: { t: "enum", values: PRIORITIES },
      done: { t: "bool" }, contact_id: { t: "uuid" }, lead_id: { t: "uuid" },
    },
    // view = open | overdue | upcoming | done. The browser passes its own local `today`, so "overdue" matches the user's calendar.
    extra: (sp, q) => {
      const t = sp.get("today"); const today = t && /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : iso(new Date());
      const view = sp.get("view");
      if (view === "done") q.set("done", "eq.true");
      else if (view === "open" || view === "overdue" || view === "upcoming") {
        q.set("done", "eq.false");
        if (view === "overdue") q.set("due_date", `lt.${today}`);
        if (view === "upcoming") q.set("due_date", `gte.${today}`);
      }
    },
    before: (d) => { if (d.done === true) d.completed_at = new Date().toISOString(); else if (d.done === false) d.completed_at = null; },
  },
  activities: {
    table: "activities", select: "*,contact:contacts(id,name)", order: "occurred_at.desc", search: ["summary", "details"], filters: ["type", "contact_id", "lead_id"],
    fields: {
      type: { t: "enum", values: ACTIVITY_TYPES }, summary: { t: "str", max: 2000, req: true }, details: { t: "str", max: 8000 },
      occurred_at: { t: "datetime" }, contact_id: { t: "uuid" }, lead_id: { t: "uuid" },
    },
  },
  calls: {
    table: "calls", select: "*,contact:contacts(id,name)", order: "occurred_at.desc", search: ["summary", "notes"], filters: ["contact_id", "source"],
    fields: {
      contact_id: { t: "uuid" }, summary: { t: "str", max: 5000 }, notes: { t: "str", max: 20000 }, transcript: { t: "str", max: 50000 },
      duration_seconds: { t: "num", min: 0, max: 86400, int: true }, source: { t: "enum", values: CALL_SOURCES }, occurred_at: { t: "datetime" },
    },
  },
};
