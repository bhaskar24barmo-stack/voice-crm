import AssistantView from "@/components/crm/AssistantView";
import { aiConfigured } from "@/lib/config";
import { isUuid } from "@/lib/validate";
export const metadata = { title: "AI assistant — Voice CRM", robots: { index: false } };
export default function Page({ searchParams }: { searchParams: { contact?: string; lead?: string } }) {
  return <AssistantView aiReady={aiConfigured()} contactId={isUuid(searchParams.contact) ? searchParams.contact : ""} leadId={isUuid(searchParams.lead) ? searchParams.lead : ""} />;
}
