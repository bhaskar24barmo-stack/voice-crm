"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supa } from "@/lib/supabase";
import { seedContacts, seedTasks, type Action, type Contact, type Stage, type Task } from "@/lib/crm";

export type Log = { id: string; text: string };
export type VoiceNote = { id: string; transcript: string; actions: Action[]; status: string; created_at: string };
type S = {
  ready: boolean; error: string; demo: boolean;
  contacts: Contact[]; tasks: Task[]; activity: Log[]; notes: VoiceNote[];
  addContact: (c: { name: string; company: string; interest: string }) => Promise<void>;
  addTask: (title: string, due: string) => Promise<void>;
  setStage: (id: string, stage: Stage) => Promise<void>;
  toggle: (id: string) => Promise<void>;
  apply: (a: Action) => Promise<void>;
  saveVoice: (transcript: string, actions: Action[], status: string) => Promise<void>;
};
const Ctx = createContext<S | null>(null);
export const useCrm = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("CrmProvider is missing");
  return c;
};

export function CrmProvider({ children }: { children: ReactNode }) {
  const db = useMemo(() => supa(), []);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activity, setActivity] = useState<Log[]>([]);
  const [notes, setNotes] = useState<VoiceNote[]>([]);

  useEffect(() => {
    if (!db) { setContacts(seedContacts); setTasks(seedTasks); setReady(true); return; }
    (async () => {
      const { data } = await db.auth.getUser();
      if (!data.user) { window.location.href = process.env.NEXT_PUBLIC_LOGIN_PATH || "/login"; return; }
      const [c, t, a, v] = await Promise.all([
        db.from("contacts").select("*").order("created_at"),
        db.from("tasks").select("*").order("created_at"),
        db.from("activities").select("*").order("created_at", { ascending: false }).limit(20),
        db.from("voice_notes").select("*").order("created_at", { ascending: false }).limit(30),
      ]);
      const err = c.error || t.error || a.error || v.error;
      if (err) setError(`Could not load data: ${err.message}. Have you run the SQL migration?`);
      setContacts((c.data as Contact[]) ?? []); setTasks((t.data as Task[]) ?? []);
      setActivity((a.data as Log[]) ?? []); setNotes((v.data as VoiceNote[]) ?? []);
      setReady(true);
    })();
  }, [db]);

  async function ins(table: string, row: Record<string, unknown>): Promise<any> {
    if (!db) return { ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    const { data, error: e } = await db.from(table).insert(row).select().single();
    if (e) { setError(e.message); return null; }
    return data;
  }
  async function upd(table: string, id: string, patch: Record<string, unknown>) {
    if (!db) return;
    const { error: e } = await db.from(table).update(patch).eq("id", id);
    if (e) setError(e.message);
  }
  const log = async (text: string) => { const r = await ins("activities", { text }); if (r) setActivity((a) => [r, ...a].slice(0, 20)); };

  const addContact: S["addContact"] = async (c) => {
    const r = await ins("contacts", { name: c.name, company: c.company || "-", interest: c.interest || "-", stage: "New" });
    if (r) { setContacts((x) => [...x, r]); await log(`Added contact ${c.name}`); }
  };
  const addTask: S["addTask"] = async (title, due) => {
    const r = await ins("tasks", { title, due, done: false });
    if (r) { setTasks((x) => [...x, r]); await log(`Follow-up created: ${title} (${due})`); }
  };
  const setStage: S["setStage"] = async (id, stage) => {
    const c = contacts.find((x) => x.id === id);
    setContacts((x) => x.map((y) => (y.id === id ? { ...y, stage } : y)));
    await upd("contacts", id, { stage });
    if (c) await log(`${c.name} moved to ${stage}`);
  };
  const toggle: S["toggle"] = async (id) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    setTasks((x) => x.map((y) => (y.id === id ? { ...y, done: !y.done } : y)));
    await upd("tasks", id, { done: !t.done });
  };
  const apply: S["apply"] = async (a) => {
    if (a.kind === "contact") return addContact(a);
    if (a.kind === "task") return addTask(a.title, a.due);
    if (a.kind === "move") { const c = contacts.find((x) => x.name === a.name); if (c) return setStage(c.id, a.stage); return; }
    await log(`Note on ${a.name}: ${a.text}`);
  };
  const saveVoice: S["saveVoice"] = async (transcript, actions, status) => {
    const r = await ins("voice_notes", { transcript, actions, status });
    if (r) setNotes((n) => [r, ...n]);
  };

  return <Ctx.Provider value={{ ready, error, demo: !db, contacts, tasks, activity, notes, addContact, addTask, setStage, toggle, apply, saveVoice }}>{children}</Ctx.Provider>;
}
