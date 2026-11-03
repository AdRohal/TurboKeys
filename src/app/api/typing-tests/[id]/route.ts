import { badRequest, getSession, serverError, unauthorized } from "@/lib/api/session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Deletes one of the signed-in user's own tests. */
export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await getSession();
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  if (!UUID.test(id)) return badRequest("Invalid test id");
  const { data, error } = await supabase.from("typing_tests").delete().eq("id", id).select("id");
  if (error) return serverError("delete typing test", error);
  // row-level security hides other people's tests, so "not found" covers both cases
  if (!data?.length) return Response.json({ error: "Test not found" }, { status: 404 });
  return Response.json({ message: "Test deleted successfully" });
}
