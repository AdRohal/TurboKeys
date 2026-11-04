'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from '@/lib/router';
import { generateQuestion, levelFor, MAX_LEVEL, Question } from '../lib/thinking/questions';
import { useAuth } from '../contexts/AuthContext';
import { mathAPI } from '../services/api';

const ROUND_SECONDS = 60;
const BEST_KEY = 'fastThinkingBest';

type Phase = 'ready' | 'playing' | 'done';
type Picked = { index: number; correct: boolean } | null;
type SaveState = 'idle' | 'saving' | 'saved' | 'failed' | 'signin';

type Stats = {
  correct: number;
  wrong: number;
  points: number;
  bestStreak: number;
  totalAnswerMs: number;
  level: number;
};

const EMPTY: Stats = { correct: 0, wrong: 0, points: 0, bestStreak: 0, totalAnswerMs: 0, level: 1 };

const FastThinking: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState('');
  const userRef = useRef(user);
  userRef.current = user;
  const [phase, setPhase] = useState<Phase>('ready');
  const [question, setQuestion] = useState<Question | null>(null);
  const [picked, setPicked] = useState<Picked>(null);
  const [streak, setStreak] = useState(0);
  const [stats, setStats] = useState<Stats>(EMPTY);
  const [msLeft, setMsLeft] = useState(ROUND_SECONDS * 1000);
  const [best, setBest] = useState<number | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);

  const endAt = useRef(0);
  const shownAt = useRef(0);
  const locked = useRef(false);
  const advance = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statsRef = useRef<Stats>(EMPTY);
  const streakRef = useRef(0);
  const startButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(BEST_KEY));
      if (Number.isFinite(saved) && saved > 0) setBest(saved);
    } catch {
      /* private mode: the best score just is not remembered */
    }
  }, []);

  const nextQuestion = useCallback(() => {
    const q = generateQuestion(levelFor(statsRef.current.correct));
    shownAt.current = performance.now();
    locked.current = false;
    setPicked(null);
    setQuestion(q);
  }, []);

  const start = useCallback(() => {
    if (advance.current) clearTimeout(advance.current);
    statsRef.current = EMPTY;
    streakRef.current = 0;
    setStats(EMPTY);
    setStreak(0);
    setIsNewBest(false);
    setSaveState('idle');
    setSaveError('');
    setMsLeft(ROUND_SECONDS * 1000);
    endAt.current = performance.now() + ROUND_SECONDS * 1000;
    setPhase('playing');
    nextQuestion();
  }, [nextQuestion]);

  const finish = useCallback(() => {
    if (advance.current) clearTimeout(advance.current);
    locked.current = true;
    setPhase('done');
    const round = statsRef.current;
    const points = round.points;
    const answeredCount = round.correct + round.wrong;
    if (!userRef.current) {
      setSaveState('signin');
    } else if (answeredCount === 0) {
      setSaveState('idle');
    } else {
      setSaveState('saving');
      mathAPI
        .submitRound({
          points: round.points,
          correct: round.correct,
          wrong: round.wrong,
          bestStreak: round.bestStreak,
          avgAnswerMs: Math.max(400, Math.round(round.totalAnswerMs / answeredCount)),
          level: round.level,
        })
        .then(() => setSaveState('saved'))
        .catch((e: unknown) => {
          setSaveState('failed');
          setSaveError(e instanceof Error ? e.message : 'Could not save this round.');
        });
    }
    try {
      const previous = Number(localStorage.getItem(BEST_KEY)) || 0;
      if (points > previous) {
        localStorage.setItem(BEST_KEY, String(points));
        setBest(points);
        setIsNewBest(previous > 0);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // the clock
  useEffect(() => {
    if (phase !== 'playing') return;
    const id = setInterval(() => {
      const left = Math.max(0, endAt.current - performance.now());
      setMsLeft(left);
      if (left <= 0) finish();
    }, 100);
    return () => clearInterval(id);
  }, [phase, finish]);

  useEffect(() => () => {
    if (advance.current) clearTimeout(advance.current);
  }, []);

  const choose = useCallback(
    (index: number) => {
      if (phase !== 'playing' || locked.current || !question) return;
      locked.current = true;
      const correct = index === question.correctIndex;
      const took = performance.now() - shownAt.current;
      const nextStreak = correct ? streakRef.current + 1 : 0;
      streakRef.current = nextStreak;
      const s = statsRef.current;
      const correctCount = s.correct + (correct ? 1 : 0);
      const updated: Stats = {
        correct: correctCount,
        wrong: s.wrong + (correct ? 0 : 1),
        points: s.points + (correct ? 10 + Math.min(nextStreak - 1, 5) * 2 : 0),
        bestStreak: Math.max(s.bestStreak, nextStreak),
        totalAnswerMs: s.totalAnswerMs + took,
        level: levelFor(correctCount),
      };
      statsRef.current = updated;
      setStats(updated);
      setStreak(nextStreak);
      setPicked({ index, correct });
      advance.current = setTimeout(() => {
        if (endAt.current - performance.now() > 0) nextQuestion();
      }, correct ? 450 : 1100);
    },
    [phase, question, nextQuestion],
  );

  // keys 1, 2, 3 answer; Enter starts and restarts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (phase === 'playing' && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        choose(Number(e.key) - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, choose]);

  useEffect(() => {
    if (phase !== 'playing') startButton.current?.focus({ preventScroll: true });
  }, [phase]);

  const answered = stats.correct + stats.wrong;
  const accuracy = answered > 0 ? Math.round((stats.correct / answered) * 100) : 0;
  const avgSeconds = answered > 0 ? (stats.totalAnswerMs / answered / 1000).toFixed(1) : '0.0';
  const secondsLeft = Math.ceil(msLeft / 1000);
  const low = secondsLeft <= 10;

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 sm:py-14">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-8 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-primary-950 dark:text-ember-300 text-balance">Think fast</h1>
        <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg text-primary-700 dark:text-primary-300">
          {ROUND_SECONDS} seconds of mental math. Read the question, pick the right answer out of three, and keep your streak alive.
        </p>

        {phase === 'ready' && (
          <div className="card mx-auto mt-10 max-w-2xl px-6 py-10 sm:px-10">
            <ul className="mx-auto grid max-w-lg gap-3 text-center text-primary-800 dark:text-primary-200">
              <li>Each right answer scores 10 points. Every answer in a row adds 2 more, up to 10.</li>
              <li>A wrong answer resets your streak and shows the right one.</li>
              <li>Questions get harder every 4 right answers.</li>
              <li>
                On a keyboard, press <kbd className="rounded border border-primary-300 px-1.5 font-mono text-sm dark:border-ember-300/30">1</kbd>,{' '}
                <kbd className="rounded border border-primary-300 px-1.5 font-mono text-sm dark:border-ember-300/30">2</kbd> or{' '}
                <kbd className="rounded border border-primary-300 px-1.5 font-mono text-sm dark:border-ember-300/30">3</kbd> to answer.
              </li>
            </ul>
            <button ref={startButton} type="button" onClick={start} className="btn-primary mt-8 px-10 !min-h-[52px] text-base">
              Start round
            </button>
            {best !== null && <p className="mt-4 text-sm text-primary-600 dark:text-primary-400">Your best: <span className="font-mono tabular">{best}</span> points</p>}
          </div>
        )}

        {phase === 'playing' && question && (
          <div className="mx-auto mt-8 sm:mt-10 max-w-3xl">
            <div className="mb-5">
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-primary-200 dark:bg-ember-300/10"
                role="progressbar"
                aria-label="Time left"
                aria-valuemin={0}
                aria-valuemax={ROUND_SECONDS}
                aria-valuenow={secondsLeft}
              >
                <div
                  className={`h-full origin-left rounded-full ${low ? 'bg-red-400' : 'bg-primary-600 dark:bg-ember-300'}`}
                  style={{ transform: `scaleX(${msLeft / (ROUND_SECONDS * 1000)})`, transition: 'transform 100ms linear' }}
                />
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Time', value: secondsLeft + 's', warn: low },
                  { label: 'Points', value: String(stats.points) },
                  { label: 'Streak', value: String(streak) },
                ].map((m) => (
                  <div key={m.label}>
                    <dt className="text-xs text-primary-600 dark:text-primary-400">{m.label}</dt>
                    <dd className={`font-mono text-2xl font-bold tabular ${m.warn ? 'text-red-500 dark:text-red-300' : 'text-primary-950 dark:text-ember-300'}`}>{m.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="card px-4 py-8 sm:py-12" aria-live="polite">
              <p className="text-sm text-primary-600 dark:text-primary-400">Level {question.level}{question.level === MAX_LEVEL ? ' (max)' : ''}</p>
              <p className="mt-3 font-mono text-5xl sm:text-7xl font-bold tabular text-primary-950 dark:text-ember-200">
                {question.prompt} <span className="text-primary-500 dark:text-primary-400">=</span> ?
              </p>
            </div>

            <div role="group" aria-label="Answer choices" className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              {question.choices.map((c, i) => {
                const isPicked = picked?.index === i;
                const isAnswer = picked !== null && i === question.correctIndex;
                const state = isAnswer
                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:border-emerald-300 dark:bg-emerald-300/15 dark:text-emerald-200'
                  : isPicked
                    ? 'border-red-500 bg-red-500/15 text-red-800 dark:border-red-300 dark:bg-red-300/15 dark:text-red-200'
                    : 'border-primary-200 bg-white/80 text-primary-950 hover:border-primary-500 hover:bg-primary-50 dark:border-ember-300/15 dark:bg-primary-900/70 dark:text-ember-200 dark:hover:border-ember-300/60 dark:hover:bg-ember-300/10';
                return (
                  <button
                    key={`${question.prompt}-${i}`}
                    type="button"
                    onClick={() => choose(i)}
                    disabled={picked !== null}
                    aria-label={`Answer ${i + 1}: ${c}`}
                    className={`relative min-h-[72px] sm:min-h-[96px] rounded-xl border-2 px-4 font-mono text-3xl sm:text-4xl font-bold tabular transition-colors duration-150 active:translate-y-px disabled:cursor-default ${state}`}
                  >
                    <span className="absolute left-3 top-2 hidden text-xs font-medium opacity-60 sm:block" aria-hidden="true">{i + 1}</span>
                    {c}
                  </button>
                );
              })}
            </div>

            <p className="mt-4 h-6 text-sm font-medium" role="status">
              {picked && (picked.correct ? <span className="text-emerald-700 dark:text-emerald-300">Correct</span> : <span className="text-red-700 dark:text-red-300">Not quite. The answer is {question.answer}.</span>)}
            </p>
          </div>
        )}

        {phase === 'done' && (
          <div className="mx-auto mt-10 max-w-3xl">
            <div className="card px-6 py-8 sm:py-10">
              <h2 className="text-lg font-semibold text-primary-950 dark:text-ember-300">Round over</h2>
              <p className="mt-2 font-mono text-6xl sm:text-8xl font-bold tabular text-primary-950 dark:text-ember-300">{stats.points}</p>
              <p className="mt-1 text-primary-700 dark:text-primary-300">points</p>
              {isNewBest && <p className="mt-3 font-medium text-emerald-700 dark:text-emerald-300">New personal best</p>}
              {!isNewBest && best !== null && <p className="mt-3 text-sm text-primary-600 dark:text-primary-400">Your best: <span className="font-mono tabular">{best}</span> points</p>}
            </div>

            <p className="mt-4 min-h-[1.5rem] text-sm" role="status">
              {saveState === 'saving' && <span className="text-primary-600 dark:text-primary-300">Saving your round…</span>}
              {saveState === 'saved' && (
                <span className="text-emerald-700 dark:text-emerald-300">
                  Saved to the leaderboard.{' '}
                  <Link to="/leaderboard?board=math" className="underline underline-offset-4">See where you rank</Link>
                </span>
              )}
              {saveState === 'failed' && <span className="text-red-700 dark:text-red-300">{saveError}</span>}
              {saveState === 'signin' && !authLoading && (
                <span className="text-primary-700 dark:text-primary-300">
                  <Link to="/login" className="font-medium underline underline-offset-4">Sign in</Link> to put your score on the leaderboard.
                </span>
              )}
            </p>

            <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-primary-200 bg-primary-200 sm:grid-cols-4 dark:border-ember-300/10 dark:bg-ember-300/10">
              {[
                { label: 'Right answers', value: String(stats.correct) },
                { label: 'Accuracy', value: accuracy + '%' },
                { label: 'Best streak', value: String(stats.bestStreak) },
                { label: 'Average time', value: avgSeconds + 's' },
              ].map((m) => (
                <div key={m.label} className="bg-white px-4 py-5 dark:bg-primary-900">
                  <dt className="text-xs text-primary-600 dark:text-primary-300">{m.label}</dt>
                  <dd className="mt-1 font-mono text-2xl font-semibold tabular text-primary-950 dark:text-ember-200">{m.value}</dd>
                </div>
              ))}
            </dl>

            <button ref={startButton} type="button" onClick={start} className="btn-primary mt-8 px-10 !min-h-[52px] text-base">
              Play again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FastThinking;
