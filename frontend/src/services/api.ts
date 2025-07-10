import axios, { AxiosInstance, AxiosResponse } from 'axios';
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
import { mockAuthAPI, mockTypingAPI, mockUserAPI } from './mockApi';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';
const USE_MOCK_API = process.env.REACT_APP_USE_MOCK_API === 'true';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  private async handleResponse<T>(response: AxiosResponse<ApiResponse<T> | T>): Promise<T> {
    // Handle wrapped response (with success/data structure)
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      const apiResponse = response.data as ApiResponse<T>;
      if (apiResponse.success && apiResponse.data) {
        return apiResponse.data;
      }
      throw new Error(apiResponse.error || apiResponse.message || 'API request failed');
    }
    
    // Handle direct response (data returned directly)
    return response.data as T;
  }

  // Check if backend is available
  private async isBackendAvailable(): Promise<boolean> {
    if (USE_MOCK_API) return false;
    
    try {
      await this.client.get('/health', { timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<AuthUser> {
    if (!(await this.isBackendAvailable())) {
      return mockAuthAPI.login(credentials);
    }
    
    const response = await this.client.post<ApiResponse<AuthUser>>('/auth/login', credentials);
    return this.handleResponse(response);
  }

  async register(userData: RegisterRequest): Promise<AuthUser> {
    if (!(await this.isBackendAvailable())) {
      return mockAuthAPI.register(userData);
    }
    
    const response = await this.client.post<ApiResponse<AuthUser>>('/auth/register', userData);
    return this.handleResponse(response);
  }

  async getCurrentUser(): Promise<User> {
    if (!(await this.isBackendAvailable())) {
      return mockAuthAPI.getCurrentUser();
    }
    
    const response = await this.client.get<ApiResponse<User>>('/auth/me');
    return this.handleResponse(response);
  }

  // OAuth endpoints
  getGoogleAuthUrl(): string {
    if (USE_MOCK_API) return mockAuthAPI.getGoogleAuthUrl();
    return `${API_BASE_URL}/auth/oauth2/google`;
  }

  getGitHubAuthUrl(): string {
    if (USE_MOCK_API) return mockAuthAPI.getGitHubAuthUrl();
    return `${API_BASE_URL}/auth/oauth2/github`;
  }

  // Typing test endpoints
  async submitTypingTest(result: Omit<TypingTestResult, 'id' | 'userId' | 'completedAt'>): Promise<TypingTestResult> {
    if (!(await this.isBackendAvailable())) {
      return mockTypingAPI.submitTest(result);
    }
    
    const response = await this.client.post<ApiResponse<TypingTestResult>>('/typing-tests/submit', result);
    return this.handleResponse(response);
  }

  async getUserTests(limit?: number): Promise<TypingTestResult[]> {
    if (!(await this.isBackendAvailable())) {
      return mockTypingAPI.getUserTests(limit);
    }
    
    const response = await this.client.get<ApiResponse<TypingTestResult[]>>(`/typing-tests/user${limit ? `?limit=${limit}` : ''}`);
    return this.handleResponse(response);
  }

  async getTypingHistory(page: number = 1, limit: number = 20, duration?: number, mode?: string, language?: string): Promise<{ tests: TypingTestResult[], totalPages: number, currentPage: number, total: number }> {
    if (!(await this.isBackendAvailable())) {
      return { tests: await mockTypingAPI.getUserTests(limit), totalPages: 1, currentPage: 1, total: 0 };
    }
    
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (duration) params.append('duration', duration.toString());
    if (mode) params.append('mode', mode);
    if (language) params.append('language', language);
    
    const response = await this.client.get<ApiResponse<{ tests: TypingTestResult[], totalPages: number, currentPage: number, total: number }>>(`/typing-tests/history?${params}`);
    return this.handleResponse(response);
  }

  async getBestScores(): Promise<any[]> {
    if (!(await this.isBackendAvailable())) {
      return [];
    }
    
    const response = await this.client.get<ApiResponse<any[]>>('/typing-tests/best-scores');
    return this.handleResponse(response);
  }

  async getLeaderboard(duration: number = 30, mode: string = 'time', language: string = 'english', limit: number = 50): Promise<LeaderboardEntry[]> {
    if (!(await this.isBackendAvailable())) {
      return mockTypingAPI.getLeaderboard(TestMode.THIRTY_SECONDS, limit);
    }
    
    const params = new URLSearchParams({ 
      duration: duration.toString(), 
      mode, 
      language, 
      limit: limit.toString() 
    });
    
    const response = await this.client.get<ApiResponse<LeaderboardEntry[]>>(`/typing-tests/leaderboard?${params}`);
    return this.handleResponse(response);
  }

  async getTypingStats(): Promise<any> {
    if (!(await this.isBackendAvailable())) {
      return {};
    }
    
    const response = await this.client.get<ApiResponse<any>>('/typing-tests/stats');
    return this.handleResponse(response);
  }

  // Words endpoints
  async getWords(language: Language = Language.ENGLISH, count: number = 50): Promise<WordListResponse> {
    if (!(await this.isBackendAvailable())) {
      return mockTypingAPI.getWords(language, count);
    }
    
    const response = await this.client.get<ApiResponse<WordListResponse>>(`/words?language=${language}&count=${count}`);
    return this.handleResponse(response);
  }

  // User profile endpoints
  async updateProfile(userData: Partial<User>): Promise<User> {
    if (!(await this.isBackendAvailable())) {
      return mockUserAPI.updateProfile(userData);
    }
    
    const response = await this.client.put<ApiResponse<User>>('/users/profile', userData);
    return this.handleResponse(response);
  }

  async getUserStats(): Promise<any> {
    if (!(await this.isBackendAvailable())) {
      return mockUserAPI.getUserStats();
    }
    
    const response = await this.client.get<ApiResponse<any>>('/users/stats');
    return this.handleResponse(response);
  }

  async deleteAccount(): Promise<void> {
    if (!(await this.isBackendAvailable())) {
      throw new Error('Cannot delete account in mock mode');
    }
    await this.client.delete('/auth/me');
  }

  // Generic HTTP methods
  async get<T = any>(url: string): Promise<AxiosResponse<T>> {
    return this.client.get(url);
  }

  async post<T = any>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return this.client.post(url, data);
  }

  async put<T = any>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return this.client.put(url, data);
  }

  async delete<T = any>(url: string): Promise<AxiosResponse<T>> {
    return this.client.delete(url);
  }
}

export const apiClient = new APIClient();

// Convenience exports
export const authAPI = {
  login: apiClient.login.bind(apiClient),
  register: apiClient.register.bind(apiClient),
  getCurrentUser: apiClient.getCurrentUser.bind(apiClient),
  getGoogleAuthUrl: apiClient.getGoogleAuthUrl.bind(apiClient),
  getGitHubAuthUrl: apiClient.getGitHubAuthUrl.bind(apiClient),
};

export const typingAPI = {
  submitTest: apiClient.submitTypingTest.bind(apiClient),
  getUserTests: apiClient.getUserTests.bind(apiClient),
  getHistory: apiClient.getTypingHistory.bind(apiClient),
  getBestScores: apiClient.getBestScores.bind(apiClient),
  getLeaderboard: apiClient.getLeaderboard.bind(apiClient),
  getStats: apiClient.getTypingStats.bind(apiClient),
  getWords: apiClient.getWords.bind(apiClient),
};

export const userAPI = {
  updateProfile: apiClient.updateProfile.bind(apiClient),
  deleteAccount: apiClient.deleteAccount.bind(apiClient),
  getUserStats: apiClient.getUserStats.bind(apiClient),
};

export default apiClient;
