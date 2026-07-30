import { describe, expect, test } from 'vitest';
import { AggregateQuantityStep } from './AggregateQuantityStep';
import type { IngredientGroup } from './GroupCanonicalIngredientsStep';

describe('AggregateQuantityStep', () => {
  const step = new AggregateQuantityStep();

  test('aggregates quantities for same unit ingredients', () => {
    const groups: IngredientGroup[] = [
      {
        key: 'chicken thigh',
        name: 'chicken thigh',
        optional: false,
        ingredients: [
          { item: 'chicken thigh', qty: 2, unit: 'pound' },
          { item: 'chicken thigh', qty: 3, unit: 'pound' },
        ],
      },
    ];

    const result = step.aggregate(groups);
    expect(result).toHaveLength(1);
    expect(result[0].item.item).toBe('chicken thigh');
    expect(result[0].item.qty).toBe(5);
    expect(result[0].item.unit).toBe('pounds');
  });

  test('handles volume units with no package size by recording sizeNote', () => {
    const groups: IngredientGroup[] = [
      {
        key: 'soy sauce',
        name: 'soy sauce',
        optional: false,
        ingredients: [
          { item: 'soy sauce', qty: 2, unit: 'tablespoon' },
          { item: 'soy sauce', qty: 2, unit: 'tablespoon' },
        ],
      },
    ];

    const result = step.aggregate(groups);
    expect(result).toHaveLength(1);
    expect(result[0].item.item).toBe('soy sauce');
    expect(result[0].item.qty).toBe(4);
  });
});
