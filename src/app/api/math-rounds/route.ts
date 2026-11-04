import { badRequest, getSession, serverError, unauthorized } from "@/lib/api/session";
import { parseRound } from "@/lib/thinking/submission";

/** The table or function is not in the database yet: the migration has not been applied. */
const NOT_SET_UP = new Set(["PGRST202", "PGRST205", "42P01", "42883"]);

/** Saves one finished Fast thinking round for the signed-in user. */
export async function POST(request: Request) {
  const { supabase, user } = await getSession();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("The request body is not valid JSON");
  }
  const parsed = parseRound(body);
  if (!parsed.ok) return badRequest(parsed.error);

  // the user id always comes from the session, never from the body
  const { data, error } = await supabase
    .from("math_rounds")
    .insert({ ...parsed.row, user_id: user.id })
    .select("id, points, correct, wrong, best_streak, completed_at")
    .single();
  if (error?.code === "TK429") return Response.json({ error: "That was too quickly after your last round. Play a full round, then wait a moment before the next one." }, { status: 429 });
  if (error && NOT_SET_UP.has(error.code ?? "")) {
    console.error("[api] save math round: the math_rounds migration has not been applied to this database");
    return Response.json({ error: "Rounds cannot be saved yet. The database migration for Fast thinking has not been applied." }, { status: 503 });
  }
  if (error || !data) return serverError("save math round", error);

  return Response.json(
    { id: data.id, points: data.points, correct: data.correct, wrong: data.wrong, bestStreak: data.best_streak, completedAt: data.completed_at },
    { status: 201 },
  );
}
