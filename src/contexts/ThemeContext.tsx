'use client';

import React, { createContext, useContext, useEffect, useReducer, useState, ReactNode } from 'react';
import { Theme } from '../types';

interface ThemeState {
  theme: Theme;
}

type ThemeAction = { type: 'SET_THEME'; payload: Theme } | { type: 'TOGGLE_THEME' };

// the server cannot know the saved theme, so every render starts dark and the saved one is applied right after mount
// (the inline script in layout.tsx has already set the right class on <html>, so there is no flash)
const initialState: ThemeState = { theme: Theme.DARK };

const themeReducer = (state: ThemeState, action: ThemeAction): ThemeState => {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT };
    default:
      return state;
  }
};

interface ThemeContextType extends ThemeState {
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function readSaved(): Theme | null {
  try {
    const v = window.localStorage.getItem('theme');
    return v === Theme.LIGHT || v === Theme.DARK ? v : null;
  } catch {
    return null;
  }
}

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialState);
  const [ready, setReady] = useState(false);

  // restore the saved choice once, before anything is saved
  useEffect(() => {
    const saved = readSaved();
    if (saved) dispatch({ type: 'SET_THEME', payload: saved });
    setReady(true);
  }, []);

  useEffect(() => {
    // wait for the restore, or the default would overwrite the saved choice
    if (!ready) return;
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(state.theme);
    try {
      window.localStorage.setItem('theme', state.theme);
    } catch {
      /* private mode: the choice just is not remembered */
    }

    // force the scrollbar colours to refresh
    const style = document.createElement('style');
    style.textContent = `
      ::-webkit-scrollbar-track { background: var(--scrollbar-track) !important; }
      ::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb) !important; }
      ::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-thumb-hover) !important; }
    `;
    document.head.appendChild(style);
    const timer = setTimeout(() => style.remove(), 100);
    return () => {
      clearTimeout(timer);
      style.remove();
    };
  }, [state.theme, ready]);

  const value: ThemeContextType = {
    ...state,
    setTheme: (theme) => dispatch({ type: 'SET_THEME', payload: theme }),
    toggleTheme: () => dispatch({ type: 'TOGGLE_THEME' }),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
