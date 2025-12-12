import { ref } from 'vue';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'app-weather-theme';

// Get initial theme from localStorage or system preference (fallback light)
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  if (stored) return stored;

  // Respeita a preferência do sistema quando não há valor salvo
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

const currentTheme = ref<Theme>(getInitialTheme());

// Apply theme to document
const applyTheme = (theme: Theme) => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
};

// Initialize theme on load
if (typeof document !== 'undefined') {
  applyTheme(currentTheme.value);
}

export const useTheme = () => {
  const setTheme = (theme: Theme) => {
    currentTheme.value = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyTheme(theme);
  };

  const toggleTheme = () => {
    const newTheme = currentTheme.value === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const isDark = () => currentTheme.value === 'dark';

  return {
    theme: currentTheme,
    setTheme,
    toggleTheme,
    isDark,
  };
};
