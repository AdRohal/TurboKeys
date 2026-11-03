'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, ReactNode } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { LoginRequest, RegisterRequest, User } from '../types';
import { authAPI } from '../services/api';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_INIT_COMPLETE' }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

// loading stays true until we know whether a session exists, so protected pages do not flash the login page
const initialState: AuthState = { user: null, loading: true, error: null };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':
      return { user: action.payload, loading: false, error: null };
    case 'AUTH_FAILURE':
      return { user: null, loading: false, error: action.payload };
    case 'AUTH_INIT_COMPLETE':
      return { ...state, loading: false };
    case 'LOGOUT':
      return { user: null, loading: false, error: null };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest | User) => Promise<void>;
  /** Resolves with `needsEmailConfirmation: true` when Supabase wants the email confirmed before the first sign-in. */
  register: (userData: RegisterRequest) => Promise<{ needsEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Supabase's wording to the wording the forms already used. */
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Invalid credentials';
  if (m.includes('already registered') || m.includes('already been registered')) return 'User already exists';
  if (m.includes('password should be at least')) return 'Password must be at least 6 characters long';
  if (m.includes('email not confirmed')) return 'Please confirm your email first: check your inbox for the link we sent.';
  if (m.includes('rate limit')) return 'Too many attempts. Please wait a moment and try again.';
  return message;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    let cancelled = false;
    const supabase = supabaseBrowser();

    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!data.user) {
          dispatch({ type: 'AUTH_INIT_COMPLETE' });
          return;
        }
        const user = await authAPI.getCurrentUser();
        if (!cancelled) dispatch({ type: 'AUTH_SUCCESS', payload: user });
      } catch {
        if (!cancelled) dispatch({ type: 'AUTH_INIT_COMPLETE' });
      }
    })();

    // signing out in another tab signs out here too
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') dispatch({ type: 'LOGOUT' });
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (credentials: LoginRequest | User) => {
    // a User object (after completing an OAuth profile) is already signed in: just take it
    if ('id' in credentials) {
      dispatch({ type: 'AUTH_SUCCESS', payload: credentials });
      return;
    }
    try {
      dispatch({ type: 'AUTH_START' });
      const { error } = await supabaseBrowser().auth.signInWithPassword({ email: credentials.email.trim(), password: credentials.password });
      if (error) throw new Error(friendlyAuthError(error.message));
      const user = await authAPI.getCurrentUser();
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: error instanceof Error ? error.message : 'Login failed' });
      throw error;
    }
  }, []);

  const register = useCallback(async (userData: RegisterRequest) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const check = await authAPI.checkUsername(userData.username);
      if (!check.available) throw new Error(check.reason || 'Username is already taken');

      const { data, error } = await supabaseBrowser().auth.signUp({
        email: userData.email.trim(),
        password: userData.password,
        options: {
          data: { username: userData.username.trim(), first_name: userData.firstName ?? '', last_name: userData.lastName ?? '' },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw new Error(friendlyAuthError(error.message));

      // no session yet means the project asks for a confirmed email first
      if (!data.session) {
        dispatch({ type: 'AUTH_INIT_COMPLETE' });
        return { needsEmailConfirmation: true };
      }
      const user = await authAPI.getCurrentUser();
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
      return { needsEmailConfirmation: false };
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: error instanceof Error ? error.message : 'Registration failed' });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    await supabaseBrowser().auth.signOut();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []);

  const value = useMemo<AuthContextType>(() => ({ ...state, login, register, logout, clearError }), [state, login, register, logout, clearError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
