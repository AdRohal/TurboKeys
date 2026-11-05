'use client';

import React, { useState, useEffect } from 'react';
import { Link } from '@/lib/router';
import { useAuth } from '../contexts/AuthContext';
import { userAPI, typingAPI } from '../services/api';
import { TypingTestResult } from '../types';
import { Avatar, PageShell, Spinner, StatStrip, shortId } from '../components/ui/kit';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [userTests, setUserTests] = useState<TypingTestResult[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const [tests, stats] = await Promise.all([typingAPI.getUserTests(10), userAPI.getUserStats()]);
        setUserTests(tests);
        setUserStats(stats);
      } catch (error) {
        console.error('Failed to load profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) loadProfileData();
  }, [user]);

  if (loading) {
    return (
      <PageShell>
        <Spinner label="Loading your profile" />
      </PageShell>
    );
  }

  return (
    <PageShell width="max-w-5xl">
      <section className="card flex flex-col items-center gap-5 p-6 text-center sm:p-8">
        <Avatar name={user?.username} />
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-bold tracking-tight text-primary-950 dark:text-ember-300 sm:text-4xl">{user?.username}</h1>
          <p className="mt-1 text-primary-700 dark:text-primary-300">{user?.email}</p>
          {user?.id && (
            <p className="mt-3 inline-block rounded-md border border-primary-200 px-2.5 py-1 font-mono text-xs text-primary-600 dark:border-ember-300/15 dark:text-primary-400" title="Your player id">
              {shortId(user.id)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/account" className="btn-secondary">Edit account</Link>
          <Link to="/history" className="btn-secondary">Full history</Link>
        </div>
      </section>

      {userStats && (
        <div className="mt-6">
          <StatStrip
            items={[
              { label: 'Average WPM', value: userStats.averageWpm || 0 },
              { label: 'Average accuracy', value: `${userStats.averageAccuracy || 0}%` },
              { label: 'Tests completed', value: userStats.testsCompleted || 0 },
            ]}
          />
        </div>
      )}

      <section className="card mt-6 overflow-hidden" aria-labelledby="recent-tests">
        <h2 id="recent-tests" className="px-5 pt-5 text-center text-xl font-semibold text-primary-950 dark:text-ember-300">
          Recent tests
        </h2>
        {userTests.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-center">
              <caption className="sr-only">Your ten most recent typing tests</caption>
              <thead>
                <tr className="border-y border-primary-200 text-xs text-primary-600 dark:border-ember-300/10 dark:text-primary-400">
                  {['Date', 'Mode', 'WPM', 'Accuracy', 'Errors'].map((h) => (
                    <th key={h} scope="col" className="px-3 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {userTests.map((test) => (
                  <tr key={test.id} className="border-b border-primary-100 transition-colors last:border-0 hover:bg-primary-50 dark:border-ember-300/5 dark:hover:bg-ember-300/5">
                    <td className="px-3 py-3 text-sm text-primary-800 dark:text-primary-200">{new Date(test.completedAt).toLocaleDateString()}</td>
                    <td className="px-3 py-3 text-sm capitalize text-primary-800 dark:text-primary-200">{test.mode}</td>
                    <td className="px-3 py-3 font-mono font-semibold tabular text-primary-950 dark:text-ember-300">{test.wpm}</td>
                    <td className="px-3 py-3 font-mono tabular text-primary-800 dark:text-primary-200">{test.accuracy}%</td>
                    <td className="px-3 py-3 font-mono tabular text-primary-800 dark:text-primary-200">{test.errorsCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <p className="mx-auto max-w-sm text-primary-700 dark:text-primary-300">No tests yet. Finish one and it shows up here.</p>
            <Link to="/" className="btn-primary mt-6">Start a test</Link>
          </div>
        )}
      </section>
    </PageShell>
  );
};

export default Profile;
