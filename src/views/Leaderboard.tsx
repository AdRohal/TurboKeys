'use client';

import React, { useState, useEffect } from 'react';
import { Link } from '@/lib/router';
import { mathAPI, typingAPI, MathBoardEntry } from '../services/api';
import { LeaderboardEntry } from '../types';

type Board = 'typing' | 'math';

function Group<T extends string | number>({ label, values, current, set, suffix = '' }: { label: string; values: T[]; current: T; set: (v: T) => void; suffix?: string }) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-2">
      <span className="text-sm text-primary-600 dark:text-primary-400">{label}</span>
      <div className="segmented">
        {values.map((v) => (
          <button key={v} type="button" className="segment capitalize" aria-pressed={current === v} onClick={() => set(v)}>
            {v}
            {suffix}
          </button>
        ))}
      </div>
    </div>
  );
}

const th = 'py-3 px-3 text-center font-medium';
const rowClass = (top: boolean) =>
  `border-b border-primary-100 last:border-0 transition-colors hover:bg-primary-50 dark:border-ember-300/5 dark:hover:bg-ember-300/5 ${top ? 'bg-primary-50/60 dark:bg-ember-300/[0.04]' : ''}`;

const Rank: React.FC<{ n: number }> = ({ n }) => (
  <span className={`mx-auto grid h-8 w-8 place-items-center rounded-md text-sm font-bold tabular ${n <= 3 ? 'bg-primary-600 text-white dark:bg-ember-300 dark:text-primary-950' : 'text-primary-600 dark:text-primary-400'}`}>{n}</span>
);

const Player: React.FC<{ name: string; sub: string }> = ({ name, sub }) => (
  <div className="flex items-center gap-3">
    <span aria-hidden="true" className="hidden sm:grid h-9 w-9 place-items-center rounded-full border border-primary-200 text-sm font-semibold text-primary-700 dark:border-ember-300/20 dark:text-ember-300">
      {name.charAt(0).toUpperCase()}
    </span>
    <div className="min-w-0">
      <div className="truncate font-medium text-primary-950 dark:text-ember-200">{name}</div>
      <div className="text-xs text-primary-600 dark:text-primary-400">{sub}</div>
    </div>
  </div>
);

const Loading = () => (
  <div className="space-y-px p-1" role="status" aria-label="Loading leaderboard">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="h-14 animate-pulse rounded-md bg-primary-100/70 dark:bg-ember-300/5" />
    ))}
  </div>
);

const Empty: React.FC<{ title: string; body: string; to: string; cta: string }> = ({ title, body, to, cta }) => (
  <div className="px-6 py-10 text-center">
    <h2 className="text-lg font-semibold text-primary-950 dark:text-ember-200">{title}</h2>
    <p className="mx-auto mt-2 max-w-sm text-primary-700 dark:text-primary-300">{body}</p>
    <Link to={to} className="btn-primary mt-6">
      {cta}
    </Link>
  </div>
);

const Leaderboard: React.FC = () => {
  const [board, setBoard] = useState<Board>('typing');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [mathBoard, setMathBoard] = useState<MathBoardEntry[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [selectedMode, setSelectedMode] = useState<string>('time');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('english');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [failMessage, setFailMessage] = useState('');

  // /leaderboard?board=math opens the math board (the game links here after a saved round)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('board') === 'math') setBoard('math');
  }, []);

  const chooseBoard = (b: Board) => {
    setBoard(b);
    try {
      window.history.replaceState(null, '', b === 'math' ? '/leaderboard?board=math' : '/leaderboard');
    } catch {
      /* the address bar is only a convenience */
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setFailed(false);
      setFailMessage('');
      try {
        if (board === 'typing') {
          const data = await typingAPI.getLeaderboard(selectedDuration, selectedMode, selectedLanguage, 50);
          if (!cancelled) setLeaderboard(data);
        } else {
          const data = await mathAPI.getLeaderboard(50);
          if (!cancelled) setMathBoard(data);
        }
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
        if (!cancelled) {
          setFailed(true);
          setFailMessage(error instanceof Error ? error.message : '');
          if (board === 'typing') setLeaderboard([]);
          else setMathBoard([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [board, selectedDuration, selectedMode, selectedLanguage]);

  // by score, then fewer tests, then higher accuracy
  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    const scoreA = a.bestScore ?? 0;
    const scoreB = b.bestScore ?? 0;
    if (scoreB !== scoreA) return scoreB - scoreA;
    const testCountA = a.testCount ?? Infinity;
    const testCountB = b.testCount ?? Infinity;
    if (testCountA !== testCountB) return testCountA - testCountB;
    const accuracyA = a.bestAccuracy ?? a.accuracy ?? 0;
    const accuracyB = b.bestAccuracy ?? b.accuracy ?? 0;
    return accuracyB - accuracyA;
  });

  const isMath = board === 'math';

  return (
    <div className="min-h-screen py-6 sm:py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary-950 dark:text-ember-300 text-balance">Leaderboard</h1>
        <p className="mx-auto mt-3 max-w-prose text-primary-700 dark:text-primary-300">
          {isMath
            ? 'The sharpest minds on TurboKeys, ranked by their best 60 second Fast thinking round.'
            : 'The fastest typists on TurboKeys, ranked by score. Pick a test length to see who leads it.'}
        </p>

        <div className="mt-8 flex justify-center">
          <div role="group" aria-label="Leaderboard" className="segmented">
            <button type="button" className="segment" aria-pressed={!isMath} onClick={() => chooseBoard('typing')}>
              Keyboard typing
            </button>
            <button type="button" className="segment" aria-pressed={isMath} onClick={() => chooseBoard('math')}>
              Fast thinking
            </button>
          </div>
        </div>

        {!isMath && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            <Group label="Duration" values={[15, 30, 60, 120]} current={selectedDuration} set={setSelectedDuration} suffix="s" />
            <Group label="Mode" values={['time', 'words']} current={selectedMode} set={setSelectedMode} />
            <Group label="Language" values={['english', 'french']} current={selectedLanguage} set={setSelectedLanguage} />
          </div>
        )}

        <div className="card mt-6 overflow-hidden" aria-busy={loading}>
          {loading ? (
            <Loading />
          ) : failed ? (
            <div className="px-6 py-10 text-center" role="alert">
              <h2 className="text-lg font-semibold text-primary-950 dark:text-ember-200">The leaderboard did not load</h2>
              <p className="mx-auto mt-2 max-w-sm text-primary-700 dark:text-primary-300">{failMessage || 'Check your connection and reload the page to try again.'}</p>
            </div>
          ) : isMath ? (
            mathBoard.length > 0 ? (
              <table className="w-full text-center">
                <caption className="sr-only">Top Fast thinking players by best round</caption>
                <thead>
                  <tr className="border-b border-primary-200 text-xs text-primary-600 dark:border-ember-300/10 dark:text-primary-400">
                    <th scope="col" className="w-16 py-3 pl-4 text-center font-medium">Rank</th>
                    <th scope="col" className="py-3 text-left font-medium">Player</th>
                    <th scope="col" className={th}>Points</th>
                    <th scope="col" className={`hidden sm:table-cell ${th}`}>Right answers</th>
                    <th scope="col" className={`hidden sm:table-cell ${th}`}>Accuracy</th>
                    <th scope="col" className={th}>Best streak</th>
                  </tr>
                </thead>
                <tbody>
                  {mathBoard.map((e, i) => (
                    <tr key={e.id} className={rowClass(i < 3)}>
                      <td className="py-3 pl-4 text-center"><Rank n={i + 1} /></td>
                      <td className="py-3 text-left">
                        <Player name={e.username} sub={`${e.roundCount} ${e.roundCount === 1 ? 'round' : 'rounds'}`} />
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-semibold tabular text-primary-950 dark:text-ember-300">{e.bestPoints}</td>
                      <td className="hidden sm:table-cell py-3 px-3 text-center font-mono tabular text-primary-800 dark:text-primary-200">{e.bestCorrect}</td>
                      <td className="hidden sm:table-cell py-3 px-3 text-center font-mono tabular text-primary-800 dark:text-primary-200">{e.bestAccuracy}%</td>
                      <td className="py-3 px-3 text-center font-mono tabular text-primary-800 dark:text-primary-200">{e.bestStreak}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <Empty title="No rounds yet" body="Play a 60 second round while signed in and your score will open the board." to="/fast-thinking" cta="Play Fast thinking" />
            )
          ) : sortedLeaderboard.length > 0 ? (
            <table className="w-full text-center">
              <caption className="sr-only">
                Top typists for a {selectedDuration} second {selectedMode} test in {selectedLanguage}
              </caption>
              <thead>
                <tr className="border-b border-primary-200 text-xs text-primary-600 dark:border-ember-300/10 dark:text-primary-400">
                  <th scope="col" className="w-16 py-3 pl-4 text-center font-medium">Rank</th>
                  <th scope="col" className="py-3 text-left font-medium">Typist</th>
                  <th scope="col" className={th}>Score</th>
                  <th scope="col" className={th}>WPM</th>
                  <th scope="col" className={`hidden sm:table-cell ${th}`}>Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {sortedLeaderboard.map((entry, index) => {
                  const name = entry.user?.username || entry.username || 'Unknown user';
                  return (
                    <tr key={entry.id} className={rowClass(index < 3)}>
                      <td className="py-3 pl-4 text-center"><Rank n={index + 1} /></td>
                      <td className="py-3 text-left">
                        <Player name={name} sub={entry.testCount ? `${entry.testCount} tests` : entry.completedAt ? new Date(entry.completedAt).toLocaleDateString() : 'New typist'} />
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-semibold tabular text-primary-950 dark:text-ember-300">{entry.bestScore ?? 0}</td>
                      <td className="py-3 px-3 text-center font-mono tabular text-primary-800 dark:text-primary-200">{entry.bestWpm ?? entry.wpm ?? 0}</td>
                      <td className="hidden sm:table-cell py-3 px-3 text-center font-mono tabular text-primary-800 dark:text-primary-200">{Math.round(entry.bestAccuracy ?? entry.accuracy ?? 0)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <Empty title="No results for this test yet" body={`Take a ${selectedDuration} second test while signed in and your score will open the board.`} to="/" cta="Start a test" />
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
