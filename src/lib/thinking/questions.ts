/**
 * Questions for the Fast thinking challenge: quick mental arithmetic with three answers to pick from.
 *
 * The level rises as the player gets answers right, so the first questions are easy and a good run gets hard. Every question has
 * exactly one correct choice. The wrong choices are the mistakes people actually make (off by one, off by ten, a swapped digit,
 * the wrong operation), so picking the right one takes a real calculation and not a glance.
 */

export type Question = {
  /** What the player reads, for example "47 + 38". */
  prompt: string;
  /** Three different numbers, one of them correct. */
  choices: number[];
  /** Position of the correct choice in `choices`. */
  correctIndex: number;
  answer: number;
  level: number;
};

type Rand = () => number;

const defaultRand: Rand = () => {
  const c = typeof globalThis !== 'undefined' ? (globalThis as { crypto?: Crypto }).crypto : undefined;
  if (c?.getRandomValues) return c.getRandomValues(new Uint32Array(1))[0] / 0x100000000;
  return Math.random();
};

export const MAX_LEVEL = 6;

/** Level for a given number of correct answers so far: a new level every 4 right answers. */
export function levelFor(correctSoFar: number): number {
  return Math.min(MAX_LEVEL, 1 + Math.floor(correctSoFar / 4));
}

function int(rand: Rand, min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}

function shuffle<T>(list: T[], rand: Rand): T[] {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** The question itself: prompt and its answer, scaled by level. */
function build(level: number, rand: Rand): { prompt: string; answer: number; wrongOp?: number } {
  const kinds: Array<'add' | 'sub' | 'mul' | 'div' | 'mix'> =
    level === 1 ? ['add', 'sub']
    : level === 2 ? ['add', 'sub', 'mul']
    : level === 3 ? ['add', 'sub', 'mul', 'div']
    : ['add', 'sub', 'mul', 'div', 'mix'];
  const kind = kinds[int(rand, 0, kinds.length - 1)];

  switch (kind) {
    case 'add': {
      const max = [0, 20, 60, 120, 400, 900, 2500][level];
      const a = int(rand, 6, max);
      const b = int(rand, 6, max);
      return { prompt: `${a} + ${b}`, answer: a + b, wrongOp: Math.abs(a - b) };
    }
    case 'sub': {
      const max = [0, 30, 90, 160, 500, 1200, 3000][level];
      const a = int(rand, 12, max);
      const b = int(rand, 5, a - 1);
      return { prompt: `${a} − ${b}`, answer: a - b, wrongOp: a + b };
    }
    case 'mul': {
      const [aMax, bMax] = [[0, 0], [5, 5], [9, 9], [12, 12], [15, 12], [25, 14], [35, 19]][level];
      const a = int(rand, 3, aMax);
      const b = int(rand, 3, bMax);
      return { prompt: `${a} × ${b}`, answer: a * b, wrongOp: a + b };
    }
    case 'div': {
      const [qMax, dMax] = [[0, 0], [0, 0], [0, 0], [12, 9], [20, 12], [30, 15], [40, 19]][level];
      const d = int(rand, 2, dMax);
      const q = int(rand, 3, qMax);
      return { prompt: `${d * q} ÷ ${d}`, answer: q, wrongOp: d * q * d };
    }
    default: {
      // two steps, so the player has to hold a number in their head
      const a = int(rand, 4, level >= 6 ? 30 : 18);
      const b = int(rand, 2, level >= 6 ? 12 : 9);
      const c = int(rand, 3, level >= 6 ? 60 : 30);
      if (rand() < 0.5) return { prompt: `${a} × ${b} + ${c}`, answer: a * b + c, wrongOp: a * (b + c) };
      // never go below zero: the number taken away stays under the product
      const take = Math.min(c, a * b - 1);
      return { prompt: `${a} × ${b} − ${take}`, answer: a * b - take, wrongOp: a * (b + take) };
    }
  }
}

/** Wrong answers a tired brain would give: near misses first, then the wrong-operation result. */
function distractors(answer: number, wrongOp: number | undefined, rand: Rand): number[] {
  const candidates: number[] = [];
  const small = [1, -1, 2, -2, 10, -10];
  for (const d of shuffle(small, rand)) candidates.push(answer + d);
  // swapped last two digits (47 -> 74), the classic slip
  const s = String(Math.abs(answer));
  if (s.length >= 2) {
    const swapped = Number(s.slice(0, -2) + s.slice(-1) + s.slice(-2, -1));
    candidates.push(answer < 0 ? -swapped : swapped);
  }
  if (wrongOp !== undefined) candidates.push(wrongOp);
  // a wider miss as a last resort
  candidates.push(answer + int(rand, 3, 9), answer - int(rand, 3, 9), answer + 100);

  const picked: number[] = [];
  const pool = shuffle(candidates, rand);
  // keep one near miss and one "different mistake" so the three never look alike
  for (const c of pool) {
    if (c === answer || c < 0 || picked.includes(c)) continue;
    picked.push(c);
    if (picked.length === 2) break;
  }
  let pad = 11;
  while (picked.length < 2) {
    const c = answer + pad;
    if (!picked.includes(c) && c !== answer) picked.push(c);
    pad += 11;
  }
  return picked;
}

export function generateQuestion(level: number, rand: Rand = defaultRand): Question {
  const lvl = Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)));
  const { prompt, answer, wrongOp } = build(lvl, rand);
  const wrong = distractors(answer, wrongOp, rand);
  const choices = shuffle([answer, ...wrong], rand);
  return { prompt, choices, correctIndex: choices.indexOf(answer), answer, level: lvl };
}
