import { describe, expect, it } from "vitest";
import { parseSubmission } from "./submission.ts";

const good = { wpm: 60, accuracy: 96, duration: 30, mode: "time", language: "english", difficulty: "medium", charactersTyped: 160, errorsCount: 6, correctCharacters: 154, totalCharacters: 300, testText: "the quick brown fox" };

describe("parseSubmission: what a typing test must look like before it is saved", () => {
  it("accepts a normal result and returns the database row", () => {
    const r = parseSubmission(good);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.row).toEqual({ wpm: 60, accuracy: 96, duration: 30, mode: "time", language: "english", difficulty: "medium", characters_typed: 160, errors_count: 6, correct_characters: 154, total_characters: 300, test_text: "the quick brown fox" });
    }
  });

  it("fills the same defaults the old API did", () => {
    const r = parseSubmission({ wpm: 40, accuracy: 90, duration: 15, charactersTyped: 50, testText: "abc" });
    expect(r.ok && r.row).toMatchObject({ mode: "time", language: "english", difficulty: "medium", errors_count: 0, correct_characters: 50, total_characters: 50 });
  });

  it("accepts a zero WPM with real characters typed (a bad attempt still counts)", () => {
    expect(parseSubmission({ ...good, wpm: 0, accuracy: 0, correctCharacters: 0, errorsCount: 160 }).ok).toBe(true);
  });

  it("rejects a body that is not an object or is missing the required fields", () => {
    expect(parseSubmission(null).ok).toBe(false);
    expect(parseSubmission("x").ok).toBe(false);
    for (const k of ["wpm", "accuracy", "duration", "charactersTyped", "testText"]) {
      const body: Record<string, unknown> = { ...good };
      delete body[k];
      const r = parseSubmission(body);
      expect(r.ok, k).toBe(false);
      if (!r.ok) expect(r.error).toMatch(/missing|invalid/i);
    }
  });

  it("rejects numbers that are not whole, finite or in range", () => {
    for (const bad of [{ wpm: -1 }, { wpm: 401 }, { wpm: 1.5 }, { wpm: NaN }, { wpm: "60" }, { accuracy: 101 }, { accuracy: -5 }, { duration: 45 }, { charactersTyped: 0 }, { errorsCount: -1 }]) {
      expect(parseSubmission({ ...good, ...bad }).ok, JSON.stringify(bad)).toBe(false);
    }
  });

  it("rejects unknown mode, language or difficulty", () => {
    expect(parseSubmission({ ...good, mode: "zen" }).ok).toBe(false);
    expect(parseSubmission({ ...good, language: "klingon" }).ok).toBe(false);
    expect(parseSubmission({ ...good, difficulty: "insane" }).ok).toBe(false);
  });

  it("rejects text that is empty or too long", () => {
    expect(parseSubmission({ ...good, testText: "" }).ok).toBe(false);
    expect(parseSubmission({ ...good, testText: "a".repeat(20001) }).ok).toBe(false);
  });

  it("rejects more correct characters than were typed", () => {
    const r = parseSubmission({ ...good, correctCharacters: 161 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/correct/i);
  });

  it("rejects a WPM the typed characters cannot produce", () => {
    // 154 correct characters in 30 s is 61.6 WPM; 150 WPM is not possible
    const r = parseSubmission({ ...good, wpm: 150 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/wpm/i);
  });

  it("allows the rounding the app itself does and a couple of seconds of timing slack", () => {
    // exactly what Home.tsx computes for 154 correct characters over the full 30 s, plus the 2 s of slack
    expect(parseSubmission({ ...good, wpm: Math.round(154 / 5 / (30 / 60)) }).ok).toBe(true);
    expect(parseSubmission({ ...good, wpm: Math.round(154 / 5 / (28 / 60)) }).ok).toBe(true);
    expect(parseSubmission({ ...good, wpm: Math.round(154 / 5 / (20 / 60)) }).ok).toBe(false);
  });

  it("ignores extra fields the client sends, so they never reach the database", () => {
    const r = parseSubmission({ ...good, text: "whole text", user_id: "someone-else", completed_at: "2020-01-01" });
    expect(r.ok && Object.keys(r.row)).not.toContain("user_id");
    expect(r.ok && Object.keys(r.row)).not.toContain("completed_at");
  });
});
