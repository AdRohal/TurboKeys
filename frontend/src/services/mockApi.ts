import { 
  User, 
  AuthUser, 
  LoginRequest, 
  RegisterRequest, 
  TypingTestResult, 
  LeaderboardEntry, 
  WordListResponse,
  TestMode,
  Language,
  ApiResponse 
} from '../types';

// Mock data
const englishWords = [
  'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'and', 'to',
  'of', 'in', 'it', 'you', 'that', 'he', 'was', 'for', 'on', 'are',
  'as', 'with', 'his', 'they', 'at', 'be', 'this', 'have', 'from', 'or',
  'one', 'had', 'by', 'word', 'but', 'not', 'what', 'all', 'were', 'we',
  'when', 'your', 'can', 'said', 'there', 'each', 'which', 'she', 'do', 'how',
  'their', 'if', 'will', 'up', 'other', 'about', 'out', 'many', 'then', 'them',
  'these', 'so', 'some', 'her', 'would', 'make', 'like', 'into', 'him', 'time',
  'has', 'two', 'more', 'very', 'what', 'know', 'just', 'first', 'get', 'over',
  'think', 'also', 'back', 'after', 'use', 'work', 'life', 'only', 'new', 'way',
  'may', 'say', 'great', 'where', 'much', 'through', 'well', 'me', 'year', 'come'
];

const frenchWords = [
  'être', 'avoir', 'faire', 'dire', 'aller', 'voir', 'savoir', 'prendre', 'venir', 'vouloir',
  'pouvoir', 'falloir', 'devoir', 'croire', 'trouver', 'donner', 'parler', 'aimer', 'passer', 'mettre',
  'regarder', 'suivre', 'connaître', 'paraître', 'partir', 'sortir', 'tenir', 'ouvrir', 'porter', 'vivre',
  'écrire', 'lire', 'comprendre', 'entendre', 'apprendre', 'répondre', 'attendre', 'perdre', 'rendre', 'descendre',
  'temps', 'personne', 'année', 'main', 'jour', 'moment', 'pays', 'monde', 'place', 'nombre',
  'eau', 'terre', 'air', 'feu', 'homme', 'femme', 'enfant', 'ami', 'famille', 'maison',
  'ville', 'route', 'voiture', 'train', 'avion', 'bateau', 'travail', 'école', 'livre', 'papier',
  'chien', 'chat', 'cheval', 'animal', 'arbre', 'fleur', 'jardin', 'forêt', 'mer', 'montagne',
  'bon', 'mauvais', 'grand', 'petit', 'nouveau', 'vieux', 'jeune', 'beau', 'joli', 'blanc',
  'noir', 'rouge', 'bleu', 'vert', 'jaune', 'orange', 'violet', 'rose', 'gris', 'marron',
  'aujourd', 'demain', 'hier', 'maintenant', 'toujours', 'jamais', 'souvent', 'parfois', 'alors', 'puis',
  'après', 'avant', 'pendant', 'depuis', 'jusqu', 'vers', 'chez', 'avec', 'sans', 'pour',
  'contre', 'sous', 'sur', 'dans', 'entre', 'parmi', 'autour', 'près', 'loin', 'devant',
  'derrière', 'dessus', 'dessous', 'dedans', 'dehors', 'ailleurs', 'partout', 'nulle', 'quelque', 'chaque'
];

const getWordsByLanguage = (language: Language): string[] => {
  switch (language) {
    case Language.FRENCH:
      return frenchWords;
    case Language.ENGLISH:
    default:
      return englishWords;
  }
};

const mockUser: User = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockLeaderboard: LeaderboardEntry[] = [
  {
    id: '1',
    user: { id: '1', username: 'SpeedTyper', profilePicture: undefined },
    wpm: 120,
    accuracy: 98,
    mode: TestMode.SIXTY_SECONDS,
    completedAt: new Date(),
  },
  {
    id: '2',
    user: { id: '2', username: 'FastFingers', profilePicture: undefined },
    wpm: 115,
    accuracy: 96,
    mode: TestMode.SIXTY_SECONDS,
    completedAt: new Date(),
  },
  {
    id: '3',
    user: { id: '3', username: 'QuickKeys', profilePicture: undefined },
    wpm: 110,
    accuracy: 99,
    mode: TestMode.SIXTY_SECONDS,
    completedAt: new Date(),
  },
];

// Use mock API when backend is not available
const USE_MOCK_API = process.env.REACT_APP_USE_MOCK_API === 'true' || !process.env.REACT_APP_API_URL;

class MockAPIClient {
  private isLoggedIn = false;
  private token = 'mock-jwt-token';

  // Simulate API delay
  private delay(ms: number = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async login(credentials: LoginRequest): Promise<AuthUser> {
    await this.delay();
    
    if (credentials.email === 'test@example.com' && credentials.password === 'password') {
      this.isLoggedIn = true;
      return {
        ...mockUser,
        token: this.token,
      };
    }
    
    throw new Error('Invalid email or password');
  }

  async register(userData: RegisterRequest): Promise<AuthUser> {
    await this.delay();
    
    this.isLoggedIn = true;
    return {
      ...mockUser,
      username: userData.username,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      token: this.token,
    };
  }

  async getCurrentUser(): Promise<User> {
    await this.delay();
    
    if (!this.isLoggedIn) {
      throw new Error('Not authenticated');
    }
    
    return mockUser;
  }

  getGoogleAuthUrl(): string {
    return '#';
  }

  getGitHubAuthUrl(): string {
    return '#';
  }

  async submitTypingTest(result: Omit<TypingTestResult, 'id' | 'userId' | 'completedAt'>): Promise<TypingTestResult> {
    await this.delay();
    
    return {
      id: Date.now().toString(),
      userId: mockUser.id,
      completedAt: new Date(),
      ...result,
    };
  }

  async getUserTests(limit?: number): Promise<TypingTestResult[]> {
    await this.delay();
    
    // Return mock test results
    return [
      {
        id: '1',
        userId: mockUser.id,
        wpm: 85,
        accuracy: 96,
        charactersTyped: 150,
        errorsCount: 6,
        duration: 30,
        mode: TestMode.THIRTY_SECONDS,
        language: 'english',
        text: 'Sample typing test text...',
        completedAt: new Date(Date.now() - 86400000), // Yesterday
      },
      {
        id: '2',
        userId: mockUser.id,
        wpm: 78,
        accuracy: 94,
        charactersTyped: 200,
        errorsCount: 12,
        duration: 60,
        mode: TestMode.SIXTY_SECONDS,
        language: 'english',
        text: 'Another sample typing test text...',
        completedAt: new Date(Date.now() - 172800000), // 2 days ago
      },
    ].slice(0, limit);
  }

  async getLeaderboard(mode: TestMode, limit: number = 10): Promise<LeaderboardEntry[]> {
    await this.delay();
    
    return mockLeaderboard
      .filter(entry => entry.mode === mode)
      .slice(0, limit);
  }

  async getWords(language: Language = Language.ENGLISH, count: number = 50): Promise<WordListResponse> {
    await this.delay();
    
    const wordList = getWordsByLanguage(language);
    const shuffled = [...wordList].sort(() => 0.5 - Math.random());
    return {
      words: shuffled.slice(0, Math.min(count, wordList.length)),
      language,
    };
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    await this.delay();
    
    return {
      ...mockUser,
      ...userData,
      updatedAt: new Date(),
    };
  }

  async getUserStats(): Promise<any> {
    await this.delay();
    
    return {
      averageWpm: 82,
      averageAccuracy: 95,
      testsCompleted: 15,
    };
  }
}

export const mockAPIClient = new MockAPIClient();

// Export mock API methods
export const mockAuthAPI = {
  login: mockAPIClient.login.bind(mockAPIClient),
  register: mockAPIClient.register.bind(mockAPIClient),
  getCurrentUser: mockAPIClient.getCurrentUser.bind(mockAPIClient),
  getGoogleAuthUrl: mockAPIClient.getGoogleAuthUrl.bind(mockAPIClient),
  getGitHubAuthUrl: mockAPIClient.getGitHubAuthUrl.bind(mockAPIClient),
};

export const mockTypingAPI = {
  submitTest: mockAPIClient.submitTypingTest.bind(mockAPIClient),
  getUserTests: mockAPIClient.getUserTests.bind(mockAPIClient),
  getLeaderboard: mockAPIClient.getLeaderboard.bind(mockAPIClient),
  getWords: mockAPIClient.getWords.bind(mockAPIClient),
};

export const mockUserAPI = {
  updateProfile: mockAPIClient.updateProfile.bind(mockAPIClient),
  getUserStats: mockAPIClient.getUserStats.bind(mockAPIClient),
};
