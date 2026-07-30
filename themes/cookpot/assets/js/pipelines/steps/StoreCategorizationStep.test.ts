import { describe, expect, test } from 'vitest';
import { StoreCategorizationStep } from './StoreCategorizationStep';
import type { ShoppingItem } from '../../types';

describe('StoreCategorizationStep', () => {
  const step = new StoreCategorizationStep();

  test('categorizes items into store layout section ids', () => {
    const items: ShoppingItem[] = [
      { qty: 1, unit: '', item: 'carrot', category: 'fresh-produce' },
    ];

    const result = step.process(items);
    expect(result[0].category).toBe('produce');
  });
});
