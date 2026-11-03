import { supabaseBrowser } from '@/lib/supabase/client';
import { LeaderboardEntry, Language, TypingTestResult, User } from '../types';

/** Raised for any non-2xx answer. `message` is the text the API sent, ready to show to the person. */
export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

type Json = Record<string, unknown> | unknown[];

async function request<T>(path: string, init: RequestInit & { body?: undefined } = {}, body?: Json): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string' ? payload.error : null) || `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return payload as T;
}

const get = <T,>(path: string) => request<T>(path);
const send = <T,>(method: 'POST' | 'PUT' | 'DELETE', path: string, body?: Json) => request<T>(path, { method }, body);

const qs = (params: Record<string, string | number | undefined>) => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : '';
};

export type OAuthProvider = 'google' | 'github';

export const authAPI = {
  getCurrentUser: () => get<User>('/auth/me'),
  /** Sends the browser to Google or GitHub; they come back to /auth/callback signed in. */
  async signInWithOAuth(provider: OAuthProvider): Promise<void> {
    const { error } = await supabaseBrowser().auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw new ApiError(error.message, 400);
  },
  checkUsername: (username: string) => get<{ available: boolean; reason?: string }>(`/auth/check-username${qs({ username })}`),
  completeProfile: (data: { fullName: string; username: string }) => send<{ message: string; user: User }>('POST', '/auth/complete-profile', data),
};

export const typingAPI = {
  submitTest: (result: Omit<TypingTestResult, 'id' | 'userId' | 'completedAt'>) => send<TypingTestResult>('POST', '/typing-tests', result as unknown as Json),
  getUserTests: (limit?: number) => get<TypingTestResult[]>(`/typing-tests${qs({ limit })}`),
  getHistory: (page = 1, limit = 20, duration?: number, mode?: string, language?: string) =>
    get<{ tests: TypingTestResult[]; totalPages: number; currentPage: number; total: number }>(`/typing-tests/history${qs({ page, limit, duration, mode, language })}`),
  getBestScores: () => get<unknown[]>('/typing-tests/best-scores'),
  getLeaderboard: (duration = 30, mode = 'time', language: string = Language.ENGLISH, limit = 50) =>
    get<LeaderboardEntry[]>(`/typing-tests/leaderboard${qs({ duration, mode, language, limit })}`),
  getStats: () => get<Record<string, number>>('/typing-tests/stats'),
  deleteTest: (id: string) => send<{ message: string }>('DELETE', `/typing-tests/${id}`),
};

export const userAPI = {
  updateProfile: (data: Partial<Pick<User, 'firstName' | 'lastName' | 'username'>>) => send<{ message: string; user: User }>('PUT', '/users/profile', data as Json).then((r) => r.user),
  getUserStats: () => get<Record<string, number>>('/users/stats'),
  deleteAccount: () => send<{ message: string }>('DELETE', '/auth/me').then(() => undefined),
};
