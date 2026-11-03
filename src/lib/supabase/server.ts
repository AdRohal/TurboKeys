import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env.ts";

/** A Supabase client acting as the signed-in user of this request (row-level security applies). */
export async function supabaseServer(): Promise<SupabaseClient> {
  const { url, key } = supabaseEnv();
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // called from a Server Component, where cookies are read-only: the proxy refreshes the session instead
        }
      },
    },
  });
}
