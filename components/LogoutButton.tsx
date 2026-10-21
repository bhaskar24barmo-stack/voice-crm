"use client";
import { useRouter } from "next/navigation";
import { secondary } from "./ui";

export default function LogoutButton() {
  const router = useRouter();
  return <button className={`${secondary} mt-6`} onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); router.refresh(); }}>Log out</button>;
}
