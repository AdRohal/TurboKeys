import { describe, expect, it } from "vitest";
import { toBestScore, toBoardEntry, toStats, toTest, toUser } from "./mappers.ts";

describe("mappers: database rows to the shapes the pages read", () => {
  it("toTest renames columns to camelCase and leaves out the stored text", () => {
    const t = toTest({ id: "t1", wpm: 70, accuracy: 95, duration: 30, mode: "time", language: "english", difficulty: "medium", characters_typed: 180, errors_count: 4, correct_characters: 176, total_characters: 300, completed_at: "2026-11-04T10:00:00Z", test_text: "secret" } as never);
    expect(t).toEqual({ id: "t1", wpm: 70, accuracy: 95, duration: 30, mode: "time", language: "english", difficulty: "medium", charactersTyped: 180, errorsCount: 4, correctCharacters: 176, totalCharacters: 300, completedAt: "2026-11-04T10:00:00Z" });
  });

  it("toBoardEntry gives the leaderboard row an id and the camelCase score fields", () => {
    expect(toBoardEntry({ user_id: "u1", username: "ada", avatar: null, best_wpm: 90, best_accuracy: 97, best_score: 87, test_count: 5, latest_test: "2026-11-04T10:00:00Z" })).toEqual({
      id: "u1", username: "ada", avatar: null, bestWpm: 90, bestAccuracy: 97, bestScore: 87, testCount: 5, latestTest: "2026-11-04T10:00:00Z",
    });
  });

  it("toBestScore", () => {
    expect(toBestScore({ duration: 30, mode: "time", language: "english", best_wpm: 80, best_accuracy: 99, best_score: 79, test_count: 3, latest_test: "x" })).toEqual({
      duration: 30, mode: "time", language: "english", bestWpm: 80, bestAccuracy: 99, bestScore: 79, testCount: 3, latestTest: "x",
    });
  });

  it("toStats serves both the profile cards and the older stats names", () => {
    expect(toStats({ total_tests: 4, average_wpm: 60, average_accuracy: 93, best_wpm: 75, best_accuracy: 99, total_characters_typed: 900, total_errors: 12, total_time_minutes: 2 })).toEqual({
      totalTests: 4, testsCompleted: 4, averageWpm: 60, averageAccuracy: 93, bestWpm: 75, bestAccuracy: 99, totalCharactersTyped: 900, totalErrors: 12, totalTimeSpent: 2,
    });
  });

  it("toStats is all zeros when there is no row", () => {
    expect(toStats(null)).toMatchObject({ totalTests: 0, testsCompleted: 0, averageWpm: 0, bestWpm: 0 });
  });

  it("toUser combines the auth user and the profile, never leaking anything private", () => {
    const u = toUser(
      { id: "u1", email: "ada@example.com", created_at: "2026-01-01T00:00:00Z" },
      { role: "user", id: "u1", username: "ada", first_name: "Ada", last_name: "Lovelace", avatar_url: "https://a/b.png", profile_completed: true, theme: "dark", language: "english", total_tests: 3, best_wpm: 80, average_wpm: 70, best_accuracy: 99, average_accuracy: 95, created_at: "2026-01-02T00:00:00Z", updated_at: "2026-01-03T00:00:00Z" } as never,
    );
    expect(u).toMatchObject({ id: "u1", email: "ada@example.com", username: "ada", firstName: "Ada", lastName: "Lovelace", profilePicture: "https://a/b.png", profileCompleted: true, totalTests: 3, bestWPM: 80, averageWPM: 70, bestAccuracy: 99, averageAccuracy: 95, createdAt: "2026-01-02T00:00:00Z" });
    expect(Object.keys(u)).not.toContain("role");
  });

  it("toUser works when the profile row is missing (a half-created account)", () => {
    const u = toUser({ id: "u2", email: "x@example.com", created_at: "2026-01-01T00:00:00Z" }, null);
    expect(u).toMatchObject({ id: "u2", email: "x@example.com", username: "", profileCompleted: false, totalTests: 0 });
  });
});
