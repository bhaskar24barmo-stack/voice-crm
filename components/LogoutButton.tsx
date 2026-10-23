"use client";
import { useRouter } from "next/navigation";
import { secondary } from "./ui";

export default function LogoutButton({ className = `${secondary} mt-6` }: { className?: string }) {
  const router = useRouter();
  return <button className={className} onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); router.refresh(); }}>Log out</button>;
}
