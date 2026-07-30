import { describe, it, expect } from 'vitest';
import {
  formatShoppingListExport,
  filterExportItems,
  type ExportItem,
} from './shoppingExportPipeline';

describe('export-formatter', () => {
  const sampleItems: ExportItem[] = [
    {
      qty: 2,
      unit: 'cup',
      item: 'flour',
      category: 'baking',
      isChecked: false,
    },
    {
      qty: 1,
      unit: 'can',
      item: 'black beans',
      category: 'canned-goods',
      isChecked: true,
    },
    {
      qty: 0.5,
      unit: 'tsp',
      item: 'salt',
      category: 'baking',
      isChecked: false,
      isOptional: true,
    },
  ];

  it('filters items correctly based on ItemFilter mode', () => {
    const unchecked = filterExportItems(sampleItems, 'unchecked');
    expect(unchecked).toHaveLength(2);
    expect(unchecked.map((i) => i.item)).toEqual(['flour', 'salt']);

    const checked = filterExportItems(sampleItems, 'checked');
    expect(checked).toHaveLength(1);
    expect(checked[0].item).toBe('black beans');

    const all = filterExportItems(sampleItems, 'all');
    expect(all).toHaveLength(3);
  });

  it('formats Google Keep plain text correctly', () => {
    const text = formatShoppingListExport(
      sampleItems,
      'Test Recipe',
      'google-keep',
      'unchecked',
    );
    expect(text).toBe('2 cups flour\n1/2 tsp salt (optional)');
  });

  it('formats Markdown checklist correctly', () => {
    const text = formatShoppingListExport(
      sampleItems,
      'Test Recipe',
      'markdown',
      'all',
    );
    expect(text).toContain('## SHOPPING LIST: Test Recipe');
    expect(text).toContain('### Need to Buy');
    expect(text).toContain('- [ ] 2 cups flour');
    expect(text).toContain('- [x] 1 can black beans');
    expect(text).toContain('### Optional');
    expect(text).toContain('- [ ] 1/2 tsp salt');
  });
});
