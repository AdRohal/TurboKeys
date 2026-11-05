'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from '@/lib/router';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { validateUsername } from '@/lib/profile';
import { Notice, Spinner, Avatar } from '../components/ui/kit';

const CompleteProfile: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: '',
    username: ''
  });
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // /complete-profile?welcome=1 is the first step after sign-up: it shows even when a username was already chosen
  const [welcome, setWelcome] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const fetchUserInfo = useCallback(async () => {
    try {
      const current = await authAPI.getCurrentUser();
      const isWelcome = new URLSearchParams(window.location.search).get('welcome') === '1';
      setWelcome(isWelcome);
      setUser(current);
      if (current.username) {
        // already chosen at sign-up: prefill it and treat it as available (it is theirs)
        setFormData((prev) => (prev.username ? prev : { ...prev, username: current.username }));
        setUsernameAvailable(true);
      }
      // the name from Google or GitHub is a good starting point
      setFormData((prev) => (prev.fullName ? prev : { ...prev, fullName: [current.firstName, current.lastName].filter(Boolean).join(' ') }));

      // If profile is already completed, redirect to home
      if (current.profileCompleted && !isWelcome) {
        await login(current);
        navigate('/');
      }
    } catch (error) {
      // not signed in (or the session ended): back to the login page
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [login, navigate]);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  const checkUsernameAvailability = async (username: string) => {
    if (validateUsername(username)) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const result = await authAPI.checkUsername(username);
      setUsernameAvailable(result.available);
    } catch (error) {
      setUsernameAvailable(false);
    } finally {
      setCheckingUsername(false);
    }
  };

  // only the last keystroke's check runs
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors((prev: Record<string, string>) => ({
        ...prev,
        [name]: ''
      }));
    }

    // Check username availability
    if (name === 'username') {
      setUsernameAvailable(null);
      // Debounce username check
      if (usernameTimer.current) clearTimeout(usernameTimer.current);
      usernameTimer.current = setTimeout(() => {
        checkUsernameAvailability(value);
      }, 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      const response = await authAPI.completeProfile(formData);

      // Update auth context with completed profile
      await login(response.user);

      // Redirect to home
      navigate('/');
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'An error occurred. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3rem)] grid place-items-center">
        <Spinner label="Loading your profile" />
      </div>
    );
  }

  const usernameProblem = formData.username.length > 0 ? validateUsername(formData.username) : '';
  const canSubmit = !submitting && !!formData.fullName.trim() && !!formData.username && !usernameProblem && usernameAvailable !== false && !checkingUsername;

  return (
    <div className="min-h-[calc(100vh-3rem)] py-10 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="card w-full max-w-lg p-6 sm:p-10">
        <div className="flex flex-col items-center text-center">
          <Avatar name={formData.fullName || user?.email} />
          <h1 className="mt-6 text-balance text-3xl font-bold tracking-tight text-primary-950 dark:text-ember-300 sm:text-4xl">{welcome ? 'Welcome to TurboKeys' : 'Finish setting up'}</h1>
          <p className="mt-2 max-w-sm text-sm text-primary-700 dark:text-primary-300">
            {welcome ? 'Your account is ready. Keep this username or pick another, then start typing. It is the name shown on the leaderboard.' : 'Pick the name that appears on the leaderboard. You can change your full name later; your username stays.'}
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          {errors.general && <Notice>{errors.general}</Notice>}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-primary-800 dark:text-primary-200">Email</label>
            <input id="email" name="email" type="email" value={user?.email || ''} disabled readOnly className="input-field mt-1 opacity-70 cursor-not-allowed" />
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-primary-800 dark:text-primary-200">Full name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              value={formData.fullName}
              onChange={handleInputChange}
              className="input-field mt-1"
              placeholder="Ada Lovelace"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-primary-800 dark:text-primary-200">Username</label>
            <div className="relative mt-1">
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                aria-describedby="username-status"
                aria-invalid={!!usernameProblem || usernameAvailable === false}
                value={formData.username}
                onChange={handleInputChange}
                className="input-field pr-10 font-mono"
                placeholder="ada_types"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                {checkingUsername && <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-300 border-t-primary-700 dark:border-ember-300/20 dark:border-t-ember-300" />}
                {!checkingUsername && usernameAvailable === true && <span aria-hidden="true" className="text-emerald-600 dark:text-emerald-300">✓</span>}
                {!checkingUsername && usernameAvailable === false && <span aria-hidden="true" className="text-red-600 dark:text-red-300">✗</span>}
              </span>
            </div>
            <p id="username-status" className="mt-1.5 min-h-[1.25rem] text-sm" role="status">
              {usernameProblem ? (
                <span className="text-red-700 dark:text-red-300">{usernameProblem}</span>
              ) : checkingUsername ? (
                <span className="text-primary-600 dark:text-primary-400">Checking…</span>
              ) : usernameAvailable === true ? (
                <span className="text-emerald-700 dark:text-emerald-300">{formData.username} is available</span>
              ) : usernameAvailable === false ? (
                <span className="text-red-700 dark:text-red-300">That username is taken</span>
              ) : (
                <span className="text-primary-600 dark:text-primary-400">3 to 30 characters: letters, numbers, dots, dashes or underscores.</span>
              )}
            </p>
          </div>

          <button type="submit" disabled={!canSubmit} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? 'Saving…' : 'Save and start typing'}
          </button>
          {welcome && (
            <button type="button" onClick={() => navigate('/')} className="btn-secondary w-full">
              Skip for now
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;
