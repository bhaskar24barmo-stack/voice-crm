import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Voice CRM — Speak it. CRM gets it done.",
  description: "Update your CRM, capture leads, create follow-ups, and manage customer information using your voice. Join the waitlist.",
  openGraph: { title: "Voice CRM — Speak it. CRM gets it done.", description: "A CRM you can simply talk to. Join the waitlist.", type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
