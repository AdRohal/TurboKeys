import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Theme } from '../types';

interface ThemeState {
  theme: Theme;
}

type ThemeAction = 
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'TOGGLE_THEME' };

const initialState: ThemeState = {
  theme: (localStorage.getItem('theme') as Theme) || Theme.DARK,
};

const themeReducer = (state: ThemeState, action: ThemeAction): ThemeState => {
  switch (action.type) {
    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload,
      };
    case 'TOGGLE_THEME':
      return {
        ...state,
        theme: state.theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT,
      };
    default:
      return state;
  }
};

interface ThemeContextType extends ThemeState {
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialState);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(state.theme);
    localStorage.setItem('theme', state.theme);
    
    // Force scrollbar theme update
    const style = document.createElement('style');
    style.textContent = `
      ::-webkit-scrollbar-track { background: var(--scrollbar-track) !important; }
      ::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb) !important; }
      ::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-thumb-hover) !important; }
    `;
    document.head.appendChild(style);
    
    // Remove the style after a short delay
    setTimeout(() => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }, 100);
  }, [state.theme]);

  const setTheme = (theme: Theme) => {
    dispatch({ type: 'SET_THEME', payload: theme });
  };

  const toggleTheme = () => {
    dispatch({ type: 'TOGGLE_THEME' });
  };

  const value: ThemeContextType = {
    ...state,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
