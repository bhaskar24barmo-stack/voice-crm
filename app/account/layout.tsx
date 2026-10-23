import { redirect } from "next/navigation";
import Shell from "@/components/crm/Shell";
import { aiConfigured } from "@/lib/config";
import { getAuth } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const metadata = { title: "Voice CRM", robots: { index: false } };
export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" as const };

// One auth check for every /account page. Pages that read data call getAuth() again (cached per request).
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  const m = auth.user.user_metadata;
  return <Shell name={m?.name || m?.full_name || ""} email={auth.user.email || ""} aiReady={aiConfigured()}>{children}</Shell>;
}
