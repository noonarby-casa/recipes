import { describe, expect, test } from 'vitest';
import { scaleQuantityText } from './scaler';

describe('scaleQuantityText', () => {
  test('scales simple quantities and maintains unit', () => {
    expect(scaleQuantityText('2', 'cups', 2)).toBe('4 cups');
    expect(scaleQuantityText('10', 'grams', 0.5)).toBe('5 grams');
  });

  test('pluralizes units appropriately when scaling up', () => {
    expect(scaleQuantityText('1', 'cup', 2)).toBe('2 cups');
    expect(scaleQuantityText('1', 'clove', 3)).toBe('3 cloves');
  });

  test('singularizes units appropriately when scaling down', () => {
    expect(scaleQuantityText('2', 'cups', 0.5)).toBe('1 cup');
    expect(scaleQuantityText('3', 'cloves', 0.33)).toBe('1 clove');
  });

  test('scales ranges and pluralizes based on the upper bound', () => {
    expect(scaleQuantityText('2-3', 'cloves', 2)).toBe('4-6 cloves');
    expect(scaleQuantityText('2-4', 'cups', 0.25)).toBe('1/2-1 cup');
    expect(scaleQuantityText('1,2', 'cups', 2)).toBe('2-4 cups');
  });

  test('handles cases with no numeric value gracefully', () => {
    expect(scaleQuantityText('handful', 'spinach', 2)).toBe('spinach');
    expect(scaleQuantityText('', 'to taste', 2)).toBe('to taste');
  });
});
