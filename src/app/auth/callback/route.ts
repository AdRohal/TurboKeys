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
  // someone who has only just confirmed their email is new here: show them the welcome step before the home page
  const confirmedAt = auth.user?.email_confirmed_at ? Date.parse(auth.user.email_confirmed_at) : 0;
  const justConfirmed = confirmedAt > 0 && Date.now() - confirmedAt < 2 * 60 * 1000;
  const destination = profile && profile.profile_completed === false ? "/complete-profile" : justConfirmed ? "/complete-profile?welcome=1" : next;
  return NextResponse.redirect(new URL(destination, url.origin));
}
