import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** One browser client for the whole page. It keeps the session in cookies, so the API routes see the same user. */
export function supabaseBrowser(): SupabaseClient {
  if (!client) {
    // NEXT_PUBLIC_ values must be read as literal property accesses so Next can inline them into the browser bundle
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
    client = createBrowserClient(url, key);
  }
  return client;
}
