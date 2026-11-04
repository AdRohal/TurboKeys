import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as, freshDatabase, signUp } from "./pg.ts";

let db: PGlite;
let ada: string;
let bob: string;

/** Saves a round as the current user, then ages it ten minutes so the pace limit does not block the next one (unless `fresh`). */
const insertRound = async (uid: string, over: Record<string, unknown> = {}, fresh = false) => {
  const r = { points: 130, correct: 10, wrong: 2, best_streak: 6, avg_answer_ms: 2500, level: 3, ...over };
  const result = await db.query(
    `insert into public.math_rounds (user_id, points, correct, wrong, best_streak, avg_answer_ms, level) values ($1,$2,$3,$4,$5,$6,$7)`,
    [uid, r.points, r.correct, r.wrong, r.best_streak, r.avg_answer_ms, r.level],
  );
  if (!fresh) {
    const role = (await db.query<{ r: string }>(`select current_user as r`)).rows[0].r;
    await db.exec(`reset role`);
    await db.query(`update public.math_rounds set completed_at = completed_at - interval '10 minutes' where user_id = $1`, [uid]);
    await db.exec(`set role ${role}`);
  }
  return result;
};

beforeAll(async () => {
  db = await freshDatabase();
  ada = await signUp(db, { username: "ada" }, "ada@example.com");
  bob = await signUp(db, { username: "Bob_99" }, "bob@example.com");
});
afterAll(async () => {
  await db.close();
});

describe("math rounds and row-level security", () => {
  it("a user can save a round for themselves and only for themselves", async () => {
    await as(db, ada, () => insertRound(ada));
    await expect(as(db, ada, () => insertRound(bob))).rejects.toThrow(/row-level security/);
  });

  it("anon cannot read or write rounds", async () => {
    await expect(as(db, null, () => db.query(`select * from public.math_rounds`))).rejects.toThrow(/permission denied/);
    await expect(as(db, null, () => insertRound(ada))).rejects.toThrow(/permission denied/);
  });

  it("a user sees only their own rounds", async () => {
    await as(db, bob, () => insertRound(bob, { points: 60, correct: 5, wrong: 1, best_streak: 3 }));
    const mine = await as(db, ada, () => db.query<any>(`select user_id from public.math_rounds`));
    expect(mine.rows.length).toBeGreaterThan(0);
    expect(mine.rows.every((r) => r.user_id === ada)).toBe(true);
  });

  it("the completion time, id and length cannot be set by the client", async () => {
    await expect(
      as(db, ada, () => db.query(`insert into public.math_rounds (user_id, points, correct, wrong, best_streak, avg_answer_ms, level, completed_at) values ($1, 10, 1, 0, 1, 2000, 1, '2020-01-01')`, [ada])),
    ).rejects.toThrow(/permission denied/);
    await expect(
      as(db, ada, () => db.query(`insert into public.math_rounds (user_id, points, correct, wrong, best_streak, avg_answer_ms, level, duration) values ($1, 10, 1, 0, 1, 2000, 1, 5)`, [ada])),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("a round has to add up", () => {
  it("rejects points that do not match the right answers", async () => {
    await expect(as(db, ada, () => insertRound(ada, { points: 99 }))).rejects.toThrow(/math_rounds_points_range/);
    await expect(as(db, ada, () => insertRound(ada, { points: 201 }))).rejects.toThrow(/math_rounds_points_range/);
  });
  it("rejects a streak longer than the right answers", async () => {
    await expect(as(db, ada, () => insertRound(ada, { best_streak: 11 }))).rejects.toThrow(/math_rounds_streak_le_correct/);
  });
  it("rejects answers faster than a person can give them", async () => {
    await expect(as(db, ada, () => insertRound(ada, { avg_answer_ms: 100 }))).rejects.toThrow(/math_rounds_pace/);
  });
});

describe("pace limit", () => {
  it("rejects a second round straight after the first, with the code the API maps to 429", async () => {
    await as(db, bob, () => insertRound(bob, { points: 20, correct: 2, wrong: 0, best_streak: 2 }, true));
    await expect(as(db, bob, () => insertRound(bob, { points: 20, correct: 2, wrong: 0, best_streak: 2 }, true))).rejects.toMatchObject({ code: "TK429" });
  });
});

describe("math_leaderboard", () => {
  it("is public, ranks each player by their best round, and shows only public fields", async () => {
    const carol = await signUp(db, { username: "carol" }, "carol@example.com");
    await as(db, carol, () => insertRound(carol, { points: 400, correct: 25, wrong: 5, best_streak: 12, level: 5 }));
    await as(db, carol, () => insertRound(carol, { points: 50, correct: 4, wrong: 4, best_streak: 2 }));

    const board = await as(db, null, () => db.query<any>(`select * from public.math_leaderboard(50)`));
    expect(Object.keys(board.rows[0]).sort()).toEqual(["avatar", "best_accuracy", "best_correct", "best_points", "best_streak", "latest_round", "round_count", "user_id", "username"]);
    expect(board.rows[0]).toMatchObject({ username: "carol", best_points: 400, best_correct: 25, best_accuracy: 83, best_streak: 12, round_count: 2 });
    // one row per player, best first
    const names = board.rows.map((r) => r.username);
    expect(new Set(names).size).toBe(names.length);
    const points = board.rows.map((r) => r.best_points);
    expect(points).toEqual([...points].sort((a, b) => b - a));
  });

  it("leaves out players who have not picked a username", async () => {
    const ghost = await signUp(db, { full_name: "No Name" }, "ghost@example.com");
    await db.query(`insert into public.math_rounds (user_id, points, correct, wrong, best_streak, avg_answer_ms, level) values ($1, 999, 50, 0, 50, 1200, 6)`, [ghost]);
    const board = await as(db, null, () => db.query<any>(`select username from public.math_leaderboard(50)`));
    expect(board.rows.every((r) => r.username)).toBe(true);
  });

  it("caps the limit", async () => {
    const board = await as(db, null, () => db.query<any>(`select * from public.math_leaderboard(100000)`));
    expect(board.rows.length).toBeLessThanOrEqual(100);
  });
});

describe("deleting an account", () => {
  it("removes the player's rounds too", async () => {
    const dave = await signUp(db, { username: "dave" }, "dave@example.com");
    await as(db, dave, () => insertRound(dave));
    await as(db, dave, () => db.query(`select public.delete_my_account()`));
    const left = await db.query<any>(`select count(*)::int as n from public.math_rounds where user_id = $1`, [dave]);
    expect(left.rows[0].n).toBe(0);
  });
});
