import { describe, expect, test } from 'vitest';
import { PackageMatcherStep } from './PackageMatcherStep';
import type { ShoppingItem, StoreLayout } from '../../types';

describe('PackageMatcherStep', () => {
  const layout: StoreLayout = {
    id: 'test',
    name: 'Test Store',
    sections: [],
    itemSizes: {
      'potato gnocchi': [[1, '17.5-oz package']],
    },
  };

  const matcher = new PackageMatcherStep(layout);

  test('matches layout package sizes and calculates required packages with sizeNote', () => {
    const items: ShoppingItem[] = [
      { qty: 16, unit: 'ounce', item: 'potato gnocchi', category: 'pasta' },
    ];

    const result = matcher.process(items);
    expect(result).toHaveLength(1);
    expect(result[0].qty).toBe(1);
    expect(result[0].unit).toBe('17.5-oz package');
    expect(result[0].note?.sizeNote).toBe('16 oz needed');
  });

  test('passes items with null quantity through unchanged', () => {
    const items: ShoppingItem[] = [
      { qty: null, unit: '', item: 'soy sauce', category: 'condiments' },
    ];

    const result = matcher.process(items);
    expect(result[0]).toEqual(items[0]);
  });

  test('matches egg quantities to egg carton package sizes', () => {
    const eggLayout: StoreLayout = {
      id: 'egg-test',
      name: 'Egg Store',
      sections: [],
      itemSizes: {
        egg: [
          [1, 'carton (6 eggs)'],
          [1, 'carton (12 eggs)'],
          [1, 'carton (18 eggs)'],
        ],
      },
    };
    const eggMatcher = new PackageMatcherStep(eggLayout);
    const items: ShoppingItem[] = [
      { qty: 37, unit: 'egg', item: 'egg', category: 'eggs' },
    ];

    const result = eggMatcher.process(items);
    expect(result).toHaveLength(1);
    expect(result[0].qty).toBe(3);
    expect(result[0].unit).toBe('cartons (18 eggs)');
    expect(result[0].note?.sizeNote).toBe('37 eggs needed');
  });
});
