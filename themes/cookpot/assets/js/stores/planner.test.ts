import { describe, expect, test, beforeEach } from 'vitest';
import { plannerStore, getRecentCustomDishes } from './planner';
import { get } from 'svelte/store';

const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] || null,
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: storageMock,
  writable: true,
});

describe('plannerStore custom recipes & recent dishes', () => {
  beforeEach(() => {
    localStorage.clear();
    plannerStore.clearPlan();
  });

  test('addCustomItem creates planned item with baseServings, icon, and ingredients', () => {
    const instanceId = plannerStore.addCustomItem(
      '2026-08-24',
      'Berry Protein Smoothie',
      1,
      'drink',
      [
        { qty: 1, unit: 'scoop', item: 'protein powder' },
        { qty: 1, item: 'banana' },
      ],
    );

    const state = get(plannerStore);
    const item = state.plan.find((p) => p.instanceId === instanceId);

    expect(item).toBeDefined();
    expect(item?.customTitle).toBe('Berry Protein Smoothie');
    expect(item?.baseServings).toBe(1);
    expect(item?.icon).toBe('drink');
    expect(item?.scale).toBe(1.0);
    expect(item?.extraIngredients).toHaveLength(2);
  });

  test('updateBaseServings updates baseServings on planned item', () => {
    const instanceId = plannerStore.addCustomItem('2026-08-24', 'Chili', 4);
    plannerStore.updateBaseServings(instanceId, 6);

    const state = get(plannerStore);
    const item = state.plan.find((p) => p.instanceId === instanceId);
    expect(item?.baseServings).toBe(6);
  });

  test('getRecentCustomDishes returns deduplicated recent custom dishes sorted by date', () => {
    plannerStore.addCustomItem('2026-08-20', 'Pancakes', 4, 'breakfast');
    plannerStore.addCustomItem('2026-08-22', 'Tacos', 4, 'tacos');
    plannerStore.addCustomItem('2026-08-24', 'Pancakes', 2, 'breakfast'); // Newer pancakes

    const recents = getRecentCustomDishes(5);
    expect(recents).toHaveLength(2);
    expect(recents[0].title).toBe('Pancakes');
    expect(recents[0].baseServings).toBe(2);
    expect(recents[1].title).toBe('Tacos');
  });
});
