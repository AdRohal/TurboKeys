export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  /** False until an OAuth user has chosen a username on /complete-profile. */
  profileCompleted?: boolean;
  totalTests?: number;
  averageWPM?: number;
  averageAccuracy?: number;
  bestWPM?: number;
  bestAccuracy?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface TypingTestResult {
  id?: string;
  userId?: string;
  wpm: number;
  accuracy: number;
  charactersTyped: number;
  errorsCount: number;
  duration: number; // in seconds
  mode: string;
  language: string;
  difficulty?: string;
  correctCharacters?: number;
  totalCharacters?: number;
  testText?: string;
  text?: string;
  completedAt: Date | string;
}

export interface TypingStats {
  wpm: number;
  accuracy: number;
  charactersTyped: number;
  errorsCount: number;
  correctCharacters: number;
  timeElapsed: number;
}

export interface LeaderboardEntry {
  id: string;
  user?: {
    id: string;
    username: string;
    profilePicture?: string;
  };
  username?: string;
  avatar?: string | null;
  bestWpm?: number;
  bestAccuracy?: number;
  bestScore?: number;
  testCount?: number;
  latestTest?: Date | string;
  wpm?: number;
  accuracy?: number;
  mode?: string;
  completedAt?: Date | string;
}

export enum TestMode {
  FIFTEEN_SECONDS = '15s',
  THIRTY_SECONDS = '30s',
  SIXTY_SECONDS = '60s',
  ONE_TWENTY_SECONDS = '120s'
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark'
}

export enum Language {
  ENGLISH = 'english',
  FRENCH = 'french'
}

export interface UserSettings {
  theme: Theme;
  language: Language;
  soundEnabled: boolean;
  showKeyboard: boolean;
}

export interface TypingCharacter {
  char: string;
  status: 'correct' | 'incorrect' | 'current' | 'untyped';
  index: number;
}
