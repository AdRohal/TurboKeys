import { describe, expect, it } from 'vitest';
import { parseRound } from './submission';

const good = { points: 130, correct: 10, wrong: 2, bestStreak: 6, avgAnswerMs: 2500, level: 3 };

describe('parseRound', () => {
  it('accepts a round whose totals add up', () => {
    const r = parseRound(good);
    expect(r).toEqual({ ok: true, row: { points: 130, correct: 10, wrong: 2, best_streak: 6, avg_answer_ms: 2500, level: 3 } });
  });

  it('ignores fields a client should not set', () => {
    const r = parseRound({ ...good, user_id: 'someone-else', completed_at: '2020-01-01', duration: 5 });
    expect(r.ok && Object.keys(r.row).sort()).toEqual(['avg_answer_ms', 'best_streak', 'correct', 'level', 'points', 'wrong']);
  });

  it('rejects points that do not match the right answers', () => {
    expect(parseRound({ ...good, points: 99 }).ok).toBe(false); // under 10 per right answer
    expect(parseRound({ ...good, points: 201 }).ok).toBe(false); // over 20 per right answer
  });

  it('rejects a streak longer than the right answers', () => {
    expect(parseRound({ ...good, bestStreak: 11 }).ok).toBe(false);
  });

  it('rejects answers faster than a person can give them', () => {
    expect(parseRound({ ...good, avgAnswerMs: 100 }).ok).toBe(false);
  });

  it('rejects non-numbers, decimals and out of range values', () => {
    expect(parseRound({ ...good, points: '130' }).ok).toBe(false);
    expect(parseRound({ ...good, correct: 10.5 }).ok).toBe(false);
    expect(parseRound({ ...good, level: 7 }).ok).toBe(false);
    expect(parseRound(null).ok).toBe(false);
    expect(parseRound('x').ok).toBe(false);
  });

  it('accepts an empty round', () => {
    expect(parseRound({ points: 0, correct: 0, wrong: 0, bestStreak: 0, avgAnswerMs: 0, level: 1 }).ok).toBe(true);
  });
});
