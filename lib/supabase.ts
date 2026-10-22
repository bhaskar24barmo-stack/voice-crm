import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;
/** Returns null when Supabase env vars are missing (the app then runs in demo mode).
 *  If your repo already has a browser client, return that here instead. */
export function supa() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return (client ??= createBrowserClient(url, key));
}
