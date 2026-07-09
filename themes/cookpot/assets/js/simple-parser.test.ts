import { describe, expect, test } from 'vitest';
import { parseSimpleQty, parseRawUserInput } from './simple-parser';

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

describe('parseRawUserInput', () => {
  test('parses quantity, unit, and item correctly', () => {
    expect(parseRawUserInput('2 cups flour')).toEqual({
      qty: 2,
      unit: 'cups',
      item: 'flour',
    });
    expect(parseRawUserInput('1/2 lb butter')).toEqual({
      qty: 0.5,
      unit: 'lb',
      item: 'butter',
    });
  });

  test('parses descriptors and preps from comma-separated input', () => {
    expect(
      parseRawUserInput('2.25 pound chicken thighs, skin-on, deboned'),
    ).toEqual({
      qty: 2.25,
      unit: 'pound',
      item: 'chicken thighs',
      desc: 'skin-on',
      prep: 'deboned',
    });

    expect(parseRawUserInput('1 cup baby spinach, fresh, chopped')).toEqual({
      qty: 1,
      unit: 'cup',
      item: 'baby spinach',
      desc: 'fresh',
      prep: 'chopped',
    });

    expect(parseRawUserInput('salt, freshly ground')).toEqual({
      item: 'salt',
      prep: 'freshly ground',
    });

    expect(parseRawUserInput('heavy cream, cold, whipped')).toEqual({
      item: 'heavy cream',
      desc: 'cold',
      prep: 'whipped',
    });
  });
});
