import { describe, expect, test } from 'vitest';
import { StoreCategorizationStep } from './StoreCategorizationStep';
import type { ShoppingItem } from '../../types';

describe('StoreCategorizationStep', () => {
  const step = new StoreCategorizationStep();

  test('categorizes items into market-basket-pnh default store layout section ids', () => {
    const items: ShoppingItem[] = [
      { qty: 1, unit: '', item: 'carrot', category: 'fresh-produce' },
      { qty: 1, unit: '', item: 'milk', category: 'milk-cream' },
      { qty: 1, unit: '', item: 'pasta', category: 'pasta-grains' },
      { qty: 1, unit: '', item: 'water', category: 'beverages' },
    ];

    const result = step.process(items);
    expect(result[0].category).toBe('aisle-16');
    expect(result[1].category).toBe('left-wall');
    expect(result[2].category).toBe('aisle-4');
    expect(result[3].category).toBe('aisle-12');
  });

  test('categorizes items into specific layout when layoutId is provided', () => {
    const standardStep = new StoreCategorizationStep('standard');
    const items: ShoppingItem[] = [
      { qty: 1, unit: '', item: 'carrot', category: 'fresh-produce' },
    ];

    const result = standardStep.process(items);
    expect(result[0].category).toBe('produce');
  });
});
