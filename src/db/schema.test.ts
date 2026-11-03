import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as, freshDatabase, signUp } from "./pg.ts";

let db: PGlite;
let ada: string;
let bob: string;

/**
 * Saves a test as the current user. By default the test is then aged by ten minutes, because the database rejects a test that
 * would finish sooner than its own length after the previous one; pass `fresh` to keep it brand new for the pace tests.
 */
const insertTest = async (uid: string, over: Record<string, unknown> = {}, fresh = false) => {
  const t = { wpm: 80, accuracy: 90, duration: 30, mode: "time", language: "english", difficulty: "medium", characters_typed: 200, errors_count: 5, correct_characters: 195, total_characters: 200, test_text: "hello", ...over };
  const result = await db.query(
    `insert into public.typing_tests (user_id, wpm, accuracy, duration, mode, language, difficulty, characters_typed, errors_count, correct_characters, total_characters, test_text)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [uid, t.wpm, t.accuracy, t.duration, t.mode, t.language, t.difficulty, t.characters_typed, t.errors_count, t.correct_characters, t.total_characters, t.test_text],
  );
  if (!fresh) {
    const role = (await db.query<{ r: string }>(`select current_user as r`)).rows[0].r;
    await db.exec(`reset role`);
    await db.query(`update public.typing_tests set completed_at = completed_at - interval '10 minutes' where user_id = $1`, [uid]);
    await db.exec(`set role ${role}`);
  }
  return result;
};

beforeAll(async () => {
  db = await freshDatabase();
  ada = await signUp(db, { username: "ada", first_name: "Ada", last_name: "Lovelace" }, "ada@example.com");
  bob = await signUp(db, { username: "Bob_99" }, "bob@example.com");
});
afterAll(async () => {
  await db.close();
});

describe("a profile is created for every new user", () => {
  it("email sign-up carries the username and counts as a completed profile", async () => {
    const r = await db.query<any>(`select username, first_name, last_name, profile_completed, role, theme from public.profiles where id = $1`, [ada]);
    expect(r.rows[0]).toMatchObject({ username: "ada", first_name: "Ada", last_name: "Lovelace", profile_completed: true, role: "user", theme: "dark" });
  });

  it("an OAuth user starts with no username and an incomplete profile, and the full name is split", async () => {
    const id = await signUp(db, { full_name: "Grace Brewster Hopper", avatar_url: "https://img/x.png" }, "grace@example.com");
    const r = await db.query<any>(`select username, first_name, last_name, avatar_url, profile_completed from public.profiles where id = $1`, [id]);
    expect(r.rows[0]).toEqual({ username: null, first_name: "Grace", last_name: "Brewster Hopper", avatar_url: "https://img/x.png", profile_completed: false });
  });

  it("rejects a username that is too short, has bad characters, or is taken (any letter case)", async () => {
    await expect(signUp(db, { username: "ab" }, "a1@example.com")).rejects.toThrow();
    await expect(signUp(db, { username: "has space" }, "a2@example.com")).rejects.toThrow();
    await expect(signUp(db, { username: "ADA" }, "a3@example.com")).rejects.toThrow();
  });
});

describe("typing tests and row-level security", () => {
  it("a user can save a test for themselves and only for themselves", async () => {
    await as(db, ada, () => insertTest(ada));
    await expect(as(db, ada, () => insertTest(bob))).rejects.toThrow(/row-level security/);
  });

  it("anon cannot read or write tests", async () => {
    await expect(as(db, null, () => db.query(`select * from public.typing_tests`))).rejects.toThrow(/permission denied/);
    await expect(as(db, null, () => insertTest(ada))).rejects.toThrow(/permission denied/);
  });

  it("a user sees only their own tests", async () => {
    await as(db, bob, () => insertTest(bob, { wpm: 50 }));
    const mine = await as(db, ada, () => db.query<any>(`select user_id from public.typing_tests`));
    expect(mine.rows.every((r) => r.user_id === ada)).toBe(true);
    expect(mine.rows.length).toBeGreaterThan(0);
  });

  it("the completion time and id cannot be set by the client", async () => {
    await expect(
      as(db, ada, () => db.query(`insert into public.typing_tests (user_id, wpm, accuracy, duration, characters_typed, correct_characters, total_characters, test_text, completed_at) values ($1, 10, 90, 30, 50, 45, 50, 'x', '2020-01-01')`, [ada])),
    ).rejects.toThrow(/permission denied/);
  });

  it("the database refuses impossible values", async () => {
    await expect(as(db, ada, () => insertTest(ada, { duration: 45 }))).rejects.toThrow(/check constraint/);
    await expect(as(db, ada, () => insertTest(ada, { wpm: 500 }))).rejects.toThrow(/check constraint/);
    await expect(as(db, ada, () => insertTest(ada, { accuracy: 101 }))).rejects.toThrow(/check constraint/);
    await expect(as(db, ada, () => insertTest(ada, { mode: "zen" }))).rejects.toThrow(/check constraint/);
  });

  it("a user can delete their own test but not someone else's", async () => {
    const own = await as(db, bob, () => db.query<any>(`select id from public.typing_tests limit 1`));
    const theirs = await as(db, ada, () => db.query<any>(`delete from public.typing_tests where id = $1 returning id`, [own.rows[0].id]));
    expect(theirs.rows).toHaveLength(0);
    const gone = await as(db, bob, () => db.query<any>(`delete from public.typing_tests where id = $1 returning id`, [own.rows[0].id]));
    expect(gone.rows).toHaveLength(1);
    await as(db, bob, () => insertTest(bob, { wpm: 50 }));
  });
});

describe("profile stats", () => {
  it("are recomputed after every insert and delete", async () => {
    const id = await signUp(db, { username: "stats_user" }, "stats@example.com");
    await as(db, id, () => insertTest(id, { wpm: 80, accuracy: 90 }));
    await as(db, id, () => insertTest(id, { wpm: 60, accuracy: 100 }));
    let p = (await db.query<any>(`select total_tests, best_wpm, average_wpm, best_accuracy, average_accuracy from public.profiles where id = $1`, [id])).rows[0];
    expect(p).toEqual({ total_tests: 2, best_wpm: 80, average_wpm: 70, best_accuracy: 100, average_accuracy: 95 });
    await as(db, id, () => db.query(`delete from public.typing_tests where wpm = 80`));
    p = (await db.query<any>(`select total_tests, best_wpm from public.profiles where id = $1`, [id])).rows[0];
    expect(p).toEqual({ total_tests: 1, best_wpm: 60 });
  });

  it("cannot be edited by the user, and neither can the role", async () => {
    await expect(as(db, ada, () => db.query(`update public.profiles set best_wpm = 999 where id = $1`, [ada]))).rejects.toThrow(/permission denied/);
    await expect(as(db, ada, () => db.query(`update public.profiles set role = 'admin' where id = $1`, [ada]))).rejects.toThrow(/permission denied/);
    await expect(as(db, ada, () => db.query(`update public.profiles set profile_completed = true where id = $1`, [ada]))).rejects.toThrow(/permission denied/);
  });
});

describe("profile editing", () => {
  it("a user edits their own name and username, and picking a username completes the profile", async () => {
    const id = await signUp(db, { full_name: "Linus T" }, "linus@example.com");
    const r = await as(db, id, () => db.query<any>(`update public.profiles set username = 'linus_t', first_name = 'Linus' where id = $1 returning username, profile_completed`, [id]));
    expect(r.rows[0]).toEqual({ username: "linus_t", profile_completed: true });
  });

  it("a user cannot edit or read another user's profile", async () => {
    const upd = await as(db, ada, () => db.query<any>(`update public.profiles set first_name = 'Hacked' where id = $1 returning id`, [bob]));
    expect(upd.rows).toHaveLength(0);
    const sel = await as(db, ada, () => db.query<any>(`select id from public.profiles`));
    expect(sel.rows.map((r) => r.id)).toEqual([ada]);
  });

  it("two users cannot end up with the same username", async () => {
    await expect(as(db, ada, () => db.query(`update public.profiles set username = 'BOB_99' where id = $1`, [ada]))).rejects.toThrow(/unique/);
  });
});

describe("leaderboard", () => {
  it("is readable without signing in and ranks each user's best result in one category", async () => {
    const id = await signUp(db, { username: "board_a" }, "ba@example.com");
    const id2 = await signUp(db, { username: "board_b" }, "bb@example.com");
    await as(db, id, () => insertTest(id, { duration: 60, wpm: 100, accuracy: 95 }));
    await as(db, id, () => insertTest(id, { duration: 60, wpm: 90, accuracy: 100 }));
    await as(db, id2, () => insertTest(id2, { duration: 60, wpm: 120, accuracy: 80 }));
    await as(db, id2, () => insertTest(id2, { duration: 15, wpm: 200, accuracy: 99 }));
    const rows = (await as(db, null, () => db.query<any>(`select * from public.leaderboard(60, 'time', 'english', 50)`))).rows;
    expect(rows.map((r) => [r.username, r.best_wpm, r.best_accuracy, r.best_score, r.test_count])).toEqual([
      ["board_b", 120, 80, 96, 1],
      ["board_a", 100, 100, 95, 2],
    ]);
  });

  it("leaves out users without a username and respects the limit", async () => {
    const id = await signUp(db, { full_name: "No Name" }, "nn@example.com");
    await as(db, id, () => insertTest(id, { duration: 120, wpm: 399, accuracy: 100 }));
    const all = (await as(db, null, () => db.query<any>(`select username from public.leaderboard(120, 'time', 'english', 50)`))).rows;
    expect(all.every((r) => r.username !== null)).toBe(true);
    const one = (await as(db, null, () => db.query<any>(`select username from public.leaderboard(30, 'time', 'english', 1)`))).rows;
    expect(one).toHaveLength(1);
  });

  it("never exposes email or user ids beyond the row's own id", async () => {
    const cols = (await as(db, null, () => db.query<any>(`select * from public.leaderboard(30, 'time', 'english', 1)`))).fields.map((f) => f.name);
    expect(cols).not.toContain("email");
  });
});

describe("own-history functions", () => {
  it("my_best_scores and my_typing_stats only count the signed-in user", async () => {
    const id = await signUp(db, { username: "mine_only" }, "mine@example.com");
    await as(db, id, () => insertTest(id, { duration: 30, wpm: 70, accuracy: 96, characters_typed: 300, errors_count: 4 }));
    await as(db, id, () => insertTest(id, { duration: 60, wpm: 75, accuracy: 94, characters_typed: 600, errors_count: 8 }));
    const best = (await as(db, id, () => db.query<any>(`select * from public.my_best_scores()`))).rows;
    expect(best.map((r) => [r.duration, r.best_wpm, r.test_count])).toEqual([[30, 70, 1], [60, 75, 1]]);
    const st = (await as(db, id, () => db.query<any>(`select * from public.my_typing_stats()`))).rows[0];
    expect(st).toMatchObject({ total_tests: 2, average_wpm: 73, best_wpm: 75, best_accuracy: 96, total_errors: 12, total_characters_typed: 900, total_time_minutes: 2 });
    await expect(as(db, null, () => db.query(`select * from public.my_typing_stats()`))).rejects.toThrow(/permission denied/);
  });
});

describe("username_available", () => {
  it("says no to a taken name in any letter case, yes to a free one, and anyone may ask", async () => {
    expect((await as(db, null, () => db.query<any>(`select public.username_available('ADA') as ok`))).rows[0].ok).toBe(false);
    expect((await as(db, null, () => db.query<any>(`select public.username_available('free_name') as ok`))).rows[0].ok).toBe(true);
  });
  it("counts a user's own current username as free", async () => {
    expect((await as(db, ada, () => db.query<any>(`select public.username_available('ada') as ok`))).rows[0].ok).toBe(true);
  });
});

describe("delete_my_account", () => {
  it("removes the user, the profile and every test, and nothing else", async () => {
    const id = await signUp(db, { username: "leaving" }, "leaving@example.com");
    await as(db, id, () => insertTest(id));
    await as(db, id, () => db.query(`select public.delete_my_account()`));
    expect((await db.query(`select 1 from auth.users where id = $1`, [id])).rows).toHaveLength(0);
    expect((await db.query(`select 1 from public.profiles where id = $1`, [id])).rows).toHaveLength(0);
    expect((await db.query(`select 1 from public.typing_tests where user_id = $1`, [id])).rows).toHaveLength(0);
    expect((await db.query(`select 1 from public.profiles where id = $1`, [ada])).rows).toHaveLength(1);
  });
  it("is closed to anon", async () => {
    await expect(as(db, null, () => db.query(`select public.delete_my_account()`))).rejects.toThrow(/permission denied/);
  });
});

describe("pace limit", () => {
  it("a new test cannot finish sooner than its own duration after the previous one", async () => {
    const id = await signUp(db, { username: "pace_user" }, "pace@example.com");
    await as(db, id, () => insertTest(id, { duration: 60 }, true));
    // a second 60 s test straight away is impossible
    await expect(as(db, id, () => insertTest(id, { duration: 60 }, true))).rejects.toThrow(/tests_too_fast/);
    // ...and so is a 15 s test a few seconds later
    await expect(as(db, id, () => insertTest(id, { duration: 15 }, true))).rejects.toThrow(/tests_too_fast/);
  });

  it("allows the next test once enough time has passed", async () => {
    const id = await signUp(db, { username: "pace_ok" }, "paceok@example.com");
    await as(db, id, () => insertTest(id, { duration: 30 }, true));
    // pretend that test finished 40 seconds ago (the app itself can never set the time)
    await db.query(`update public.typing_tests set completed_at = now() - interval '40 seconds' where user_id = $1`, [id]);
    await as(db, id, () => insertTest(id, { duration: 30 }));
    const n = await db.query<any>(`select count(*)::int as n from public.typing_tests where user_id = $1`, [id]);
    expect(n.rows[0].n).toBe(2);
  });

  it("one user's pace never blocks another user", async () => {
    const a = await signUp(db, { username: "pace_a" }, "pa@example.com");
    const b = await signUp(db, { username: "pace_b" }, "pb@example.com");
    await as(db, a, () => insertTest(a, { duration: 120 }));
    await as(db, b, () => insertTest(b, { duration: 120 }));
  });
});
