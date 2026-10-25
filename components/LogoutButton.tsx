"use client";
import { secondary } from "./ui";

// A full page load after logout, so nothing from this session (cached lists, state) can reach the next person on this device.
export default function LogoutButton({ className = `${secondary} mt-6` }: { className?: string }) {
  return <button className={className} onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }).catch(() => {}); window.location.assign("/"); }}>Log out</button>;
}
