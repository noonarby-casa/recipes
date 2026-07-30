import { describe, expect, test } from 'vitest';
import { PluralizationStep } from './PluralizationStep';

describe('PluralizationStep', () => {
  const step = new PluralizationStep();

  test('formats items and units with pluralization for quantity > 1', () => {
    const items = [
      { qty: 2, unit: 'pound', item: 'chicken thigh' },
      { qty: 1, unit: 'pound', item: 'chicken thigh' },
    ];

    const result = step.process(items);
    expect(result[0].formattedItem).toBe('chicken thighs');
    expect(result[0].formattedUnit).toBe('pounds');

    expect(result[1].formattedItem).toBe('chicken thigh');
    expect(result[1].formattedUnit).toBe('pound');
  });
});
