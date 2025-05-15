// Inspired by next-themes
"use client"

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme; // The user's selected preference: 'light', 'dark', or 'system'
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'dark' | 'light'; // The actual theme applied, after resolving 'system'
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'ai-roadmap-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  const [resolvedTheme, setResolvedThemeState] = useState<'dark' | 'light'>('light');
  
   useEffect(() => {
    const root = window.document.documentElement;
    let currentAppliedTheme: 'dark' | 'light';

    if (theme === 'system') {
      currentAppliedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      currentAppliedTheme = theme;
    }
    
    root.classList.remove('dark', 'light');
    root.classList.add(currentAppliedTheme);
    setResolvedThemeState(currentAppliedTheme);
  }, [theme]);

  // Effect to initialize theme from localStorage on mount
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(storageKey) as Theme | null;
      if (storedTheme) {
        setThemeState(storedTheme);
      }
    } catch (e) {
      console.warn(`Failed to read theme from localStorage (key: "${storageKey}"):`, e);
    }
  }, [storageKey]); // Only run on mount and if storageKey changes



  useEffect(() => {
    if (theme !== 'system') {
      return;
    }
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const newSystemResolvedTheme = mediaQuery.matches ? 'dark' : 'light';
      const root = window.document.documentElement;
      root.classList.remove('dark', 'light');
      root.classList.add(newSystemResolvedTheme);
      setResolvedThemeState(newSystemResolvedTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]); 


  const setTheme = (newTheme: Theme) => {
    try {
      localStorage.setItem(storageKey, newTheme);
    } catch (e) {
      console.warn(`Failed to save theme to localStorage (key: "${storageKey}"):`, e);
    }
    setThemeState(newTheme);
  };
  
  const contextValue: ThemeProviderState = {
    theme,
    setTheme,
    resolvedTheme: resolvedTheme,
  };

  return (
    <ThemeProviderContext.Provider value={contextValue}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = (): ThemeProviderState => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
