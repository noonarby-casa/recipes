import { describe, expect, test } from 'vitest';
import { FilterExportItemsStep } from './FilterExportItemsStep';
import type { ExportItem } from '../shoppingExportPipeline';

describe('FilterExportItemsStep', () => {
  const itemChecked: ExportItem = {
    qty: 1,
    unit: 'lb',
    item: 'chicken',
    category: 'meat',
    isChecked: true,
  };
  const itemUnchecked: ExportItem = {
    qty: 1,
    unit: 'tsp',
    item: 'salt',
    category: 'spices',
    isChecked: false,
  };

  test('filters for unchecked items when filterMode is unchecked', () => {
    const step = new FilterExportItemsStep('unchecked');
    const result = step.process([itemChecked, itemUnchecked]);

    expect(result).toHaveLength(1);
    expect(result[0].item).toBe('salt');
  });

  test('filters for checked items when filterMode is checked', () => {
    const step = new FilterExportItemsStep('checked');
    const result = step.process([itemChecked, itemUnchecked]);

    expect(result).toHaveLength(1);
    expect(result[0].item).toBe('chicken');
  });

  test('returns all items when filterMode is all', () => {
    const step = new FilterExportItemsStep('all');
    const result = step.process([itemChecked, itemUnchecked]);

    expect(result).toHaveLength(2);
  });
});
