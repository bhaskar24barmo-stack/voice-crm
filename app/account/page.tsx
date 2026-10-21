import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import LogoutButton from "@/components/LogoutButton";
import { SB_URL, SB_ANON } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account — Voice CRM", robots: { index: false } };

export default async function Account() {
  const token = cookies().get("vc_token")?.value;
  let user: any = null;
  if (token && SB_URL) { const r = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` }, cache: "no-store" }); if (r.ok) user = await r.json(); }
  if (!user) redirect("/login");
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-md px-5 py-16">
        <h1 className="font-serif text-4xl font-semibold">Welcome{user.user_metadata?.name ? `, ${user.user_metadata.name}` : ""}</h1>
        <p className="mt-3 text-ink/70">You’re logged in as {user.email}. The Voice CRM app is still in development; you’ll be first to know when early access opens.</p>
        <LogoutButton />
      </main>
    </>
  );
}
