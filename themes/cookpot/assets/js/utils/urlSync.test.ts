// @vitest-environment jsdom
import { describe, expect, test, beforeEach, vi } from 'vitest';
import { getUrlParams, updateUrlParams, onUrlChange } from './urlSync';

describe('urlSync utility', () => {
  beforeEach(() => {
    // Reset window.location.search and history state
    window.history.replaceState(null, '', '/');
  });

  test('getUrlParams returns current URLSearchParams', () => {
    window.history.replaceState(null, '', '/?q=chicken&tag=dinner');
    const params = getUrlParams();
    expect(params.get('q')).toBe('chicken');
    expect(params.get('tag')).toBe('dinner');
  });

  test('updateUrlParams merges updates without deleting unrelated params', () => {
    window.history.replaceState(null, '', '/?existing=keepMe');

    updateUrlParams({ newKey: 'newValue' }, 'replace', 0);

    expect(window.location.search).toBe('?existing=keepMe&newKey=newValue');
  });

  test('updateUrlParams deletes param when value is null or empty string', () => {
    window.history.replaceState(null, '', '/?a=1&b=2');

    updateUrlParams({ b: null }, 'replace', 0);

    expect(window.location.search).toBe('?a=1');
  });

  test('notifies registered listeners on URL update', () => {
    const callback = vi.fn();
    const unsubscribe = onUrlChange(callback);

    updateUrlParams({ test: '123' }, 'replace', 0);

    expect(callback).toHaveBeenCalled();
    const params: URLSearchParams = callback.mock.calls[0][0];
    expect(params.get('test')).toBe('123');

    unsubscribe();
  });
});
