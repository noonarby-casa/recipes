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

function dispatchFavoritesChanged(shortId: string, isFavorite: boolean) {
  if (typeof document !== 'undefined') {
    document.dispatchEvent(
      new CustomEvent('favoritesChanged', {
        detail: { shortId, isFavorite },
      }),
    );
  }
}

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
        dispatchFavoritesChanged(shortId, true);
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
        dispatchFavoritesChanged(shortId, false);
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
        dispatchFavoritesChanged(shortId, false);
        return next;
      } else {
        const next = [...favs, shortId];
        ls.setJson(LOCALSTORAGE_KEY, next);
        isFav = true;
        dispatchFavoritesChanged(shortId, true);
        return next;
      }
    });
    return isFav;
  },
  addAll(shortIds: string[]): string[] {
    const validIds = shortIds.filter(
      (id) => typeof id === 'string' && id.length > 0,
    );
    if (validIds.length === 0) {
      return [];
    }
    let newlyAdded: string[] = [];
    update((favs) => {
      newlyAdded = validIds.filter((id) => !favs.includes(id));
      if (newlyAdded.length === 0) {
        return favs;
      }
      const next = [...favs, ...newlyAdded];
      ls.setJson(LOCALSTORAGE_KEY, next);
      newlyAdded.forEach((shortId) => {
        dispatchFavoritesChanged(shortId, true);
      });
      return next;
    });
    return newlyAdded;
  },
  removeAll(shortIds: string[]): void {
    const validIds = new Set(
      shortIds.filter((id) => typeof id === 'string' && id.length > 0),
    );
    if (validIds.size === 0) {
      return;
    }
    update((favs) => {
      const removed = favs.filter((id) => validIds.has(id));
      if (removed.length === 0) {
        return favs;
      }
      const next = favs.filter((id) => !validIds.has(id));
      ls.setJson(LOCALSTORAGE_KEY, next);
      removed.forEach((shortId) => {
        dispatchFavoritesChanged(shortId, false);
      });
      return next;
    });
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
