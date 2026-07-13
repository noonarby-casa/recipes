import { describe, expect, test } from 'vitest';
import {
  getAdaptiveUnit,
  formatCookingNumber,
  pluralizeWord,
  formatItemQuantity,
} from './units';

describe('getAdaptiveUnit', () => {
  test('returns empty string if unit is empty', () => {
    expect(getAdaptiveUnit(2, '')).toBe('');
    expect(getAdaptiveUnit(null, '')).toBe('');
  });

  test('returns original unit if quantity is null', () => {
    expect(getAdaptiveUnit(null, 'cup')).toBe('cup');
    expect(getAdaptiveUnit(null, 'cups')).toBe('cups');
  });

  test('pluralizes units when quantity is greater than 1', () => {
    expect(getAdaptiveUnit(2, 'cup')).toBe('cups');
    expect(getAdaptiveUnit(1.5, 'clove')).toBe('cloves');
    expect(getAdaptiveUnit(5, 'ounce')).toBe('ounces');
  });

  test('singularizes units when quantity is 1 or less', () => {
    expect(getAdaptiveUnit(1, 'cups')).toBe('cup');
    expect(getAdaptiveUnit(0.5, 'cloves')).toBe('clove');
    expect(getAdaptiveUnit(1, 'cup')).toBe('cup');
  });

  test('returns original unit if plural/singular mapping is not found', () => {
    expect(getAdaptiveUnit(2, 'dash')).toBe('dash');
    expect(getAdaptiveUnit(1, 'pinch')).toBe('pinch');
  });
});

describe('formatCookingNumber', () => {
  test('returns 0 for non-positive values', () => {
    expect(formatCookingNumber(0)).toBe('0');
    expect(formatCookingNumber(-1.5)).toBe('0');
  });

  test('rounds to whole numbers if close enough', () => {
    expect(formatCookingNumber(1.02)).toBe('1');
    expect(formatCookingNumber(0.98)).toBe('1');
  });

  test('formats standard culinary fractions', () => {
    expect(formatCookingNumber(0.25)).toBe('1/4');
    expect(formatCookingNumber(0.5)).toBe('1/2');
    expect(formatCookingNumber(0.75)).toBe('3/4');
    expect(formatCookingNumber(0.333)).toBe('1/3');
    expect(formatCookingNumber(0.667)).toBe('2/3');
    expect(formatCookingNumber(0.125)).toBe('1/8');
  });

  test('formats mixed fractions', () => {
    expect(formatCookingNumber(1.5)).toBe('1 1/2');
    expect(formatCookingNumber(2.25)).toBe('2 1/4');
    expect(formatCookingNumber(3.75)).toBe('3 3/4');
  });

  test('falls back to decimal formatting for non-standard increments', () => {
    expect(formatCookingNumber(1.56)).toBe('1.56');
    expect(formatCookingNumber(0.44)).toBe('0.44');
    expect(formatCookingNumber(2.81)).toBe('2.81');
  });
});

describe('pluralizeWord', () => {
  test('pluralizes singular words correctly', () => {
    expect(pluralizeWord('tablespoon')).toBe('tablespoons');
    expect(pluralizeWord('lime')).toBe('limes');
    expect(pluralizeWord('head')).toBe('heads');
    expect(pluralizeWord('peach')).toBe('peaches');
    expect(pluralizeWord('zucchini')).toBe('zucchinis');
  });

  test('keeps already pluralized words as-is', () => {
    expect(pluralizeWord('tablespoons')).toBe('tablespoons');
    expect(pluralizeWord('limes')).toBe('limes');
    expect(pluralizeWord('heads')).toBe('heads');
    expect(pluralizeWord('peaches')).toBe('peaches');
    expect(pluralizeWord('zucchinis')).toBe('zucchinis');
  });

  test('handles size prefixes correctly', () => {
    expect(pluralizeWord('large tablespoon')).toBe('large tablespoons');
    expect(pluralizeWord('medium lime')).toBe('medium limes');
    expect(pluralizeWord('small head')).toBe('small heads');
    expect(pluralizeWord('large tablespoons')).toBe('large tablespoons');
    expect(pluralizeWord('medium limes')).toBe('medium limes');
    expect(pluralizeWord('small heads')).toBe('small heads');
  });

  test('handles parenthesized suffixes correctly', () => {
    expect(pluralizeWord('can (15 oz)')).toBe('cans (15 oz)');
    expect(pluralizeWord('cans (15 oz)')).toBe('cans (15 oz)');
  });
});

describe('formatItemQuantity', () => {
  test('does not double pluralize units for qty > 1', () => {
    expect(formatItemQuantity(2, 'tablespoons', 'butter')).toEqual({
      qtyStr: '2 tablespoons',
      itemStr: 'butter',
    });
    expect(formatItemQuantity(2, '', 'lime')).toEqual({
      qtyStr: '2',
      itemStr: 'limes',
    });
    expect(formatItemQuantity(2, '', 'limes')).toEqual({
      qtyStr: '2',
      itemStr: 'limes',
    });
    expect(formatItemQuantity(2, 'heads', 'garlic')).toEqual({
      qtyStr: '2 heads',
      itemStr: 'garlic',
    });
  });
});
