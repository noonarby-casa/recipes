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

  test('preserves total quantity when quantified and unquantified ingredients are combined', () => {
    const groups: IngredientGroup[] = [
      {
        key: 'heavy cream',
        name: 'heavy cream',
        optional: false,
        ingredients: [
          { item: 'heavy cream', qty: 1.5, unit: 'cup', recipe: 'Recipe A' },
          { item: 'heavy cream', prep: 'for serving', recipe: 'Recipe B' },
        ],
      },
    ];

    const result = step.aggregate(groups);
    expect(result).toHaveLength(1);
    expect(result[0].item.item).toBe('heavy cream');
    expect(result[0].item.qty).toBe(1.5);
    expect(result[0].item.unit).toBe('cups');
    expect(result[0].item.note?.ingredientNotes).toHaveLength(2);
  });

  test('remains quantityless when all ingredients in a group are unquantified', () => {
    const groups: IngredientGroup[] = [
      {
        key: 'salt',
        name: 'salt',
        optional: false,
        ingredients: [
          { item: 'salt', prep: 'to taste', recipe: 'Recipe A' },
          { item: 'salt', prep: 'for pasta water', recipe: 'Recipe B' },
        ],
      },
    ];

    const result = step.aggregate(groups);
    expect(result).toHaveLength(1);
    expect(result[0].item.item).toBe('salt');
    expect(result[0].item.qty).toBeNull();
    expect(result[0].item.unit).toBe('');
    expect(result[0].item.note?.ingredientNotes).toHaveLength(2);
  });

  test('treats unquantified items as zero amount when multiple items are combined', () => {
    const groups: IngredientGroup[] = [
      {
        key: 'soy sauce',
        name: 'soy sauce',
        optional: false,
        ingredients: [
          { item: 'soy sauce', prep: 'for dipping', recipe: 'Recipe A' },
          { item: 'soy sauce', qty: 2, unit: 'tablespoon', recipe: 'Recipe B' },
          { item: 'soy sauce', qty: 1, unit: 'tablespoon', recipe: 'Recipe C' },
          { item: 'soy sauce', prep: 'for serving', recipe: 'Recipe D' },
        ],
      },
    ];

    const result = step.aggregate(groups);
    expect(result).toHaveLength(1);
    expect(result[0].item.item).toBe('soy sauce');
    expect(result[0].item.qty).toBe(3);
    expect(result[0].item.unit).toBe('tablespoons');
    expect(result[0].item.note?.ingredientNotes).toHaveLength(4);
  });
});
