import ContactsView from "@/components/crm/ContactsView";
export const metadata = { title: "Contacts — Voice CRM", robots: { index: false } };
export default function Page({ searchParams }: { searchParams: { new?: string } }) { return <ContactsView openNew={searchParams.new === "1"} />; }
