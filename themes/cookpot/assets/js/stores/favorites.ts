import { writable } from 'svelte/store';

const STORAGE_KEY = 'noonarby_favorites';

function getFavoritesFromStorage(): string[] {
  if (typeof localStorage === 'undefined') {
    return [];
  }
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string');
    }
  } catch (err) {
    console.error('Error parsing favorites storage:', err);
  }
  return [];
}

const { subscribe, set, update } = writable<string[]>(
  getFavoritesFromStorage(),
);

export const favoritesStore = {
  subscribe,
  add(shortId: string) {
    if (!shortId) {
      return;
    }
    update((favs) => {
      if (!favs.includes(shortId)) {
        const next = [...favs, shortId];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        document.dispatchEvent(
          new CustomEvent('favoritesChanged', {
            detail: { shortId, isFavorite: true },
          }),
        );
        return next;
      }
      return favs;
    });
  },
  remove(shortId: string) {
    if (!shortId) {
      return;
    }
    update((favs) => {
      if (favs.includes(shortId)) {
        const next = favs.filter((id) => id !== shortId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        document.dispatchEvent(
          new CustomEvent('favoritesChanged', {
            detail: { shortId, isFavorite: false },
          }),
        );
        return next;
      }
      return favs;
    });
  },
  toggle(shortId: string): boolean {
    if (!shortId) {
      return false;
    }
    let isFav = false;
    update((favs) => {
      if (favs.includes(shortId)) {
        const next = favs.filter((id) => id !== shortId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        isFav = false;
        document.dispatchEvent(
          new CustomEvent('favoritesChanged', {
            detail: { shortId, isFavorite: false },
          }),
        );
        return next;
      } else {
        const next = [...favs, shortId];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        isFav = true;
        document.dispatchEvent(
          new CustomEvent('favoritesChanged', {
            detail: { shortId, isFavorite: true },
          }),
        );
        return next;
      }
    });
    return isFav;
  },
  refresh() {
    set(getFavoritesFromStorage());
  },
};

// Listen to custom event to sync if changed elsewhere
if (typeof document !== 'undefined') {
  document.addEventListener('favoritesChanged', (e: Event) => {
    const customEvent = e as CustomEvent;
    if (!customEvent.detail) {
      return;
    }
    const { shortId, isFavorite } = customEvent.detail;
    update((favs) => {
      const has = favs.includes(shortId);
      if (isFavorite && !has) {
        return [...favs, shortId];
      } else if (!isFavorite && has) {
        return favs.filter((id) => id !== shortId);
      }
      return favs;
    });
  });
}
