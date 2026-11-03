export const DURATIONS = [15, 30, 60, 120] as const;
export const MODES = ["time", "words", "quote"] as const;
export const LANGUAGES = ["english", "french", "spanish", "german"] as const;
export const DIFFICULTIES = ["easy", "medium", "hard"] as const;

const MAX_WPM = 400;
const MAX_TEXT = 20000;
/** The app measures WPM over the time actually elapsed, which can end a little before the full duration. */
const TIMING_SLACK_SECONDS = 2;

/** A row ready for `typing_tests` (the database fills in id, user and time). */
export type TypingTestRow = {
  wpm: number;
  accuracy: number;
  duration: number;
  mode: (typeof MODES)[number];
  language: (typeof LANGUAGES)[number];
  difficulty: (typeof DIFFICULTIES)[number];
  characters_typed: number;
  errors_count: number;
  correct_characters: number;
  total_characters: number;
  test_text: string;
};

export type Parsed = { ok: true; row: TypingTestRow } | { ok: false; error: string };

const fail = (error: string): Parsed => ({ ok: false, error });

function whole(v: unknown, min: number, max: number): number | null {
  return typeof v === "number" && Number.isInteger(v) && v >= min && v <= max ? v : null;
}

function oneOf<T extends readonly string[]>(v: unknown, allowed: T, fallback: T[number]): T[number] | null {
  if (v === undefined || v === null) return fallback;
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T[number]) : null;
}

/**
 * Checks a submitted typing test. Only known fields are read, so nothing else a client sends (user id, time, stats) can reach the
 * database. A result must also be reachable: the WPM cannot be higher than the correct characters allow in the time given.
 */
export function parseSubmission(body: unknown): Parsed {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return fail("Missing fields: send the test result as a JSON object");
  const b = body as Record<string, unknown>;

  for (const key of ["wpm", "accuracy", "duration", "charactersTyped", "testText"]) {
    if (b[key] === undefined || b[key] === null) return fail(`Missing required field: ${key}`);
  }

  const wpm = whole(b.wpm, 0, MAX_WPM);
  if (wpm === null) return fail(`Invalid wpm: a whole number from 0 to ${MAX_WPM}`);
  const accuracy = whole(b.accuracy, 0, 100);
  if (accuracy === null) return fail("Invalid accuracy: a whole number from 0 to 100");
  const duration = (DURATIONS as readonly number[]).includes(b.duration as number) ? (b.duration as number) : null;
  if (duration === null) return fail(`Invalid duration: one of ${DURATIONS.join(", ")} seconds`);
  const charactersTyped = whole(b.charactersTyped, 1, 1_000_000);
  if (charactersTyped === null) return fail("Invalid charactersTyped: a whole number of at least 1");
  const errorsCount = b.errorsCount === undefined || b.errorsCount === null ? 0 : whole(b.errorsCount, 0, 1_000_000);
  if (errorsCount === null) return fail("Invalid errorsCount: a whole number, 0 or more");
  const correctCharacters = b.correctCharacters === undefined || b.correctCharacters === null ? charactersTyped : whole(b.correctCharacters, 0, 1_000_000);
  if (correctCharacters === null) return fail("Invalid correctCharacters: a whole number, 0 or more");
  const totalCharacters = b.totalCharacters === undefined || b.totalCharacters === null ? charactersTyped : whole(b.totalCharacters, 0, 1_000_000);
  if (totalCharacters === null) return fail("Invalid totalCharacters: a whole number, 0 or more");

  const mode = oneOf(b.mode, MODES, "time");
  if (mode === null) return fail(`Invalid mode: one of ${MODES.join(", ")}`);
  const language = oneOf(b.language, LANGUAGES, "english");
  if (language === null) return fail(`Invalid language: one of ${LANGUAGES.join(", ")}`);
  const difficulty = oneOf(b.difficulty, DIFFICULTIES, "medium");
  if (difficulty === null) return fail(`Invalid difficulty: one of ${DIFFICULTIES.join(", ")}`);

  if (typeof b.testText !== "string" || b.testText.length === 0 || b.testText.length > MAX_TEXT) {
    return fail(`Invalid testText: a non-empty string of at most ${MAX_TEXT} characters`);
  }

  if (correctCharacters > charactersTyped) return fail("Invalid correctCharacters: more than the characters typed");

  const reachable = Math.ceil(correctCharacters / 5 / ((duration - TIMING_SLACK_SECONDS) / 60)) + 1;
  if (wpm > reachable) return fail("Invalid wpm: higher than the correct characters typed allow in that time");

  return {
    ok: true,
    row: {
      wpm,
      accuracy,
      duration,
      mode,
      language,
      difficulty,
      characters_typed: charactersTyped,
      errors_count: errorsCount,
      correct_characters: correctCharacters,
      total_characters: totalCharacters,
      test_text: b.testText,
    },
  };
}
