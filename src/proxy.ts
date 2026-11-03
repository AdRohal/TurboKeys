import type { NextRequest } from "next/server";
import { refreshSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return refreshSession(request);
}

export const config = {
  // everything except static files and images
  matcher: ["/((?!_next/static|_next/image|favicon.ico|Logo/|manifest.json|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
