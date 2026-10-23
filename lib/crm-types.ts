// Shared constants and row types. No server-only imports, so client components can use this file.
export const STAGES = ["new", "contacted", "qualified", "proposal", "won", "lost"] as const;
export type Stage = (typeof STAGES)[number];
export const STAGE_LABEL: Record<Stage, string> = { new: "New", contacted: "Contacted", qualified: "Qualified", proposal: "Proposal", won: "Won", lost: "Lost" };
export const CONTACT_STATUS = ["lead", "customer", "inactive"] as const;
export const PRIORITIES = ["low", "medium", "high"] as const;
export const ACTIVITY_TYPES = ["call", "email", "meeting", "note", "other"] as const;
export const CALL_SOURCES = ["manual", "recorded", "uploaded"] as const;

export type Contact = { id: string; name: string; email: string | null; phone: string | null; company: string | null; notes: string | null; tags: string[]; status: string; created_at: string; updated_at: string };
export type Lead = { id: string; title: string; contact_id: string | null; status: Stage; value: number | null; expected_close: string | null; notes: string | null; created_at: string; updated_at: string; contact?: { id: string; name: string; company: string | null } | null };
export type Task = { id: string; title: string; description: string | null; due_date: string | null; priority: string; done: boolean; completed_at: string | null; contact_id: string | null; lead_id: string | null; created_at: string; contact?: { id: string; name: string } | null; lead?: { id: string; title: string } | null };
export type Activity = { id: string; type: string; summary: string; details: string | null; occurred_at: string; contact_id: string | null; lead_id: string | null; contact?: { id: string; name: string } | null };
export type Call = { id: string; contact_id: string | null; summary: string | null; notes: string | null; transcript: string | null; duration_seconds: number | null; source: string; occurred_at: string; contact?: { id: string; name: string } | null };
