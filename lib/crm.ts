export type Stage = "New" | "Contacted" | "Proposal" | "Won";
export const STAGES: Stage[] = ["New", "Contacted", "Proposal", "Won"];
export type Contact = { id: string; name: string; company: string; stage: Stage; interest: string };
export type Task = { id: string; title: string; due: string; done: boolean };
export type Action =
  | { kind: "contact"; name: string; company: string; interest: string }
  | { kind: "task"; title: string; due: string }
  | { kind: "move"; name: string; stage: Stage }
  | { kind: "note"; name: string; text: string };

export const describe = (a: Action) =>
  a.kind === "contact" ? `Add contact ${a.name}${a.company ? `, ${a.company}` : ""}`
  : a.kind === "task" ? `Follow-up: ${a.title} (${a.due})`
  : a.kind === "move" ? `Move ${a.name} to ${a.stage}`
  : `Note on ${a.name}: ${a.text}`;

// Demo data, used only when Supabase env vars are not set.
export const seedContacts: Contact[] = [
  { id: "1", name: "Priya Nair", company: "Northwind Traders", stage: "Proposal", interest: "Business" },
  { id: "2", name: "Sam Fernandes", company: "Lumen Co.", stage: "Contacted", interest: "Pro" },
  { id: "3", name: "Meera Joshi", company: "Brightwave Studio", stage: "New", interest: "Starter" },
];
export const seedTasks: Task[] = [
  { id: "1", title: "Send proposal to Priya", due: "Today", done: false },
  { id: "2", title: "Call Sam about the Pro plan", due: "Today", done: false },
  { id: "3", title: "Intro email to Meera", due: "Tomorrow", done: false },
];
