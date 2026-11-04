/** A row ready for `math_rounds` (the database fills in id, user, duration and time). */
export type MathRoundRow = {
  points: number;
  correct: number;
  wrong: number;
  best_streak: number;
  avg_answer_ms: number;
  level: number;
};

export type ParsedRound = { ok: true; row: MathRoundRow } | { ok: false; error: string };

const fail = (error: string): ParsedRound => ({ ok: false, error });

function whole(v: unknown, min: number, max: number): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : null;
}

/**
 * Checks a submitted Fast thinking round. Only the known fields are read, so a client cannot send a user id or a time.
 * The totals must add up the way the game scores: 10 points per right answer, plus up to 10 more for a streak. The database
 * checks the same rules, so this gives a clear message before the insert is tried.
 */
export function parseRound(body: unknown): ParsedRound {
  if (typeof body !== 'object' || body === null) return fail('The request body must be a JSON object');
  const b = body as Record<string, unknown>;

  const correct = whole(b.correct, 0, 120);
  const wrong = whole(b.wrong, 0, 120);
  const points = whole(b.points, 0, 3000);
  const bestStreak = whole(b.bestStreak, 0, 120);
  const avgAnswerMs = whole(b.avgAnswerMs, 0, 60000);
  const level = whole(b.level, 1, 6);

  if (correct === null) return fail('Invalid correct: a whole number from 0 to 120');
  if (wrong === null) return fail('Invalid wrong: a whole number from 0 to 120');
  if (points === null) return fail('Invalid points: a whole number from 0 to 3000');
  if (bestStreak === null) return fail('Invalid bestStreak: a whole number from 0 to 120');
  if (avgAnswerMs === null) return fail('Invalid avgAnswerMs: a whole number of milliseconds');
  if (level === null) return fail('Invalid level: a whole number from 1 to 6');

  if (points < correct * 10 || points > correct * 20) return fail('Invalid points: they do not match the right answers');
  if (bestStreak > correct) return fail('Invalid bestStreak: longer than the right answers');
  if (correct + wrong > 0 && avgAnswerMs < 400) return fail('Invalid avgAnswerMs: answers were faster than a person can give them');

  return { ok: true, row: { points, correct, wrong, best_streak: bestStreak, avg_answer_ms: avgAnswerMs, level } };
}
