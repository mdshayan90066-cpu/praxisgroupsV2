import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);
const THEME_KEY = 'praxis-theme';

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = getStoredTheme();
    return stored ?? getSystemTheme();
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // NOTE: this duplicate-of-initial-state effect was removed — the useState
  // initializer above already handles this on first render. Keeping it caused
  // an extra unnecessary re-render on every mount.

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme, mounted]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!getStoredTheme()) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    document.documentElement.classList.add('theme-transition');
    setThemeState(newTheme);
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 300);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.add('theme-transition');
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
      }, 300);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, toggleTheme, setTheme }),
    [theme, toggleTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
