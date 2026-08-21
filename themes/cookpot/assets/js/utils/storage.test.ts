import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { ls, persistedWritable } from './storage';

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

describe('storage utility and persistedWritable', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and reads JSON safely', () => {
    ls.setJson('test-key', { a: 1, b: 'foo' });
    expect(ls.getJson('test-key')).toEqual({ a: 1, b: 'foo' });
  });

  it('saves and reads strings safely', () => {
    ls.setString('str-key', 'bar');
    expect(ls.getString('str-key')).toBe('bar');
  });

  it('creates persistedWritable with JSON default and updates localStorage', () => {
    const store = persistedWritable('test-store', { count: 0 });
    expect(get(store)).toEqual({ count: 0 });

    store.set({ count: 5 });
    expect(get(store)).toEqual({ count: 5 });
    expect(ls.getJson('test-store')).toEqual({ count: 5 });
  });

  it('hydrates persistedWritable from existing localStorage state', () => {
    ls.setJson('existing-store', { count: 42 });
    const store = persistedWritable('existing-store', { count: 0 });
    expect(get(store)).toEqual({ count: 42 });
  });

  it('supports string storageType and custom deserializer', () => {
    ls.setString('string-store', 'larger');
    const store = persistedWritable<'smaller' | 'larger' | 'default'>(
      'string-store',
      'default',
      {
        storageType: 'string',
        deserializer: (val) =>
          val === 'smaller' || val === 'larger' ? val : 'default',
      },
    );
    expect(get(store)).toBe('larger');

    store.set('smaller');
    expect(ls.getString('string-store')).toBe('smaller');
  });
});
