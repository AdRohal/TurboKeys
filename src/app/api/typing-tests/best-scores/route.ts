import { getSession, serverError, unauthorized } from "@/lib/api/session";
import { toBestScore } from "@/lib/api/mappers";

/** The signed-in user's best result in every category they have played. */
export async function GET() {
  const { supabase, user } = await getSession();
  if (!user) return unauthorized();
  const { data, error } = await supabase.rpc("my_best_scores");
  if (error) return serverError("best scores", error);
  return Response.json((data ?? []).map(toBestScore));
}
