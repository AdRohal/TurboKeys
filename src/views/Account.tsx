'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { typingAPI, userAPI } from '../services/api';
import { TypingTestResult } from '../types';
import { Avatar, Field, Notice, PageHeader, PageShell, Spinner, StatStrip, shortId } from '../components/ui/kit';

const Account: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [history, setHistory] = useState<TypingTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionError, setActionError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const response = await typingAPI.getHistory(1, 100);
        setHistory(response.tests);
      } catch (error) {
        console.error('Failed to load typing history:', error);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [user]);

  // Escape closes the delete dialog
  useEffect(() => {
    if (!showDeleteConfirm) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setShowDeleteConfirm(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showDeleteConfirm]);

  if (!user) {
    return (
      <PageShell width="max-w-xl">
        <div className="card p-10 text-center">
          <h1 className="text-2xl font-bold text-primary-950 dark:text-ember-300">Sign in to see your account</h1>
          <p className="mt-2 text-primary-700 dark:text-primary-300">Your account details are only shown when you are signed in.</p>
        </div>
      </PageShell>
    );
  }

  const memberSince = (() => {
    const fmt = (d: string | Date) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    if (user.createdAt) return fmt(user.createdAt);
    if (history.length > 0) {
      const first = [...history].sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())[0];
      return fmt(first.completedAt);
    }
    return 'Not available';
  })();

  const save = async () => {
    const f = firstName.trim();
    const l = lastName.trim();
    setFirstNameError(f ? '' : 'First name is required');
    setLastNameError(l ? '' : 'Last name is required');
    if (!f || !l) return;
    setBusy(true);
    setActionError('');
    try {
      await userAPI.updateProfile({ firstName, lastName });
      setIsEditing(false);
      setSaved(true);
    } catch {
      setActionError('Your changes were not saved. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const cancel = () => {
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setFirstNameError('');
    setLastNameError('');
    setActionError('');
    setIsEditing(false);
  };

  const remove = async () => {
    setBusy(true);
    setActionError('');
    try {
      await userAPI.deleteAccount();
      window.location.href = '/login';
    } catch {
      setActionError('Your account was not deleted. Try again in a moment.');
      setShowDeleteConfirm(false);
      setBusy(false);
    }
  };

  const avg = (k: 'wpm' | 'accuracy') => (history.length ? Math.round(history.reduce((s, t) => s + t[k], 0) / history.length) : 0);

  const nameField = (id: string, label: string, value: string, set: (v: string) => void, error: string, setError: (v: string) => void) => (
    <div>
      <label htmlFor={id} className="block text-sm text-primary-600 dark:text-primary-400">{label}</label>
      <input
        id={id}
        type="text"
        value={value}
        required
        aria-invalid={!!error}
        onChange={(e) => {
          set(e.target.value);
          setError(e.target.value.trim() ? '' : `${label} is required`);
        }}
        className={`input-field mt-1 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30 dark:border-red-400' : ''}`}
      />
      {error && <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>}
    </div>
  );

  return (
    <PageShell width="max-w-5xl">
      <PageHeader title="Account" subtitle="Your details and how you are doing across all tests." />

      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <Avatar name={user.username} />
        <p className="font-mono text-xs text-primary-600 dark:text-primary-400" title="Your player id">{shortId(user.id)}</p>
      </div>

      {(actionError || saved) && (
        <div className="mx-auto mb-6 max-w-xl">
          {actionError ? <Notice>{actionError}</Notice> : <Notice tone="ok">Profile updated.</Notice>}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-6 sm:p-8" aria-labelledby="details">
          <h2 id="details" className="text-center text-xl font-semibold text-primary-950 dark:text-ember-300">Profile</h2>
          <div className="mt-6 space-y-4">
            {isEditing ? (
              <>
                {nameField('firstName', 'First name', firstName, setFirstName, firstNameError, setFirstNameError)}
                {nameField('lastName', 'Last name', lastName, setLastName, lastNameError, setLastNameError)}
              </>
            ) : (
              <>
                <Field label="First name" value={firstName || 'Not set'} />
                <Field label="Last name" value={lastName || 'Not set'} />
              </>
            )}
            <Field label="Username" value={user.username} mono />
            <Field label="Email" value={user.email} />
            <Field label="Member since" value={memberSince} />
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {isEditing ? (
              <>
                <button type="button" onClick={save} disabled={busy || !firstName.trim() || !lastName.trim()} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
                  {busy ? 'Saving…' : 'Save changes'}
                </button>
                <button type="button" onClick={cancel} className="btn-secondary">Cancel</button>
              </>
            ) : (
              <button type="button" onClick={() => { setSaved(false); setIsEditing(true); }} className="btn-primary">Edit profile</button>
            )}
          </div>
        </section>

        <section className="space-y-6" aria-labelledby="stats">
          <div className="card p-6 sm:p-8">
            <h2 id="stats" className="text-center text-xl font-semibold text-primary-950 dark:text-ember-300">Typing record</h2>
            <div className="mt-6">
              {loading ? (
                <Spinner label="Loading statistics" />
              ) : (
                <StatStrip
                  items={[
                    { label: 'Total tests', value: history.length },
                    { label: 'Average WPM', value: avg('wpm') },
                    { label: 'Average accuracy', value: `${avg('accuracy')}%` },
                    { label: 'Best WPM', value: history.length ? Math.max(...history.map((t) => t.wpm)) : 0 },
                  ]}
                />
              )}
            </div>
          </div>

          <div className="card p-6 text-center sm:p-8">
            <h2 className="text-xl font-semibold text-primary-950 dark:text-ember-300">Delete account</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-primary-700 dark:text-primary-300">
              This removes your profile, test history and leaderboard scores for good.
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-lg border border-red-300 px-5 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-400/40 dark:text-red-300 dark:hover:bg-red-500/10"
            >
              Delete my account
            </button>
          </div>
        </section>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-primary-950/70 p-4 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="delete-title" className="card w-full max-w-sm p-7 text-center" onClick={(e) => e.stopPropagation()}>
            <h2 id="delete-title" className="text-xl font-bold text-primary-950 dark:text-ember-300">Delete your account?</h2>
            <p className="mt-2 text-sm text-primary-700 dark:text-primary-300">This cannot be undone. Your scores leave the leaderboard immediately.</p>
            <div className="mt-6 flex justify-center gap-3">
              <button type="button" autoFocus onClick={() => setShowDeleteConfirm(false)} className="btn-secondary">Keep my account</button>
              <button type="button" disabled={busy} onClick={remove} className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50">
                {busy ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default Account;
