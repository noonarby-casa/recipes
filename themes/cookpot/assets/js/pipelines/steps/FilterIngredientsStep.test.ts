import { describe, expect, test } from 'vitest';
import { FilterIngredientsStep } from './FilterIngredientsStep';

describe('FilterIngredientsStep', () => {
  test('filters elements according to predicate', () => {
    const step = new FilterIngredientsStep<{ val: number }>((i) => i.val > 5);
    const result = step.process([{ val: 2 }, { val: 8 }, { val: 10 }]);

    expect(result).toEqual([{ val: 8 }, { val: 10 }]);
  });
});
