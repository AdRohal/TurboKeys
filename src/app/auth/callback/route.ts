import { NextResponse } from "next/server";
import { safeNext } from "@/lib/profile";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Google and GitHub send people back here with a one-time code. It becomes a session (stored in cookies), then the person goes to
 * finish their profile if they have no username yet, or to where they were headed.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  if (!code) return NextResponse.redirect(new URL("/login?error=oauth", url.origin));

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?error=oauth", url.origin));

  const { data: auth } = await supabase.auth.getUser();
  const { data: profile } = auth.user ? await supabase.from("profiles").select("profile_completed").eq("id", auth.user.id).maybeSingle() : { data: null };
  const destination = profile && profile.profile_completed === false ? "/complete-profile" : next;
  return NextResponse.redirect(new URL(destination, url.origin));
}
