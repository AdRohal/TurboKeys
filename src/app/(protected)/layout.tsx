import { redirect } from "next/navigation";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import { supabaseServer } from "@/lib/supabase/server";

// Signed-out visitors are sent to login on the server, before any of the page is sent.
export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  // the client guard also sends a Google/GitHub account with no username yet to finish its profile
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
