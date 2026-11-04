'use client';

import React, { useState } from 'react';
import { Link, useNavigate } from '@/lib/router';
import { useAuth } from '../contexts/AuthContext';
import OAuthButtons from '../components/Auth/OAuthButtons';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (formData.password !== formData.confirmPassword) {
      return;
    }

    try {
      setIsLoading(true);
      clearError();
      const result = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
      });
      if (result.needsEmailConfirmation) {
        setCheckEmail(true);
      } else {
        navigate('/');
      }
    } catch (error) {
      // Error is handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const [oauthError, setOauthError] = useState<string | null>(null);

  const passwordsMatch = formData.password === formData.confirmPassword;

  if (checkEmail) {
    return (
      <div className="min-h-[calc(100vh-4rem)] py-10 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-4 text-center" role="status">
          <h2 className="text-3xl font-bold tracking-tight text-primary-950 dark:text-ember-300 text-balance">Check your email</h2>
          <p className="text-primary-700 dark:text-primary-300">
            We sent a confirmation link to <strong>{formData.email}</strong>. Open it to finish creating your account, then sign in.
          </p>
          <Link to="/login" className="inline-block font-medium underline underline-offset-4 text-primary-700 hover:text-primary-900 dark:text-ember-300 dark:hover:text-ember-200">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 flex items-center justify-center px-4 sm:px-6 lg:px-8">
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-primary-950 dark:text-ember-300 text-balance">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-primary-700 dark:text-primary-300">
            Or{' '}
            <Link
              to="/login"
              className="font-medium underline underline-offset-4 text-primary-700 hover:text-primary-900 dark:text-ember-300 dark:hover:text-ember-200"
            >
              sign in to your existing account
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
              <label htmlFor="username" className="block text-sm font-medium text-primary-800 dark:text-primary-200">
                Username *
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="input-field mt-1"
                placeholder="Choose a username"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-primary-800 dark:text-primary-200">
                Email address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input-field mt-1"
                placeholder="Enter your email"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-primary-800 dark:text-primary-200">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder="First name"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-primary-800 dark:text-primary-200">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-primary-800 dark:text-primary-200">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="input-field mt-1"
                placeholder="Enter your password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary-800 dark:text-primary-200">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`input-field mt-1 ${
                  formData.confirmPassword && !passwordsMatch 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : ''
                }`}
                placeholder="Confirm your password"
              />
              {formData.confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  Passwords do not match
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !passwordsMatch}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
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
              <OAuthButtons verb="Sign up" onError={setOauthError} />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
