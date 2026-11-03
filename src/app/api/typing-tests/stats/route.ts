import { getSession, serverError, unauthorized } from "@/lib/api/session";
import { toStats } from "@/lib/api/mappers";

/** Totals for the signed-in user. */
export async function GET() {
  const { supabase, user } = await getSession();
  if (!user) return unauthorized();
  const { data, error } = await supabase.rpc("my_typing_stats");
  if (error) return serverError("typing stats", error);
  return Response.json(toStats((data as never[])?.[0] ?? null));
}
