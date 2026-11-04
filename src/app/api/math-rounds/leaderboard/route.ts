import { getSession, intParam, serverError } from "@/lib/api/session";

/** The table or function is not in the database yet: the migration has not been applied. */
const NOT_SET_UP = new Set(["PGRST202", "PGRST205", "42P01", "42883"]);

type Row = {
  user_id: string;
  username: string;
  avatar: string | null;
  best_points: number;
  best_correct: number;
  best_accuracy: number;
  best_streak: number;
  round_count: number;
  latest_round: string;
};

/** Public: each player's best Fast thinking round. */
export async function GET(request: Request) {
  const limit = intParam(new URL(request.url).searchParams.get("limit"), 50, 1, 100);
  const { supabase } = await getSession();
  const { data, error } = await supabase.rpc("math_leaderboard", { p_limit: limit });
  if (error && NOT_SET_UP.has(error.code ?? "")) {
    console.error("[api] math leaderboard: the math_rounds migration has not been applied to this database");
    return Response.json({ error: "The Fast thinking leaderboard is not set up yet. The database migration for it has not been applied." }, { status: 503 });
  }
  if (error) return serverError("math leaderboard", error);
  return Response.json(
    ((data ?? []) as Row[]).map((r) => ({
      id: r.user_id,
      username: r.username,
      avatar: r.avatar,
      bestPoints: r.best_points,
      bestCorrect: r.best_correct,
      bestAccuracy: r.best_accuracy,
      bestStreak: r.best_streak,
      roundCount: r.round_count,
      latestRound: r.latest_round,
    })),
  );
}
