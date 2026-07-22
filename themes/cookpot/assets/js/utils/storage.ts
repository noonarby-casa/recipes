/**
 * Safe localStorage helpers that guard against SSR / non-browser environments
 * and swallow JSON parse/stringify errors with a console.error.
 *
 * All stores should use these instead of inlining `typeof localStorage`
 * checks and try/catch blocks.
 */
export const ls = {
  getJson<T>(key: string): T | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (e) {
      console.error(`Error reading "${key}" from localStorage:`, e);
      return null;
    }
  },

  setJson(key: string, value: unknown): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing "${key}" to localStorage:`, e);
    }
  },

  getString(key: string): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem(key);
  },

  setString(key: string, value: string): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(key, value);
  },

  remove(key: string): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.removeItem(key);
  },

  has(key: string): boolean {
    if (typeof localStorage === 'undefined') {
      return false;
    }
    return localStorage.getItem(key) !== null;
  },
};
