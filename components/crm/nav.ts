import { LayoutDashboard, Users, Kanban, CheckSquare, PhoneCall, Sparkles, AudioLines, Settings } from "lucide-react";

// `ready: true` items are shown as unavailable until their stage ships, so no control is a dead link.
export const NAV = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard, ready: true },
  { href: "/account/contacts", label: "Contacts", icon: Users, ready: true },
  { href: "/account/leads", label: "Leads & pipeline", icon: Kanban, ready: true },
  { href: "/account/tasks", label: "Tasks", icon: CheckSquare, ready: true },
  { href: "/account/activities", label: "Activities & calls", icon: PhoneCall, ready: true },
  { href: "/account/assistant", label: "AI assistant", icon: Sparkles, ready: true },
  { href: "/account/voice", label: "Voice", icon: AudioLines, ready: true },
  { href: "/account/settings", label: "Settings", icon: Settings, ready: true },
] as const;
