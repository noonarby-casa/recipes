import { describe, expect, test } from 'vitest';
import { parseSimpleQty } from './simple-parser';

describe('parseSimpleQty', () => {
  test('parses simple integers', () => {
    expect(parseSimpleQty('2 cups')).toEqual({ qty: 2, unit: 'cups' });
    expect(parseSimpleQty('10g')).toEqual({ qty: 10, unit: 'g' });
  });

  test('parses decimals', () => {
    expect(parseSimpleQty('1.5 liters')).toEqual({ qty: 1.5, unit: 'liters' });
    expect(parseSimpleQty('0.25 oz')).toEqual({ qty: 0.25, unit: 'oz' });
  });

  test('parses simple fractions', () => {
    expect(parseSimpleQty('1/2 cup')).toEqual({ qty: 0.5, unit: 'cup' });
    expect(parseSimpleQty('3/4 tsp')).toEqual({ qty: 0.75, unit: 'tsp' });
  });

  test('parses mixed numbers with fractions', () => {
    expect(parseSimpleQty('1 1/2 cups')).toEqual({ qty: 1.5, unit: 'cups' });
    expect(parseSimpleQty('2 3/4 tablespoons')).toEqual({
      qty: 2.75,
      unit: 'tablespoons',
    });
  });

  test('parses ranges (returning the upper bound as maximum)', () => {
    expect(parseSimpleQty('2-3 cloves')).toEqual({ qty: 3, unit: 'cloves' });
    expect(parseSimpleQty('1 to 2 teaspoons')).toEqual({
      qty: 2,
      unit: 'teaspoons',
    });
    expect(parseSimpleQty('4–5 grams')).toEqual({ qty: 5, unit: 'grams' });
  });

  test('handles no-unit quantities', () => {
    expect(parseSimpleQty('3')).toEqual({ qty: 3, unit: '' });
  });

  test('handles invalid inputs gracefully', () => {
    expect(parseSimpleQty('about a handful')).toEqual({ qty: null, unit: '' });
    expect(parseSimpleQty('')).toEqual({ qty: null, unit: '' });
  });
});
