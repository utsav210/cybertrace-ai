import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light';

interface ThemeState {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const getInitialTheme = (): ThemeMode => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('cybertrace_theme') as ThemeMode;
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  }
  return 'dark'; // Default is dark theme as required
};

export const useThemeStore = create<ThemeState>((set, get) => {
  const initial = getInitialTheme();
  
  // Apply immediately to document element if in browser
  if (typeof window !== 'undefined') {
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.classList.add(`theme-${initial}`);
  }

  return {
    theme: initial,

    toggleTheme: () => {
      const current = get().theme;
      const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('cybertrace_theme', next);
        document.documentElement.classList.remove('theme-light', 'theme-dark');
        document.documentElement.classList.add(`theme-${next}`);
      }
      
      set({ theme: next });
    },

    setTheme: (theme: ThemeMode) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cybertrace_theme', theme);
        document.documentElement.classList.remove('theme-light', 'theme-dark');
        document.documentElement.classList.add(`theme-${theme}`);
      }
      set({ theme });
    },
  };
});
