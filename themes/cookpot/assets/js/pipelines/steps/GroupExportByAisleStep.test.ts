import { describe, expect, test } from 'vitest';
import { GroupExportByAisleStep } from './GroupExportByAisleStep';
import type { ExportItem } from '../shoppingExportPipeline';
import { STORE_LAYOUTS } from '../../data/store-sections';

describe('GroupExportByAisleStep', () => {
  const step = new GroupExportByAisleStep(
    STORE_LAYOUTS.find((l) => l.id === 'standard'),
  );

  test('sorts items by aisle section order', () => {
    const items: ExportItem[] = [
      {
        qty: 1,
        unit: 'lb',
        item: 'salmon',
        category: 'seafood',
        isChecked: false,
      },
      {
        qty: 2,
        unit: '',
        item: 'carrot',
        category: 'fresh-produce',
        isChecked: false,
      },
    ];

    const result = step.process(items);
    expect(result[0].item).toBe('carrot');
    expect(result[1].item).toBe('salmon');
  });
});
