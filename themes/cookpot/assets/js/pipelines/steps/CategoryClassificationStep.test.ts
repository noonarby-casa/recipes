import { describe, expect, test } from 'vitest';
import { CategoryClassificationStep } from './CategoryClassificationStep';

describe('CategoryClassificationStep', () => {
  const step = new CategoryClassificationStep();

  test('assigns categories based on item keywords and rules', () => {
    const items = [{ item: 'carrot' }, { item: 'salmon' }, { item: 'milk' }];

    const result = step.process(items);
    expect(result[0].category).toBe('fresh-produce');
    expect(result[1].category).toBe('seafood');
    expect(result[2].category).toBe('milk-cream');
  });
});
