import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { getAuth } from "@/lib/supabase";
import { aiConfigured, sttConfigured } from "@/lib/config";
import { SB_ANON, SB_URL } from "@/lib/site";
import LogoutButton from "@/components/LogoutButton";
import ProfileForm from "@/components/crm/ProfileForm";
import { Card } from "@/components/crm/kit";
import { Badge, PageHeader } from "@/components/crm/ui";
import { btnS } from "@/components/crm/styles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings — Voice CRM", robots: { index: false } };

export default async function Settings() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  const m = auth.user.user_metadata;
  const rows = [
    { name: "Database and sign-in (Supabase)", on: Boolean(SB_URL && SB_ANON), needs: "SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY" },
    { name: "AI assistant (OpenRouter)", on: aiConfigured(), needs: "OPENROUTER_API_KEY, OPENROUTER_MODEL" },
    { name: "Audio transcription", on: sttConfigured(), needs: "STT_API_URL, STT_API_KEY, STT_MODEL" },
  ];
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="Settings" />
      <Card title="Profile"><ProfileForm name={m?.name || m?.full_name || ""} email={auth.user.email || ""} /></Card>
      <Card title="Integrations">
        <ul className="divide-y divide-line">
          {rows.map((r) => (
            <li key={r.name} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <div><p className="font-medium">{r.name}</p>{!r.on && <p className="text-xs text-ink/55">Needs {r.needs}</p>}</div>
              <Badge tone={r.on ? "green" : "gray"}>{r.on ? "Configured" : "Not configured"}</Badge>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink/55">“Configured” means the settings are present on the server. Secret values are never shown.</p>
      </Card>
      <Card title="Your data">
        <p className="text-sm text-ink/70">Download everything you’ve stored in Voice CRM as a JSON file.</p>
        <a href="/api/crm/export" download className={`${btnS} mt-3`}><Download size={16} aria-hidden />Export my data</a>
      </Card>
      <Card title="Session"><p className="text-sm text-ink/70">Signed in as {auth.user.email}.</p><LogoutButton className={`${btnS} mt-3`} /></Card>
    </div>
  );
}
