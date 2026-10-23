"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { L, btnP, field, useToast } from "./ui";

export default function ProfileForm({ name, email }: { name: string; email: string }) {
  const [v, setV] = useState(name);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const toast = useToast();
  const router = useRouter();
  return (
    <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setErr(""); try { await api("/api/account", { method: "PATCH", body: { name: v } }); toast("Profile updated."); router.refresh(); } catch (x) { setErr(x instanceof Error ? x.message : "Couldn’t save."); } setBusy(false); }}>
      <L label="Name"><input required maxLength={120} value={v} onChange={(e) => setV(e.target.value)} className={field} autoComplete="name" /></L>
      <L label="Email" hint="Your sign-in email can’t be changed here."><input value={email} readOnly disabled className={field} /></L>
      {err && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
      <button className={btnP} disabled={busy || !v.trim() || v.trim() === name}>{busy ? "Saving…" : "Save profile"}</button>
    </form>
  );
}
