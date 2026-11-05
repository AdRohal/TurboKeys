'use client';

import React, { useState, useEffect } from 'react';
import { Link } from '@/lib/router';
import { useAuth } from '../contexts/AuthContext';
import { typingAPI } from '../services/api';
import { TypingTestResult } from '../types';
import { PageHeader, PageShell, ShortDate, Spinner, StatStrip } from '../components/ui/kit';

type SortKey = 'date' | 'wpm' | 'accuracy';

const DURATIONS: (number | null)[] = [null, 15, 30, 60, 120];
const MODES = ['', 'time', 'words'];

const History: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<TypingTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [selectedMode, setSelectedMode] = useState('');
  const [totalTests, setTotalTests] = useState(0);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) return;
      try {
        setLoading(true);
        setFailed(false);
        const response = await typingAPI.getHistory(1, 100, selectedDuration || undefined, selectedMode || undefined, 'english');
        setHistory(response.tests);
        setTotalTests(response.total);
      } catch (error) {
        console.error('Failed to load typing history:', error);
        setHistory([]);
        setFailed(true);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [user, selectedDuration, selectedMode]);

  const value = (t: TypingTestResult, k: SortKey) => (k === 'date' ? new Date(t.completedAt).getTime() : t[k]);
  const sorted = [...history].sort((a, b) => (sortOrder === 'asc' ? value(a, sortBy) - value(b, sortBy) : value(b, sortBy) - value(a, sortBy)));

  const sortOn = (k: SortKey) => {
    if (sortBy === k) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(k);
      setSortOrder('desc');
    }
  };

  if (!user) {
    return (
      <PageShell width="max-w-xl">
        <div className="card p-10 text-center">
          <h1 className="text-2xl font-bold text-primary-950 dark:text-ember-300">Sign in to see your history</h1>
          <p className="mt-2 text-primary-700 dark:text-primary-300">Every test you finish while signed in is saved here.</p>
          <Link to="/login" className="btn-primary mt-6">Sign in</Link>
        </div>
      </PageShell>
    );
  }

  const avg = (k: 'wpm' | 'accuracy') => Math.round(history.reduce((s, t) => s + t[k], 0) / history.length);

  const SortHead: React.FC<{ k: SortKey; children: React.ReactNode }> = ({ k, children }) => (
    <th scope="col" aria-sort={sortBy === k ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'} className="px-2 py-3 font-medium sm:px-3">
      <button type="button" onClick={() => sortOn(k)} className="inline-flex items-center gap-1 rounded px-1 transition-colors hover:text-primary-950 dark:hover:text-ember-300">
        {children}
        <span aria-hidden="true" className={sortBy === k ? 'text-primary-950 dark:text-ember-300' : 'opacity-30'}>{sortBy === k && sortOrder === 'asc' ? '↑' : '↓'}</span>
      </button>
    </th>
  );

  const plain = (h: string) => (
    <th key={h} scope="col" className="px-2 py-3 font-medium sm:px-3">{h}</th>
  );

  return (
    <PageShell>
      <PageHeader title="Typing history" subtitle={`${totalTests} ${totalTests === 1 ? 'test' : 'tests'} on record. Filter by length or mode, and sort any column.`} />

      <div className="mb-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
        <div role="group" aria-label="Duration" className="flex items-center gap-2">
          <span className="text-sm text-primary-600 dark:text-primary-400">Duration</span>
          <div className="segmented">
            {DURATIONS.map((d) => (
              <button key={d ?? 'all'} type="button" className="segment" aria-pressed={selectedDuration === d} onClick={() => setSelectedDuration(d)}>
                {d === null ? 'All' : `${d}s`}
              </button>
            ))}
          </div>
        </div>
        <div role="group" aria-label="Mode" className="flex items-center gap-2">
          <span className="text-sm text-primary-600 dark:text-primary-400">Mode</span>
          <div className="segmented">
            {MODES.map((m) => (
              <button key={m || 'all'} type="button" className="segment capitalize" aria-pressed={selectedMode === m} onClick={() => setSelectedMode(m)}>
                {m || 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {history.length > 0 && (
        <div className="mb-6">
          <StatStrip
            items={[
              { label: 'Tests shown', value: history.length },
              { label: 'Average WPM', value: avg('wpm') },
              { label: 'Average accuracy', value: `${avg('accuracy')}%` },
              { label: 'Best WPM', value: Math.max(...history.map((t) => t.wpm)) },
            ]}
          />
        </div>
      )}

      <div className="card overflow-hidden" aria-busy={loading}>
        {loading ? (
          <Spinner label="Loading history" />
        ) : failed ? (
          <div className="px-6 py-16 text-center" role="alert">
            <h2 className="text-lg font-semibold text-primary-950 dark:text-ember-200">Your history did not load</h2>
            <p className="mx-auto mt-2 max-w-sm text-primary-700 dark:text-primary-300">Check your connection and reload the page.</p>
          </div>
        ) : history.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <h2 className="text-lg font-semibold text-primary-950 dark:text-ember-200">{selectedDuration || selectedMode ? 'No tests match these filters' : 'No tests yet'}</h2>
            <p className="mx-auto mt-2 max-w-sm text-primary-700 dark:text-primary-300">
              {selectedDuration || selectedMode ? 'Try All to see every test.' : 'Finish a test while signed in and it appears here.'}
            </p>
            <Link to="/" className="btn-primary mt-6">Start a test</Link>
          </div>
        ) : (
          <div className="max-h-[32rem] overflow-auto">
            <table className="w-full text-center">
              <caption className="sr-only">Your typing tests</caption>
              <thead className="sticky top-0 z-10 bg-white dark:bg-primary-900">
                <tr className="border-b border-primary-200 text-xs text-primary-600 dark:border-ember-300/10 dark:text-primary-400">
                  <SortHead k="date">Date</SortHead>
                  <SortHead k="wpm">WPM</SortHead>
                  <SortHead k="accuracy">Accuracy</SortHead>
                  <th scope="col" className="hidden px-3 py-3 font-medium sm:table-cell">Characters</th>
                  {plain('Errors')}
                  <th scope="col" className="hidden px-3 py-3 font-medium sm:table-cell">Mode</th>
                  {plain('Length')}
                </tr>
              </thead>
              <tbody>
                {sorted.map((t) => (
                  <tr key={t.id} className="border-b border-primary-100 transition-colors last:border-0 hover:bg-primary-50 dark:border-ember-300/5 dark:hover:bg-ember-300/5">
                    <td className="whitespace-nowrap px-2 py-3 text-sm text-primary-800 dark:text-primary-200 sm:px-3">
                      <ShortDate value={t.completedAt} />
                    </td>
                    <td className="px-2 py-3 font-mono font-semibold tabular sm:px-3 text-primary-950 dark:text-ember-300">{t.wpm}</td>
                    <td className="px-2 py-3 font-mono tabular text-primary-800 dark:text-primary-200 sm:px-3">{t.accuracy}%</td>
                    <td className="hidden px-3 py-3 font-mono tabular text-primary-800 dark:text-primary-200 sm:table-cell">{t.charactersTyped}</td>
                    <td className="px-2 py-3 font-mono tabular text-primary-800 dark:text-primary-200 sm:px-3">{t.errorsCount}</td>
                    <td className="hidden px-3 py-3 sm:table-cell">
                      <span className="rounded-md border border-primary-200 px-2 py-0.5 text-xs capitalize text-primary-700 dark:border-ember-300/15 dark:text-primary-300">{t.mode}</span>
                    </td>
                    <td className="px-2 py-3 font-mono tabular text-primary-800 dark:text-primary-200 sm:px-3">{t.duration}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default History;
