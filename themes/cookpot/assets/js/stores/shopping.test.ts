import { describe, it, expect, beforeEach } from 'vitest';
import {
  getIngredientKey,
  isItemChecked,
  shoppingCheckedStore,
  scaleIngredient,
} from './shopping';
import { ls } from '../utils/storage';
import { get } from 'svelte/store';

describe('shopping store & helpers', () => {
  beforeEach(() => {
    shoppingCheckedStore.clearChecked();
  });

  describe('getIngredientKey', () => {
    it('normalizes canonical item name by trimming, lowercasing, and collapsing whitespace', () => {
      expect(getIngredientKey('  Extra Virgin   Olive Oil ')).toBe(
        'extra virgin olive oil',
      );
      expect(getIngredientKey('Kosher Salt')).toBe('kosher salt');
      expect(getIngredientKey('')).toBe('');
    });
  });

  describe('isItemChecked', () => {
    it('defaults to true for pantry staples when no override is present', () => {
      expect(isItemChecked('olive oil', true, {})).toBe(true);
    });

    it('defaults to false for non-staple items when no override is present', () => {
      expect(isItemChecked('chicken breast', false, {})).toBe(false);
    });

    it('respects overrides in states map regardless of staple flag', () => {
      // Staple marked depleted / need to buy
      expect(isItemChecked('olive oil', true, { 'olive oil': false })).toBe(
        false,
      );

      // Non-staple marked on-hand / bought
      expect(
        isItemChecked('chicken breast', false, { 'chicken breast': true }),
      ).toBe(true);
    });
  });

  describe('shoppingCheckedStore', () => {
    it('sets and toggles checked states properly', () => {
      const key = getIngredientKey('Olive Oil');

      // Default staple toggle (true -> false)
      shoppingCheckedStore.toggle(key, true);
      expect(get(shoppingCheckedStore)[key]).toBe(false);

      // Explicit setChecked
      shoppingCheckedStore.setChecked(key, true);
      expect(get(shoppingCheckedStore)[key]).toBe(true);

      // Toggle again (true -> false)
      shoppingCheckedStore.toggle(key, true);
      expect(get(shoppingCheckedStore)[key]).toBe(false);
    });

    it('prunes orphan keys that are no longer part of active shopping list', () => {
      shoppingCheckedStore.setChecked('olive oil', true);
      shoppingCheckedStore.setChecked('paprika', false);
      shoppingCheckedStore.setChecked('stale ingredient', true);

      const validKeys = new Set(['olive oil', 'paprika']);
      shoppingCheckedStore.pruneOrphans(validKeys);

      const state = get(shoppingCheckedStore);
      expect(state['olive oil']).toBe(true);
      expect(state['paprika']).toBe(false);
      expect(state['stale ingredient']).toBeUndefined();
    });

    it('clears all checked states and removes storage key', () => {
      shoppingCheckedStore.setChecked('olive oil', true);
      shoppingCheckedStore.clearChecked();

      expect(get(shoppingCheckedStore)).toEqual({});
      expect(ls.getJson('noonarby-shopping-checked-items-v3')).toBeNull();
    });
  });

  describe('scaleIngredient', () => {
    it('scales scalar qty and alt qty correctly', () => {
      const scaled = scaleIngredient(
        {
          item: 'tofu',
          qty: 2,
          unit: 'blocks',
          alt: { item: 'tempeh', qty: 1, unit: 'pack' },
        },
        1.5,
      );

      expect(scaled.qty).toBe(3);
      expect(scaled.alt?.qty).toBe(1.5);
    });

    it('scales tuple qty correctly', () => {
      const scaled = scaleIngredient(
        {
          item: 'garlic',
          qty: [2, 4],
          unit: 'cloves',
        },
        2,
      );

      expect(scaled.qty).toEqual([4, 8]);
    });
  });
});
