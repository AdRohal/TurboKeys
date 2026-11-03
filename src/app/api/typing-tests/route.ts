import { badRequest, getSession, intParam, serverError, unauthorized } from "@/lib/api/session";
import { TEST_COLUMNS, toTest, type TestRow } from "@/lib/api/mappers";
import { parseSubmission } from "@/lib/typing/submission";

/** Saves one finished test for the signed-in user. */
export async function POST(request: Request) {
  const { supabase, user } = await getSession();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("The request body is not valid JSON");
  }
  const parsed = parseSubmission(body);
  if (!parsed.ok) return badRequest(parsed.error);

  // the user id always comes from the session, never from the body
  const { data, error } = await supabase.from("typing_tests").insert({ ...parsed.row, user_id: user.id }).select(TEST_COLUMNS).single();
  if (error?.code === "TK429") return Response.json({ error: "That was too quickly after your last test. Finish a full test, then wait a moment before the next one." }, { status: 429 });
  if (error || !data) return serverError("save typing test", error);

  const test = toTest(data as TestRow);
  return Response.json({ ...test, score: Math.round((test.wpm * test.accuracy) / 100) }, { status: 201 });
}

/** The signed-in user's most recent tests. */
export async function GET(request: Request) {
  const { supabase, user } = await getSession();
  if (!user) return unauthorized();
  const limit = intParam(new URL(request.url).searchParams.get("limit"), 10, 1, 100);
  const { data, error } = await supabase.from("typing_tests").select(TEST_COLUMNS).order("completed_at", { ascending: false }).limit(limit);
  if (error) return serverError("list typing tests", error);
  return Response.json((data as TestRow[]).map(toTest));
}
