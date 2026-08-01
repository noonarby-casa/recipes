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

  getStorageUsage(): {
    bytes: number;
    kb: number;
    mb: number;
    percent: number;
  } {
    if (typeof localStorage === 'undefined') {
      return { bytes: 0, kb: 0, mb: 0, percent: 0 };
    }
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key);
        total += (key.length + (val ? val.length : 0)) * 2;
      }
    }
    const maxBytes = 5 * 1024 * 1024;
    return {
      bytes: total,
      kb: Math.round(total / 1024),
      mb: parseFloat((total / (1024 * 1024)).toFixed(2)),
      percent: Math.min(100, Math.round((total / maxBytes) * 100)),
    };
  },

  downloadJson(filename: string, data: unknown): void {
    if (typeof document === 'undefined') {
      return;
    }
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
