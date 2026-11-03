import { PROFILE_COLUMNS, toUser, type ProfileRow } from "@/lib/api/mappers";
import { badRequest, getSession, serverError, unauthorized } from "@/lib/api/session";
import { validateName, validateUsername } from "@/lib/profile";

export async function GET() {
  const { supabase, user } = await getSession();
  if (!user) return unauthorized();
  const { data, error } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", user.id).maybeSingle();
  if (error) return serverError("read profile", error);
  return Response.json({ user: toUser(user, data as ProfileRow | null) });
}

/** Updates the signed-in user's own name, username and preferences. Only these fields can change. */
export async function PUT(request: Request) {
  const { supabase, user } = await getSession();
  if (!user) return unauthorized();

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return badRequest("Send the changes as a JSON object");
    body = parsed as Record<string, unknown>;
  } catch {
    return badRequest("The request body is not valid JSON");
  }

  const update: Record<string, string> = {};
  for (const [field, column] of [["firstName", "first_name"], ["lastName", "last_name"]] as const) {
    const v = body[field];
    if (v === undefined) continue;
    if (typeof v !== "string") return badRequest(`${field} must be text`);
    const problem = validateName(v);
    if (problem) return badRequest(problem);
    update[column] = v.trim();
  }
  if (body.username !== undefined) {
    if (typeof body.username !== "string") return badRequest("username must be text");
    const problem = validateUsername(body.username);
    if (problem) return badRequest(problem);
    update.username = body.username.trim();
  }
  if (body.theme !== undefined) {
    if (body.theme !== "light" && body.theme !== "dark") return badRequest("theme must be light or dark");
    update.theme = body.theme;
  }
  if (body.language !== undefined) {
    if (body.language !== "english" && body.language !== "french") return badRequest("language must be english or french");
    update.language = body.language;
  }
  if (Object.keys(update).length === 0) return badRequest("Nothing to update");

  const { data, error } = await supabase.from("profiles").update(update).eq("id", user.id).select(PROFILE_COLUMNS).maybeSingle();
  if (error) {
    if (error.code === "23505") return Response.json({ error: "Username is already taken" }, { status: 409 });
    return serverError("update profile", error);
  }
  if (!data) return Response.json({ error: "Profile not found" }, { status: 404 });
  return Response.json({ message: "Profile updated successfully", user: toUser(user, data as ProfileRow) });
}
