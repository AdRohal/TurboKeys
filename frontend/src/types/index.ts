export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser extends User {
  token: string;
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
  userId: string;
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
  text: string;
  completedAt: Date;
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
  avatar?: string;
  bestWpm?: number;
  bestAccuracy?: number;
  bestScore?: number;
  testCount?: number;
  latestTest?: Date;
  wpm: number;
  accuracy: number;
  mode: string;
  completedAt: Date;
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

export interface WordListResponse {
  words: string[];
  language: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
