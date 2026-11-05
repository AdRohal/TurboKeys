import { PROFILE_COLUMNS, toUser, type ProfileRow } from "@/lib/api/mappers";
import { getSession, serverError, unauthorized } from "@/lib/api/session";

/** The signed-in user with their profile. */
export async function GET() {
  const { supabase, user } = await getSession();
  if (!user) return unauthorized();
  let { data, error } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", user.id).maybeSingle();
  if (error) return serverError("read current user", error);
  if (!data) {
    // an account from before the profile trigger existed: create its profile, then read it again
    await supabase.rpc("ensure_my_profile");
    ({ data, error } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", user.id).maybeSingle());
    if (error) return serverError("read current user", error);
  }
  return Response.json(toUser(user, data as ProfileRow | null));
}

/** Deletes the signed-in user's account, profile and every typing test, then signs them out. */
export async function DELETE() {
  const { supabase, user } = await getSession();
  if (!user) return unauthorized();
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return serverError("delete account", error);
  await supabase.auth.signOut();
  return Response.json({ message: "Account and typing scores deleted successfully" });
}
