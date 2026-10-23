import ActivitiesView from "@/components/crm/ActivitiesView";
export const metadata = { title: "Activities & calls — Voice CRM", robots: { index: false } };
export default function Page({ searchParams }: { searchParams: { tab?: string } }) { return <ActivitiesView initialTab={searchParams.tab === "calls" ? "calls" : "activities"} />; }
