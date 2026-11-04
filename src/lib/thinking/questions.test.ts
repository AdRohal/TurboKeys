import { describe, expect, it } from 'vitest';
import { generateQuestion, levelFor, MAX_LEVEL } from './questions';

function evaluate(prompt: string): number {
  const expr = prompt.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  // the prompts only ever hold digits, spaces and + - * /
  if (!/^[\d\s+\-*/]+$/.test(expr)) throw new Error('unexpected prompt ' + prompt);
  return Function(`"use strict"; return (${expr})`)() as number;
}

describe('generateQuestion', () => {
  it('always has the right answer among three different choices', () => {
    for (let level = 1; level <= MAX_LEVEL; level++) {
      for (let i = 0; i < 300; i++) {
        const q = generateQuestion(level);
        expect(q.choices).toHaveLength(3);
        expect(new Set(q.choices).size).toBe(3);
        expect(q.choices[q.correctIndex]).toBe(q.answer);
        expect(evaluate(q.prompt)).toBe(q.answer);
        expect(q.choices.every((c) => Number.isInteger(c) && c >= 0)).toBe(true);
      }
    }
  });

  it('only divides evenly', () => {
    for (let i = 0; i < 300; i++) {
      const q = generateQuestion(5);
      if (q.prompt.includes('÷')) expect(Number.isInteger(evaluate(q.prompt))).toBe(true);
    }
  });

  it('puts the right answer in every position over time', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 100; i++) seen.add(generateQuestion(3).correctIndex);
    expect(seen.size).toBe(3);
  });

  it('gets harder as the level rises', () => {
    const avg = (level: number) => Array.from({ length: 200 }, () => generateQuestion(level).answer).reduce((a, b) => a + b, 0) / 200;
    expect(avg(MAX_LEVEL)).toBeGreaterThan(avg(1));
  });
});

describe('levelFor', () => {
  it('rises every four right answers and stops at the top', () => {
    expect(levelFor(0)).toBe(1);
    expect(levelFor(3)).toBe(1);
    expect(levelFor(4)).toBe(2);
    expect(levelFor(1000)).toBe(MAX_LEVEL);
  });
});
