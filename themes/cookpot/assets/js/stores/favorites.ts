import { writable } from 'svelte/store';
import { ls } from '../utils/storage';

const LOCALSTORAGE_KEY = 'noonarby-favorite-recipes';

function getFavoritesFromStorage(): string[] {
  const parsed = ls.getJson<unknown[]>(LOCALSTORAGE_KEY);
  if (Array.isArray(parsed)) {
    return parsed.filter((item): item is string => typeof item === 'string');
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
        ls.setJson(LOCALSTORAGE_KEY, next);
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
        ls.setJson(LOCALSTORAGE_KEY, next);
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
        ls.setJson(LOCALSTORAGE_KEY, next);
        isFav = false;
        document.dispatchEvent(
          new CustomEvent('favoritesChanged', {
            detail: { shortId, isFavorite: false },
          }),
        );
        return next;
      } else {
        const next = [...favs, shortId];
        ls.setJson(LOCALSTORAGE_KEY, next);
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
