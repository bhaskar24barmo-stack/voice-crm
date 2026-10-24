import { LayoutDashboard, Users, Kanban, CheckSquare, Settings } from "lucide-react";

// Five simple destinations. Activities, calls and the AI tools are reached from the home screen and from each contact.
export const NAV = [
  { href: "/account", label: "Home", icon: LayoutDashboard },
  { href: "/account/contacts", label: "Contacts", icon: Users },
  { href: "/account/leads", label: "Pipeline", icon: Kanban },
  { href: "/account/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/account/settings", label: "Settings", icon: Settings },
] as const;
