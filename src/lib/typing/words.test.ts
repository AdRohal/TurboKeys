import { describe, expect, it } from 'vitest';
import { generateTypingText, wordsNeeded } from './words';

describe('generateTypingText', () => {
  it('is different every time', () => {
    const texts = new Set(Array.from({ length: 30 }, () => generateTypingText('english', 30)));
    expect(texts.size).toBe(30);
  });

  it('is long enough for the time given and within the stored limit', () => {
    for (const d of [15, 30, 60, 120]) {
      const t = generateTypingText('english', d);
      expect(t.split(' ').length).toBeGreaterThanOrEqual(wordsNeeded(d));
      expect(t.length).toBeLessThan(20000);
    }
  });

  it('never repeats a word next to itself and keeps single spaces', () => {
    const t = generateTypingText('english', 120);
    expect(t).not.toMatch(/ {2}/);
    const words = t.toLowerCase().replace(/[.,?!]/g, '').split(' ');
    for (let i = 1; i < words.length; i++) expect(words[i]).not.toBe(words[i - 1]);
  });

  it('keeps repeats far apart', () => {
    const words = generateTypingText('english', 120).toLowerCase().replace(/[.,?!]/g, '').split(' ');
    const last = new Map<string, number>();
    for (let i = 0; i < words.length; i++) {
      const prev = last.get(words[i]);
      if (prev !== undefined) expect(i - prev).toBeGreaterThan(20);
      last.set(words[i], i);
    }
  });

  it('writes sentences with a capital and an ending', () => {
    const t = generateTypingText('french', 30);
    expect(t[0]).toBe(t[0].toUpperCase());
    expect(t).toMatch(/[.?!]$/);
  });
});
