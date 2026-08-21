import { describe, it, expect } from 'vitest';
import { findItemRule, getCanonicalName, getItemCanonicalInfo } from './rules';

describe('rules utils', () => {
  it('finds item rule by canonical name, singular, plural, and aliases', () => {
    expect(findItemRule('garlic')?.canonicalName).toBe('garlic');
    expect(findItemRule('garlic clove')?.canonicalName).toBe('garlic');
    expect(findItemRule('scallion')?.canonicalName).toBe('scallion');
    expect(findItemRule('scallions')?.canonicalName).toBe('scallion');
  });

  it('resolves canonical name correctly with fallback', () => {
    expect(getCanonicalName('scallions')).toBe('scallion');
    expect(getCanonicalName('nonexistent ingredient xyz')).toBe(
      'nonexistent ingredient xyz',
    );
  });

  it('returns canonical grouping info correctly', () => {
    const info = getItemCanonicalInfo('scallions');
    expect(info.key).toBe('scallion');
    expect(info.name).toBe('scallion');

    const fallbackInfo = getItemCanonicalInfo('Mystery Herb');
    expect(fallbackInfo.key).toBe('mystery herb');
    expect(fallbackInfo.name).toBe('Mystery Herb');
  });
});
