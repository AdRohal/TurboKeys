'use client';

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from '@/lib/router';
import { useAuth } from '../contexts/AuthContext';
import OAuthButtons from '../components/Auth/OAuthButtons';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    try {
      setIsLoading(true);
      clearError();
      await login({ email, password });
      navigate('/');
    } catch (error) {
      // Error is handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const [oauthError, setOauthError] = useState<string | null>(null);

  // /auth/callback sends people back with ?error=oauth when Google or GitHub did not complete
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('error') === 'oauth') {
      setOauthError('Sign-in with that account did not complete. Please try again.');
    }
  }, []);

  return (
    <div className="min-h-[calc(100vh-3rem)] py-10 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 card p-6 sm:p-10">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-xl border border-primary-200 bg-primary-50 dark:border-ember-300/20 dark:bg-ember-300/10">
            <svg
              className="h-6 w-6 text-primary-700 dark:text-ember-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-primary-950 dark:text-ember-300 text-balance">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-primary-700 dark:text-primary-300">
            Or{' '}
            <Link
              to="/register"
              className="font-medium underline underline-offset-4 text-primary-700 hover:text-primary-900 dark:text-ember-300 dark:hover:text-ember-200"
            >
              create a new account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {(error || oauthError) && (
            <div role="alert" className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
              {error || oauthError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-primary-800 dark:text-primary-200">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field mt-1"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-primary-800 dark:text-primary-200">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field mt-1"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-primary-200 dark:border-ember-300/15" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white dark:bg-[#2f1429] text-primary-600 dark:text-primary-400">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <OAuthButtons verb="Sign in" onError={setOauthError} />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
