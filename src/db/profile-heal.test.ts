import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as, freshDatabase, signUp } from "./pg.ts";

let db: PGlite;
let orphan: string;
let other: string;

beforeAll(async () => {
  db = await freshDatabase();
  orphan = await signUp(db, {}, "old@example.com");
  other = await signUp(db, { username: "other" }, "other@example.com");
  // an account from before the profile trigger existed: auth user, no profile
  await db.query(`delete from public.profiles where id = $1`, [orphan]);
});
afterAll(async () => {
  await db.close();
});

describe("ensure_my_profile", () => {
  it("a missing profile cannot be updated until it exists", async () => {
    const r = await as(db, orphan, () => db.query(`update public.profiles set username = 'nems' where id = $1 returning id`, [orphan]));
    expect(r.rows).toHaveLength(0);
  });

  it("creates the missing profile with no username, then the update works", async () => {
    await as(db, orphan, () => db.query(`select public.ensure_my_profile()`));
    const made = await as(db, orphan, () => db.query<any>(`select username, profile_completed from public.profiles where id = $1`, [orphan]));
    expect(made.rows[0]).toMatchObject({ username: null, profile_completed: false });
    const r = await as(db, orphan, () => db.query<any>(`update public.profiles set username = 'nems', first_name = 'Adam' where id = $1 returning profile_completed`, [orphan]));
    expect(r.rows[0].profile_completed).toBe(true);
  });

  it("does nothing when the profile exists, and never touches someone else's", async () => {
    await as(db, other, () => db.query(`select public.ensure_my_profile()`));
    const r = await as(db, other, () => db.query<any>(`select username from public.profiles where id = $1`, [other]));
    expect(r.rows[0].username).toBe("other");
  });

  it("anon cannot call it", async () => {
    await expect(as(db, null, () => db.query(`select public.ensure_my_profile()`))).rejects.toThrow(/permission denied/);
  });
});
