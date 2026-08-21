import { describe, it, expect } from 'vitest';
import { ICON_DEFINITIONS, type IconName } from './icons';

describe('ICON_DEFINITIONS dictionary', () => {
  it('contains definitions for all standard icons', () => {
    const requiredIcons: IconName[] = [
      'bbq',
      'book',
      'bowl',
      'bread',
      'breakfast',
      'calendar',
      'chef-hat',
      'clock',
      'coffee',
      'dessert',
      'dice',
      'drink',
      'edit',
      'filter',
      'heart',
      'minus',
      'pasta',
      'pause',
      'pizza',
      'play',
      'plus',
      'reset',
      'rice',
      'salad',
      'sandwich',
      'seafood',
      'search',
      'shopping-cart',
      'snack',
      'swap',
      'tacos',
      'timer',
      'trash',
      'user',
      'utensils',
      'x',
    ];

    expect(Object.keys(ICON_DEFINITIONS)).toHaveLength(36);
    requiredIcons.forEach((name) => {
      expect(ICON_DEFINITIONS[name]).toBeDefined();
      expect(ICON_DEFINITIONS[name].length).toBeGreaterThan(0);
    });
  });
});
