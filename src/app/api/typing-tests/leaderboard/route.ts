import { badRequest, getSession, intParam, serverError } from "@/lib/api/session";
import { toBoardEntry } from "@/lib/api/mappers";
import { DURATIONS, LANGUAGES, MODES } from "@/lib/typing/submission";

/** Public: each player's best result in one category. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const duration = intParam(q.get("duration"), 30, 1, 100_000);
  const mode = q.get("mode") ?? "time";
  const language = q.get("language") ?? "english";
  const limit = intParam(q.get("limit"), 50, 1, 100);
  if (!(DURATIONS as readonly number[]).includes(duration)) return badRequest("Invalid duration");
  if (!(MODES as readonly string[]).includes(mode)) return badRequest("Invalid mode");
  if (!(LANGUAGES as readonly string[]).includes(language)) return badRequest("Invalid language");

  const { supabase } = await getSession();
  const { data, error } = await supabase.rpc("leaderboard", { p_duration: duration, p_mode: mode, p_language: language, p_limit: limit });
  if (error) return serverError("leaderboard", error);
  return Response.json((data ?? []).map(toBoardEntry));
}
