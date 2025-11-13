import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'auto';

interface ThemeState {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// Detect system preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Calculate effective theme based on preference and system
const calculateEffectiveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'auto') {
    return getSystemTheme();
  }
  return theme;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'auto',
      effectiveTheme: calculateEffectiveTheme('auto'),

      setTheme: (theme: Theme) => {
        const effectiveTheme = calculateEffectiveTheme(theme);
        set({ theme, effectiveTheme });

        // Apply theme to document
        document.documentElement.setAttribute('data-theme', effectiveTheme);
        document.documentElement.style.colorScheme = effectiveTheme;
      },

      toggleTheme: () => {
        const currentEffective = get().effectiveTheme;
        const newTheme = currentEffective === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },
    }),
    {
      name: 'meteo-theme-storage',
      onRehydrateStorage: () => (state) => {
        // Apply theme on rehydration
        if (state) {
          const effectiveTheme = calculateEffectiveTheme(state.theme);
          state.effectiveTheme = effectiveTheme;
          document.documentElement.setAttribute('data-theme', effectiveTheme);
          document.documentElement.style.colorScheme = effectiveTheme;
        }
      },
    }
  )
);

// Listen to system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const store = useThemeStore.getState();
    if (store.theme === 'auto') {
      const effectiveTheme = e.matches ? 'dark' : 'light';
      useThemeStore.setState({ effectiveTheme });
      document.documentElement.setAttribute('data-theme', effectiveTheme);
      document.documentElement.style.colorScheme = effectiveTheme;
    }
  });
}
