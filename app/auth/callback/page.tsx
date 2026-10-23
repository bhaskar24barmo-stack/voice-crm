"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Callback() {
  const router = useRouter();
  const [err, setErr] = useState("");
  useEffect(() => {
    const q = new URLSearchParams(window.location.hash.slice(1));
    const token = q.get("access_token");
    if (!token) { setErr(q.get("error_description")?.replace(/\+/g, " ") || "Sign-in didn’t complete."); return; }
    history.replaceState(null, "", window.location.pathname); // keep the token out of the address bar
    fetch("/api/auth/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ access_token: token, refresh_token: q.get("refresh_token") }) })
      .then(async (r) => { if (r.ok) router.replace("/account"); else setErr((await r.json().catch(() => ({}))).error || "Sign-in failed."); })
      .catch(() => setErr("Network error. Please try again."));
  }, [router]);
  return (
    <main className="grid min-h-screen place-items-center px-5 text-center">
      {err ? <div><p role="alert" className="text-red-700">{err}</p><a href="/login" className="mt-4 inline-block text-accent underline">Back to log in</a></div>
        : <p role="status" className="text-ink/70">Signing you in…</p>}
    </main>
  );
}
