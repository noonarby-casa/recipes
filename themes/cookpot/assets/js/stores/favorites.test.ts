import { beforeEach, describe, expect, test } from 'vitest';
import { get } from 'svelte/store';
import { favoritesStore } from './favorites';

const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] || null,
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: storageMock,
  writable: true,
});

describe('favoritesStore', () => {
  beforeEach(() => {
    localStorage.clear();
    favoritesStore.refresh();
  });

  test('adds and removes a recipe favorite', () => {
    favoritesStore.add('rec1');
    expect(get(favoritesStore)).toContain('rec1');

    favoritesStore.remove('rec1');
    expect(get(favoritesStore)).not.toContain('rec1');
  });

  test('toggles favorite status', () => {
    const isFavNow = favoritesStore.toggle('rec2');
    expect(isFavNow).toBe(true);
    expect(get(favoritesStore)).toContain('rec2');

    const isFavAfter = favoritesStore.toggle('rec2');
    expect(isFavAfter).toBe(false);
    expect(get(favoritesStore)).not.toContain('rec2');
  });

  test('addAll atomically adds multiple IDs and returns only newly added ones', () => {
    favoritesStore.add('rec1');

    const added = favoritesStore.addAll(['rec1', 'rec2', 'rec3']);
    expect(added).toEqual(['rec2', 'rec3']);
    expect(get(favoritesStore)).toEqual(['rec1', 'rec2', 'rec3']);

    // Calling addAll again when all exist returns empty array
    const addedAgain = favoritesStore.addAll(['rec2', 'rec3']);
    expect(addedAgain).toEqual([]);
  });

  test('removeAll atomically removes specified IDs', () => {
    favoritesStore.addAll(['rec1', 'rec2', 'rec3', 'rec4']);
    expect(get(favoritesStore)).toHaveLength(4);

    favoritesStore.removeAll(['rec2', 'rec4']);
    expect(get(favoritesStore)).toEqual(['rec1', 'rec3']);
  });
});
