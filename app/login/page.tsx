import AuthShell from "@/components/AuthShell";
import AuthForm from "@/components/AuthForm";
import { SB_URL } from "@/lib/site";

export const metadata = { title: "Log in — Voice CRM", robots: { index: false } };

export default function Page() {
  return (
    <AuthShell title="Welcome back" subtitle="Log in to Voice CRM. Google is the quickest way." footer={<>New here? <a href="/signup" className="font-medium text-accent underline">Create an account</a></>}>
      <AuthForm mode="login" supabaseUrl={SB_URL} />
    </AuthShell>
  );
}
