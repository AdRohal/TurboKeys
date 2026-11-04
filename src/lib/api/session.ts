import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";

/** The Supabase client for this request and the verified user (the Auth server checks the token; cookies alone are not trusted). */
export async function getSession(): Promise<{ supabase: SupabaseClient; user: User | null }> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : data.user };
}

export const unauthorized = () => Response.json({ error: "Not authenticated" }, { status: 401 });
export const badRequest = (error: string) => Response.json({ error }, { status: 400 });

/** Logs the real cause on the server and gives the browser a plain message. */
export function serverError(where: string, cause: unknown) {
  // a Supabase error is an Error subclass, which prints as {} unless its fields are read out
  const c = cause as { message?: string; code?: string; details?: string; hint?: string } | null;
  console.error(`[api] ${where}:`, c && typeof c === "object" ? { code: c.code, message: c.message, details: c.details, hint: c.hint } : cause);
  return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

/** A whole number from a query string, kept inside [min, max]; the fallback when absent or not a number. */
export function intParam(value: string | null, fallback: number, min: number, max: number): number {
  if (value === null || value.trim() === "") return fallback;
  const n = Number(value);
  if (!Number.isInteger(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
