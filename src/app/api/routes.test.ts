import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/session", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/api/session")>()), getSession: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ supabaseServer: vi.fn() }));

import { getSession } from "@/lib/api/session";
import { supabaseServer } from "@/lib/supabase/server";
import { DELETE as deleteAccount } from "./auth/me/route";
import { GET as checkUsername } from "./auth/check-username/route";
import { POST as completeProfile } from "./auth/complete-profile/route";
import { GET as callback } from "../auth/callback/route";
import { GET as history } from "./typing-tests/history/route";
import { GET as leaderboard } from "./typing-tests/leaderboard/route";
import { POST as submit } from "./typing-tests/route";
import { DELETE as deleteTest } from "./typing-tests/[id]/route";
import { PUT as updateProfile } from "./users/profile/route";

type Result = { data?: unknown; error?: { code?: string; message: string } | null; count?: number | null };

/** A stand-in for the Supabase client: every call is recorded, and awaiting any chain gives the next queued result. */
function fakeSupabase(results: Result[] = []) {
  const calls: [string, unknown[]][] = [];
  const queue = [...results];
  const next = (): Result => ({ data: null, error: null, count: null, ...(queue.shift() ?? {}) });
  const chain: unknown = new Proxy(() => undefined, {
    get(_t, prop) {
      if (prop === "then") return (resolve: (v: Result) => void) => resolve(next());
      return (...args: unknown[]) => {
        calls.push([String(prop), args]);
        return chain;
      };
    },
  });
  const client = {
    from: (t: string) => {
      calls.push(["from", [t]]);
      return chain;
    },
    rpc: (name: string, args?: unknown) => {
      calls.push(["rpc", [name, args]]);
      return chain;
    },
    auth: { signOut: vi.fn(async () => ({ error: null })), exchangeCodeForSession: vi.fn(async () => ({ error: null })), getUser: vi.fn(async () => ({ data: { user: { id: "u1" } } })) },
  };
  return { client, calls, called: (name: string) => calls.filter(([n]) => n === name) };
}

const USER = { id: "u1", email: "ada@example.com", created_at: "2026-01-01T00:00:00Z" };
const signedIn = (f: ReturnType<typeof fakeSupabase>) => vi.mocked(getSession).mockResolvedValue({ supabase: f.client as never, user: USER as never });
const signedOut = (f: ReturnType<typeof fakeSupabase>) => vi.mocked(getSession).mockResolvedValue({ supabase: f.client as never, user: null });
const req = (url: string, init?: RequestInit) => new Request(`http://localhost${url}`, init);
const json = (body: unknown) => ({ method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

const goodTest = { wpm: 60, accuracy: 96, duration: 30, charactersTyped: 160, correctCharacters: 154, errorsCount: 6, totalCharacters: 300, testText: "the quick brown fox" };
const savedRow = { id: "t1", wpm: 60, accuracy: 96, duration: 30, mode: "time", language: "english", difficulty: "medium", characters_typed: 160, errors_count: 6, correct_characters: 154, total_characters: 300, completed_at: "2026-11-04T10:00:00Z" };

beforeEach(() => vi.clearAllMocks());

describe("POST /api/typing-tests", () => {
  it("401 when nobody is signed in, and nothing is written", async () => {
    const f = fakeSupabase();
    signedOut(f);
    const res = await submit(req("/api/typing-tests", json(goodTest)));
    expect(res.status).toBe(401);
    expect(f.calls).toHaveLength(0);
  });

  it("400 for a body that is not JSON or not a valid result", async () => {
    const f = fakeSupabase();
    signedIn(f);
    expect((await submit(req("/api/typing-tests", { method: "POST", body: "nope" }))).status).toBe(400);
    const bad = await submit(req("/api/typing-tests", json({ ...goodTest, wpm: 999 })));
    expect(bad.status).toBe(400);
    expect((await bad.json()).error).toMatch(/wpm/i);
    expect(f.called("insert")).toHaveLength(0);
  });

  it("saves under the session user, ignoring a user id or time in the body, and answers 201 with the score", async () => {
    const f = fakeSupabase([{ data: savedRow }]);
    signedIn(f);
    const res = await submit(req("/api/typing-tests", json({ ...goodTest, user_id: "someone-else", userId: "someone-else", completed_at: "2020-01-01" })));
    expect(res.status).toBe(201);
    const inserted = f.called("insert")[0][1][0] as Record<string, unknown>;
    expect(inserted.user_id).toBe("u1");
    expect(inserted).not.toHaveProperty("completed_at");
    expect(inserted).not.toHaveProperty("userId");
    const body = await res.json();
    expect(body).toMatchObject({ id: "t1", wpm: 60, accuracy: 96, score: 58, charactersTyped: 160 });
    expect(body).not.toHaveProperty("test_text");
  });

  it("429 with a clear message when the database says tests are coming in faster than they can be typed", async () => {
    const f = fakeSupabase([{ error: { code: "TK429", message: "tests_too_fast" } }]);
    signedIn(f);
    const res = await submit(req("/api/typing-tests", json(goodTest)));
    expect(res.status).toBe(429);
    expect((await res.json()).error).toMatch(/too quickly|wait/i);
  });

  it("500 with a plain message, not the database error, when saving fails", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const f = fakeSupabase([{ error: { message: 'relation "secret_table" does not exist' } }]);
    signedIn(f);
    const res = await submit(req("/api/typing-tests", json(goodTest)));
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toMatch(/secret_table/);
    spy.mockRestore();
  });
});

describe("GET /api/typing-tests/history", () => {
  it("401 when signed out", async () => {
    signedOut(fakeSupabase());
    expect((await history(req("/api/typing-tests/history"))).status).toBe(401);
  });

  it("pages and filters, and reports the page count", async () => {
    const f = fakeSupabase([{ data: [savedRow], count: 45 }]);
    signedIn(f);
    const res = await history(req("/api/typing-tests/history?page=2&limit=20&duration=30&mode=time&language=english"));
    const body = await res.json();
    expect(body).toMatchObject({ totalPages: 3, currentPage: 2, total: 45 });
    expect(body.tests[0]).toMatchObject({ id: "t1", charactersTyped: 160 });
    expect(f.called("range")[0][1]).toEqual([20, 39]);
    expect(f.called("eq").map(([, a]) => a)).toEqual([["duration", 30], ["mode", "time"], ["language", "english"]]);
  });

  it("400 for a filter that is not one of the real values, so nothing odd reaches the query", async () => {
    signedIn(fakeSupabase());
    expect((await history(req("/api/typing-tests/history?duration=45"))).status).toBe(400);
    expect((await history(req("/api/typing-tests/history?mode=%27%3B--"))).status).toBe(400);
  });

  it("caps the page size at 100", async () => {
    const f = fakeSupabase([{ data: [], count: 0 }]);
    signedIn(f);
    await history(req("/api/typing-tests/history?limit=5000"));
    expect(f.called("range")[0][1]).toEqual([0, 99]);
  });
});

describe("GET /api/typing-tests/leaderboard", () => {
  it("is public: works without a session and maps the rows", async () => {
    const f = fakeSupabase([{ data: [{ user_id: "u9", username: "grace", avatar: null, best_wpm: 99, best_accuracy: 98, best_score: 97, test_count: 7, latest_test: "x" }] }]);
    signedOut(f);
    const res = await leaderboard(req("/api/typing-tests/leaderboard?duration=60&limit=10"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: "u9", username: "grace", avatar: null, bestWpm: 99, bestAccuracy: 98, bestScore: 97, testCount: 7, latestTest: "x" }]);
    expect(f.called("rpc")[0][1]).toEqual(["leaderboard", { p_duration: 60, p_mode: "time", p_language: "english", p_limit: 10 }]);
  });

  it("400 for an unknown category", async () => {
    signedOut(fakeSupabase());
    expect((await leaderboard(req("/api/typing-tests/leaderboard?duration=7"))).status).toBe(400);
    expect((await leaderboard(req("/api/typing-tests/leaderboard?language=klingon"))).status).toBe(400);
  });
});

describe("DELETE /api/typing-tests/[id]", () => {
  const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
  it("400 for an id that is not a uuid, 404 when nothing was deleted, 200 when it was", async () => {
    signedIn(fakeSupabase());
    expect((await deleteTest(req("/x", { method: "DELETE" }), ctx("1; drop table"))).status).toBe(400);
    signedIn(fakeSupabase([{ data: [] }]));
    expect((await deleteTest(req("/x", { method: "DELETE" }), ctx("11111111-1111-1111-1111-111111111111"))).status).toBe(404);
    signedIn(fakeSupabase([{ data: [{ id: "11111111-1111-1111-1111-111111111111" }] }]));
    expect((await deleteTest(req("/x", { method: "DELETE" }), ctx("11111111-1111-1111-1111-111111111111"))).status).toBe(200);
  });
});

describe("PUT /api/users/profile", () => {
  const put = (body: unknown) => updateProfile(req("/api/users/profile", { ...json(body), method: "PUT" }));
  const profile = { id: "u1", username: "ada", first_name: "Ada", last_name: "L", avatar_url: null, profile_completed: true, theme: "dark", language: "english", total_tests: 0, best_wpm: 0, average_wpm: 0, best_accuracy: 0, average_accuracy: 0, created_at: "x", updated_at: "y" };

  it("changes only the allowed fields, whatever else the client sends", async () => {
    const f = fakeSupabase([{ data: profile }]);
    signedIn(f);
    const res = await put({ firstName: " Ada ", lastName: "Lovelace", role: "admin", best_wpm: 999, total_tests: 5, profile_completed: false, id: "other" });
    expect(res.status).toBe(200);
    expect(f.called("update")[0][1][0]).toEqual({ first_name: "Ada", last_name: "Lovelace" });
  });

  it("400 for an invalid username or theme, and when there is nothing to change", async () => {
    signedIn(fakeSupabase());
    expect((await put({ username: "a b" })).status).toBe(400);
    expect((await put({ theme: "neon" })).status).toBe(400);
    expect((await put({ firstName: "x".repeat(51) })).status).toBe(400);
    expect((await put({ unknown: 1 })).status).toBe(400);
  });

  it("409 when the username is taken", async () => {
    signedIn(fakeSupabase([{ error: { code: "23505", message: "duplicate key" } }]));
    const res = await put({ username: "taken_name" });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/already taken/i);
  });

  it("401 when signed out", async () => {
    signedOut(fakeSupabase());
    expect((await put({ firstName: "A" })).status).toBe(401);
  });
});

describe("POST /api/auth/complete-profile", () => {
  const post = (body: unknown) => completeProfile(req("/api/auth/complete-profile", json(body)));
  const profile = { id: "u1", username: "grace_h", first_name: "Grace", last_name: "Brewster Hopper", avatar_url: null, profile_completed: true, theme: "dark", language: "english", total_tests: 0, best_wpm: 0, average_wpm: 0, best_accuracy: 0, average_accuracy: 0, created_at: "x", updated_at: "y" };

  it("splits the full name, checks the username is free, and saves", async () => {
    const f = fakeSupabase([{ data: true }, { data: profile }]);
    signedIn(f);
    const res = await post({ fullName: "Grace Brewster Hopper", username: "grace_h" });
    expect(res.status).toBe(200);
    expect(f.called("update")[0][1][0]).toEqual({ username: "grace_h", first_name: "Grace", last_name: "Brewster Hopper" });
    expect((await res.json()).user).toMatchObject({ username: "grace_h", profileCompleted: true });
  });

  it("400 when the username is taken, short, or a field is missing; nothing is saved", async () => {
    const f = fakeSupabase([{ data: false }]);
    signedIn(f);
    expect((await post({ fullName: "A B", username: "taken" })).status).toBe(400);
    expect(f.called("update")).toHaveLength(0);
    expect((await post({ fullName: "A B", username: "ab" })).status).toBe(400);
    expect((await post({ username: "fine_name" })).status).toBe(400);
  });
});

describe("GET /api/auth/check-username", () => {
  it("answers without a session and explains a bad name without asking the database", async () => {
    const f = fakeSupabase([{ data: true }]);
    signedOut(f);
    expect(await (await checkUsername(req("/api/auth/check-username?username=free_one"))).json()).toEqual({ available: true });
    const short = await (await checkUsername(req("/api/auth/check-username?username=ab"))).json();
    expect(short.available).toBe(false);
    expect(short.reason).toMatch(/at least 3/);
    expect(f.called("rpc")).toHaveLength(1);
  });
});

describe("DELETE /api/auth/me", () => {
  it("deletes through the database function, then signs the browser out", async () => {
    const f = fakeSupabase([{ data: null }]);
    signedIn(f);
    const res = await deleteAccount();
    expect(res.status).toBe(200);
    expect(f.called("rpc")[0][1][0]).toBe("delete_my_account");
    expect(f.client.auth.signOut).toHaveBeenCalled();
  });
  it("401 when signed out, and nothing is deleted", async () => {
    const f = fakeSupabase();
    signedOut(f);
    expect((await deleteAccount()).status).toBe(401);
    expect(f.calls).toHaveLength(0);
  });
});

describe("GET /auth/callback", () => {
  it("sends a new OAuth user to finish their profile, and a finished one where they were going", async () => {
    let f = fakeSupabase([{ data: { profile_completed: false } }]);
    vi.mocked(supabaseServer).mockResolvedValue(f.client as never);
    let res = await callback(req("/auth/callback?code=abc&next=/history"));
    expect(res.headers.get("location")).toBe("http://localhost/complete-profile");
    expect(f.client.auth.exchangeCodeForSession).toHaveBeenCalledWith("abc");

    f = fakeSupabase([{ data: { profile_completed: true } }]);
    vi.mocked(supabaseServer).mockResolvedValue(f.client as never);
    res = await callback(req("/auth/callback?code=abc&next=/history"));
    expect(res.headers.get("location")).toBe("http://localhost/history");
  });

  it("never redirects off the site, even if next says so", async () => {
    const f = fakeSupabase([{ data: { profile_completed: true } }]);
    vi.mocked(supabaseServer).mockResolvedValue(f.client as never);
    const res = await callback(req("/auth/callback?code=abc&next=//evil.com"));
    expect(res.headers.get("location")).toBe("http://localhost/");
  });

  it("goes back to login with an error when there is no code or the exchange fails", async () => {
    const f = fakeSupabase();
    vi.mocked(supabaseServer).mockResolvedValue(f.client as never);
    expect((await callback(req("/auth/callback"))).headers.get("location")).toBe("http://localhost/login?error=oauth");
    f.client.auth.exchangeCodeForSession.mockResolvedValueOnce({ error: { message: "bad" } } as never);
    expect((await callback(req("/auth/callback?code=bad"))).headers.get("location")).toBe("http://localhost/login?error=oauth");
  });
});
