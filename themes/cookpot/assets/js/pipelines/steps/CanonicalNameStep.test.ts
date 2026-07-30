import { describe, expect, test } from 'vitest';
import { CanonicalNameStep } from './CanonicalNameStep';

describe('CanonicalNameStep', () => {
  const step = new CanonicalNameStep();

  test('canonicalizes raw ingredient item names using ITEM_RULES', () => {
    const items = [{ item: 'yellow onion' }, { item: 'kosher salt' }];

    const result = step.process(items);
    expect(result[0].canonicalName).toBe('onion');
    expect(result[1].canonicalName).toBe('salt');
  });

  test('preserves item name if no canonical rule exists', () => {
    const items = [{ item: 'exotic dragonfruit' }];
    const result = step.process(items);
    expect(result[0].canonicalName).toBe('exotic dragonfruit');
  });
});
