import { getSession, serverError, unauthorized } from "@/lib/api/session";
import { toStats } from "@/lib/api/mappers";

/** The numbers on the Profile page. */
export async function GET() {
  const { supabase, user } = await getSession();
  if (!user) return unauthorized();
  const { data, error } = await supabase.rpc("my_typing_stats");
  if (error) return serverError("user stats", error);
  return Response.json(toStats((data as never[])?.[0] ?? null));
}
