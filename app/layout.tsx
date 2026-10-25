import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION } : undefined,
  title: "Voice CRM — Speak it. CRM gets it done.",
  description: "Update your CRM, capture leads, create follow-ups, and manage customer information using your voice.",
  appleWebApp: { capable: true, title: "Voice CRM", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  openGraph: { title: "Voice CRM — Speak it. CRM gets it done.", description: "A CRM you can simply talk to.", type: "website" },
};

export const viewport: Viewport = { themeColor: "#F7F5F0", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
