'use client';

import React, { useState } from 'react';
import { authAPI } from '../../services/api';

type Provider = 'google' | 'github';

const GoogleMark = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const GitHubMark = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
  </svg>
);

const LABELS: Record<Provider, string> = { google: 'Google', github: 'GitHub' };

/** Google and GitHub buttons shared by sign in and sign up. The browser leaves the page once Supabase has the redirect, so the busy state stays until then. */
const OAuthButtons: React.FC<{ onError: (message: string | null) => void; verb: 'Sign in' | 'Sign up' }> = ({ onError, verb }) => {
  const [pending, setPending] = useState<Provider | null>(null);

  const start = async (provider: Provider) => {
    if (pending) return;
    onError(null);
    setPending(provider);
    try {
      await authAPI.signInWithOAuth(provider);
    } catch (e) {
      setPending(null);
      onError(e instanceof Error ? e.message : `Could not start sign-in with ${LABELS[provider]}. Please try again.`);
    }
  };

  const base =
    'w-full inline-flex items-center justify-center gap-2 min-h-[44px] py-2 px-4 border border-gray-300 dark:border-primary-600 rounded-lg bg-white dark:bg-primary-800 text-sm font-medium text-gray-800 dark:text-primary-100 hover:bg-gray-50 dark:hover:bg-primary-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {(['google', 'github'] as const).map((p) => (
        <button key={p} type="button" aria-label={`${verb} with ${LABELS[p]}`} onClick={() => start(p)} disabled={pending !== null} aria-busy={pending === p} className={base}>
          {p === 'google' ? <GoogleMark /> : <GitHubMark />}
          <span>{pending === p ? 'Redirecting…' : LABELS[p]}</span>
        </button>
      ))}
    </div>
  );
};

export default OAuthButtons;
