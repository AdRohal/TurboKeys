/** Database rows (snake_case) to the shapes the pages already read (camelCase). */

export type TestRow = {
  id: string;
  wpm: number;
  accuracy: number;
  duration: number;
  mode: string;
  language: string;
  difficulty: string;
  characters_typed: number;
  errors_count: number;
  correct_characters: number;
  total_characters: number;
  completed_at: string;
};

export const TEST_COLUMNS = "id, wpm, accuracy, duration, mode, language, difficulty, characters_typed, errors_count, correct_characters, total_characters, completed_at";

export const toTest = (r: TestRow) => ({
  id: r.id,
  wpm: r.wpm,
  accuracy: r.accuracy,
  duration: r.duration,
  mode: r.mode,
  language: r.language,
  difficulty: r.difficulty,
  charactersTyped: r.characters_typed,
  errorsCount: r.errors_count,
  correctCharacters: r.correct_characters,
  totalCharacters: r.total_characters,
  completedAt: r.completed_at,
});

type BoardRow = { user_id: string; username: string; avatar: string | null; best_wpm: number; best_accuracy: number; best_score: number; test_count: number; latest_test: string };
export const toBoardEntry = (r: BoardRow) => ({
  id: r.user_id,
  username: r.username,
  avatar: r.avatar,
  bestWpm: r.best_wpm,
  bestAccuracy: r.best_accuracy,
  bestScore: r.best_score,
  testCount: r.test_count,
  latestTest: r.latest_test,
});

type BestRow = { duration: number; mode: string; language: string; best_wpm: number; best_accuracy: number; best_score: number; test_count: number; latest_test: string };
export const toBestScore = (r: BestRow) => ({
  duration: r.duration,
  mode: r.mode,
  language: r.language,
  bestWpm: r.best_wpm,
  bestAccuracy: r.best_accuracy,
  bestScore: r.best_score,
  testCount: r.test_count,
  latestTest: r.latest_test,
});

type StatsRow = { total_tests: number; average_wpm: number; average_accuracy: number; best_wpm: number; best_accuracy: number; total_characters_typed: number; total_errors: number; total_time_minutes: number };
export const toStats = (r: StatsRow | null) => ({
  totalTests: r?.total_tests ?? 0,
  // the Profile page reads this name
  testsCompleted: r?.total_tests ?? 0,
  averageWpm: r?.average_wpm ?? 0,
  averageAccuracy: r?.average_accuracy ?? 0,
  bestWpm: r?.best_wpm ?? 0,
  bestAccuracy: r?.best_accuracy ?? 0,
  totalCharactersTyped: r?.total_characters_typed ?? 0,
  totalErrors: r?.total_errors ?? 0,
  totalTimeSpent: r?.total_time_minutes ?? 0,
});

export type ProfileRow = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  profile_completed: boolean;
  theme: string;
  language: string;
  total_tests: number;
  best_wpm: number;
  average_wpm: number;
  best_accuracy: number;
  average_accuracy: number;
  created_at: string;
  updated_at: string;
};

export const PROFILE_COLUMNS = "id, username, first_name, last_name, avatar_url, profile_completed, theme, language, total_tests, best_wpm, average_wpm, best_accuracy, average_accuracy, created_at, updated_at";

export function toUser(auth: { id: string; email?: string | null; created_at: string }, p: ProfileRow | null) {
  return {
    id: auth.id,
    email: auth.email ?? "",
    username: p?.username ?? "",
    firstName: p?.first_name ?? "",
    lastName: p?.last_name ?? "",
    profilePicture: p?.avatar_url ?? undefined,
    profileCompleted: p?.profile_completed ?? false,
    totalTests: p?.total_tests ?? 0,
    averageWPM: p?.average_wpm ?? 0,
    averageAccuracy: p?.average_accuracy ?? 0,
    bestWPM: p?.best_wpm ?? 0,
    bestAccuracy: p?.best_accuracy ?? 0,
    createdAt: p?.created_at ?? auth.created_at,
    updatedAt: p?.updated_at ?? auth.created_at,
  };
}
