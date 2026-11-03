import { getSession, serverError } from "@/lib/api/session";
import { validateUsername } from "@/lib/profile";

/** Is this username free? Public, because the sign-up form asks before an account exists. */
export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get("username") ?? "";
  const problem = validateUsername(username);
  if (problem) return Response.json({ available: false, reason: problem });

  const { supabase } = await getSession();
  const { data, error } = await supabase.rpc("username_available", { p_username: username.trim() });
  if (error) return serverError("check username", error);
  return Response.json({ available: data === true, ...(data === true ? {} : { reason: "Username is already taken" }) });
}
