export type ThemeOption = 'light' | 'dark' | 'system';

export function getThemePreference(): ThemeOption {
  if (typeof localStorage === 'undefined') {
    return 'system';
  }
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    return saved;
  }
  return 'system';
}

function applyTheme(theme: ThemeOption): void {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark-mode');
  } else if (theme === 'light') {
    document.documentElement.classList.remove('dark-mode');
  } else {
    const isDark =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark-mode', isDark);
  }
}

export function setThemePreference(theme: ThemeOption): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('theme', theme);
  }
  applyTheme(theme);
}

export function initDarkMode(): void {
  if (typeof window === 'undefined') {
    return;
  }
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleMediaChange = (e: MediaQueryListEvent) => {
    if (getThemePreference() === 'system') {
      document.documentElement.classList.toggle('dark-mode', e.matches);
    }
  };
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleMediaChange);
  }
}
