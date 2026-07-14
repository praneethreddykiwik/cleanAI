'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'cleanai-theme';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(theme: Theme, system: ResolvedTheme): ResolvedTheme {
  return theme === 'system' ? system : theme;
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('light');
  const [theme, setThemeState] = useState<Theme>('system');

  // Initialize from localStorage on mount (client only)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const system = getSystemTheme();
    const initial = stored || 'system';
    
    setTimeout(() => {
      setSystemTheme(system);
      setThemeState(initial);
    }, 0);

    applyTheme(resolveTheme(initial, system));
  }, []);

  // Listen to OS-level preference changes
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const newSystem: ResolvedTheme = e.matches ? 'dark' : 'light';
      setSystemTheme(newSystem);
      if (theme === 'system') {
        applyTheme(newSystem);
      }
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
    const system = getSystemTheme();
    applyTheme(resolveTheme(next, system));
  }, []);

  const toggleTheme = useCallback(() => {
    const resolved = resolveTheme(theme, systemTheme);
    setTheme(resolved === 'dark' ? 'light' : 'dark');
  }, [theme, systemTheme, setTheme]);

  const resolvedTheme = resolveTheme(theme, systemTheme);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, systemTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
