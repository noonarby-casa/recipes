import { describe, expect, test } from 'vitest';
import { StapleNormalizationStep } from './StapleNormalizationStep';
import type { ShoppingItem } from '../../types';

describe('StapleNormalizationStep', () => {
  const step = new StapleNormalizationStep();

  test('normalizes pantry staples by setting staple flag', () => {
    const items: ShoppingItem[] = [
      { qty: 1, unit: 'tsp', item: 'salt', category: 'spices' },
      { qty: 1, unit: 'lb', item: 'chicken', category: 'meat' },
    ];

    const result = step.process(items);
    expect(result[0].staple).toBe('in-pantry');
    expect(result[1].staple).toBeUndefined();
  });
});
