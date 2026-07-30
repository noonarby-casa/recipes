import { describe, expect, test } from 'vitest';
import { GroupCanonicalIngredientsStep } from './GroupCanonicalIngredientsStep';

describe('GroupCanonicalIngredientsStep', () => {
  const step = new GroupCanonicalIngredientsStep();

  test('groups raw ingredients by canonical item key', () => {
    const ingredients = [
      { item: 'yellow onion', qty: 1, unit: 'small' },
      { item: 'red onion', qty: 1, unit: 'large' },
      { item: 'carrot', qty: 2 },
    ];

    const groups = step.group(ingredients);
    expect(groups).toHaveLength(2);

    const onionGroup = groups.find((g) => g.key === 'onion');
    expect(onionGroup).toBeDefined();
    expect(onionGroup?.ingredients).toHaveLength(2);

    const carrotGroup = groups.find((g) => g.key === 'carrot');
    expect(carrotGroup).toBeDefined();
    expect(carrotGroup?.ingredients).toHaveLength(1);
  });
});
