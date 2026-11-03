import { PROFILE_COLUMNS, toUser, type ProfileRow } from "@/lib/api/mappers";
import { badRequest, getSession, serverError, unauthorized } from "@/lib/api/session";
import { splitFullName, validateName, validateUsername } from "@/lib/profile";

/** Finishes the profile of someone who signed up with Google or GitHub: full name and a username. */
export async function POST(request: Request) {
  const { supabase, user } = await getSession();
  if (!user) return unauthorized();

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return badRequest("Full name and username are required");
    body = parsed as Record<string, unknown>;
  } catch {
    return badRequest("The request body is not valid JSON");
  }
  if (typeof body.fullName !== "string" || !body.fullName.trim() || typeof body.username !== "string" || !body.username.trim()) {
    return badRequest("Full name and username are required");
  }

  const username = body.username.trim();
  const { firstName, lastName } = splitFullName(body.fullName);
  const problem = validateUsername(username) ?? validateName(firstName) ?? validateName(lastName);
  if (problem) return badRequest(problem);

  const { data: free, error: freeError } = await supabase.rpc("username_available", { p_username: username });
  if (freeError) return serverError("check username", freeError);
  if (free !== true) return badRequest("Username is already taken");

  const { data, error } = await supabase
    .from("profiles")
    .update({ username, first_name: firstName, last_name: lastName })
    .eq("id", user.id)
    .select(PROFILE_COLUMNS)
    .maybeSingle();
  if (error) {
    // someone took the name between the check and the update
    if (error.code === "23505") return badRequest("Username is already taken");
    return serverError("complete profile", error);
  }
  if (!data) return Response.json({ error: "Profile not found" }, { status: 404 });
  return Response.json({ message: "Profile completed successfully", user: toUser(user, data as ProfileRow) });
}
