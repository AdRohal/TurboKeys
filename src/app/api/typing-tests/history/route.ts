import { badRequest, getSession, intParam, serverError, unauthorized } from "@/lib/api/session";
import { TEST_COLUMNS, toTest, type TestRow } from "@/lib/api/mappers";
import { DURATIONS, LANGUAGES, MODES } from "@/lib/typing/submission";

/** The signed-in user's tests, newest first, with optional filters and paging. */
export async function GET(request: Request) {
  const { supabase, user } = await getSession();
  if (!user) return unauthorized();

  const q = new URL(request.url).searchParams;
  const page = intParam(q.get("page"), 1, 1, 100_000);
  const limit = intParam(q.get("limit"), 20, 1, 100);
  const duration = q.get("duration");
  const mode = q.get("mode");
  const language = q.get("language");
  if (duration && !(DURATIONS as readonly number[]).includes(Number(duration))) return badRequest("Invalid duration");
  if (mode && !(MODES as readonly string[]).includes(mode)) return badRequest("Invalid mode");
  if (language && !(LANGUAGES as readonly string[]).includes(language)) return badRequest("Invalid language");

  let query = supabase.from("typing_tests").select(TEST_COLUMNS, { count: "exact" });
  if (duration) query = query.eq("duration", Number(duration));
  if (mode) query = query.eq("mode", mode);
  if (language) query = query.eq("language", language);
  const from = (page - 1) * limit;
  const { data, error, count } = await query.order("completed_at", { ascending: false }).range(from, from + limit - 1);
  if (error) return serverError("typing history", error);

  const total = count ?? 0;
  return Response.json({ tests: (data as TestRow[]).map(toTest), totalPages: Math.ceil(total / limit), currentPage: page, total });
}
