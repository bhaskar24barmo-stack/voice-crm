import AuthShell from "@/components/AuthShell";
import AuthForm from "@/components/AuthForm";
import { SB_URL } from "@/lib/site";

export const metadata = { title: "Create your account — Voice CRM", robots: { index: false } };

export default function Page() {
  return (
    <AuthShell title="Create your account" subtitle="One click with Google, or use your email." footer={<>Already have an account? <a href="/login" className="font-medium text-accent underline">Log in</a></>}>
      <AuthForm mode="signup" supabaseUrl={SB_URL} />
    </AuthShell>
  );
}
