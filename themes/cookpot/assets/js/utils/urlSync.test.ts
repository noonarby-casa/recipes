// @vitest-environment jsdom
import { describe, expect, test, beforeEach, vi } from 'vitest';
import {
  getUrlParams,
  updateUrlParams,
  onUrlChange,
  parseRecipePortionToken,
  permalinkToCode,
  codeToPermalink,
} from './urlSync';

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

  test('parseRecipePortionToken parses code and portions correctly', () => {
    expect(parseRecipePortionToken('tacos2')).toEqual({
      code: 'tacos',
      portions: 2,
    });
    expect(parseRecipePortionToken('pasta12')).toEqual({
      code: 'pasta',
      portions: 12,
    });
    expect(parseRecipePortionToken('c4')).toEqual({
      code: 'c',
      portions: 4,
    });
    expect(parseRecipePortionToken('chicken-soup')).toEqual({
      code: 'chicken-soup',
      portions: null,
    });
  });

  test('permalinkToCode and codeToPermalink map recipes correctly', () => {
    const recipes = [
      { permalink: '/recipes/chicken-tacos/', shortId: 'rec1' },
      { permalink: '/recipes/pasta/' },
    ];

    expect(permalinkToCode('/recipes/chicken-tacos/', recipes)).toBe('rec1');
    expect(permalinkToCode('/recipes/pasta/', recipes)).toBe('/recipes/pasta/');

    expect(codeToPermalink('rec1', recipes)).toBe('/recipes/chicken-tacos/');
    expect(codeToPermalink('unknown', recipes)).toBe('/unknown/');
  });
});
