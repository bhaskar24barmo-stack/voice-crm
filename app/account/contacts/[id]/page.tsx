import { notFound } from "next/navigation";
import ContactDetail from "@/components/crm/ContactDetail";
import { isUuid } from "@/lib/validate";
export const metadata = { title: "Contact — Voice CRM", robots: { index: false } };
export default function Page({ params }: { params: { id: string } }) { if (!isUuid(params.id)) notFound(); return <ContactDetail id={params.id} />; }
