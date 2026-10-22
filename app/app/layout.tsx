import type { Metadata } from "next";
export const metadata: Metadata = { title: "App · Voice CRM", robots: { index: false } };
export default function AppLayout({ children }: { children: React.ReactNode }) { return children; }
