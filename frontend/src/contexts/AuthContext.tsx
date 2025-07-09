import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthUser, LoginRequest, RegisterRequest } from '../types';
import { authAPI } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: AuthUser }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        loading: false,
        user: action.payload,
        token: action.payload.token,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload,
        user: null,
        token: null,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest | User) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Only auto-initialize auth if we're not on OAuth callback or profile completion pages
    const currentPath = window.location.pathname;
    const isAuthFlow = currentPath === '/oauth-callback' || currentPath === '/complete-profile';
    
    if (!isAuthFlow) {
      const initializeAuth = async () => {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            dispatch({ type: 'AUTH_START' });
            const user = await authAPI.getCurrentUser();
            dispatch({ type: 'AUTH_SUCCESS', payload: { ...user, token } });
          } catch (error) {
            localStorage.removeItem('token');
            dispatch({ type: 'AUTH_FAILURE', payload: 'Session expired' });
          }
        }
      };

      initializeAuth();
    }
  }, []);

  const login = async (credentials: LoginRequest | User) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      // If it's a User object (from OAuth), use it directly
      if ('id' in credentials) {
        const token = localStorage.getItem('token') || '';
        dispatch({ type: 'AUTH_SUCCESS', payload: { ...credentials, token } });
      } else {
        // Otherwise, it's login credentials
        const response = await authAPI.login(credentials);
        localStorage.setItem('token', response.token);
        dispatch({ type: 'AUTH_SUCCESS', payload: response });
      }
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message || 'Login failed' });
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authAPI.register(userData);
      localStorage.setItem('token', response.token);
      dispatch({ type: 'AUTH_SUCCESS', payload: response });
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message || 'Registration failed' });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
