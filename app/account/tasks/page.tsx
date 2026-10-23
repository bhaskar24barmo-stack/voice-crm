import TasksView from "@/components/crm/TasksView";
export const metadata = { title: "Tasks — Voice CRM", robots: { index: false } };
export default function Page({ searchParams }: { searchParams: { new?: string } }) { return <TasksView openNew={searchParams.new === "1"} />; }
