// @vitest-environment jsdom
import { describe, expect, test, beforeEach } from 'vitest';
import { writable } from 'svelte/store';
import { syncStoreWithUrl } from './urlSyncStore';

interface MockFilterState {
  query: string;
  tag: string;
}

describe('syncStoreWithUrl', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  test('hydrates store state from URL parameters on initialization', () => {
    window.history.replaceState(null, '', '/?q=soup&tag=dinner');

    const store = writable<MockFilterState>({ query: '', tag: '' });

    syncStoreWithUrl(store, {
      paramKeys: ['q', 'tag'],
      serialize: ($s) => ({ q: $s.query || null, tag: $s.tag || null }),
      deserialize: (params) => ({
        query: params.get('q') || '',
        tag: params.get('tag') || '',
      }),
      debounceMs: 0,
    });

    let current!: MockFilterState;
    store.subscribe((val) => {
      current = val;
    })();

    expect(current.query).toBe('soup');
    expect(current.tag).toBe('dinner');
  });

  test('updates URL query parameters when store changes', () => {
    const store = writable<MockFilterState>({ query: '', tag: '' });

    syncStoreWithUrl(store, {
      paramKeys: ['q', 'tag'],
      serialize: ($s) => ({ q: $s.query || null, tag: $s.tag || null }),
      deserialize: (params) => ({
        query: params.get('q') || '',
        tag: params.get('tag') || '',
      }),
      debounceMs: 0,
    });

    store.set({ query: 'tacos', tag: 'mexican' });

    expect(window.location.search).toBe('?q=tacos&tag=mexican');
  });
});
