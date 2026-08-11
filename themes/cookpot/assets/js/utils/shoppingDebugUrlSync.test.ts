import { describe, expect, test } from 'vitest';
import {
  parseRecipeUrlParams,
  serializeRecipeUrlParams,
} from './shoppingDebugUrlSync';
import type { Recipe } from '../types';

const MOCK_RECIPES: Recipe[] = [
  {
    title: 'Vegetable Bean Chili',
    permalink: '/vegetable-bean-chili/',
    shortId: 'vbc',
    servings: 4,
    ingredients: [],
    date: '2026-01-01',
    times: [],
    summary: 'A hearty chili.',
  },
  {
    title: 'Chorizo Roasted Red Pepper Spinach Gnocchi',
    permalink: '/chorizo-roasted-red-pepper-spinach-gnocchi/',
    shortId: 'crg',
    servings: 4,
    ingredients: [],
    date: '2026-01-01',
    times: [],
    summary: 'Delicious gnocchi.',
  },
  {
    title: 'Slow Cooker Thai Chicken Curry',
    permalink: '/slow-cooker-thai-chicken-curry/',
    shortId: 'tcc',
    servings: 6,
    ingredients: [],
    date: '2026-01-01',
    times: [],
    summary: 'Flavorful Thai curry.',
  },
];

describe('shoppingDebugUrlSync', () => {
  describe('parseRecipeUrlParams', () => {
    test('parses r=all to select all recipes at default yields', () => {
      const result = parseRecipeUrlParams(MOCK_RECIPES, '?r=all');
      expect(result.hasValidParams).toBe(true);
      expect(result.selectedRecipeServings).toEqual({
        '/vegetable-bean-chili/': 4,
        '/chorizo-roasted-red-pepper-spinach-gnocchi/': 4,
        '/slow-cooker-thai-chicken-curry/': 6,
      });
    });

    test('parses dot-delimited shortIds with base and custom servings', () => {
      const result = parseRecipeUrlParams(MOCK_RECIPES, '?r=vbc6.tcc');
      expect(result.hasValidParams).toBe(true);
      expect(result.selectedRecipeServings).toEqual({
        '/vegetable-bean-chili/': 6,
        '/slow-cooker-thai-chicken-curry/': 6,
      });
    });

    test('gracefully skips invalid shortIds and permalinks', () => {
      const result = parseRecipeUrlParams(
        MOCK_RECIPES,
        '?r=vbc.unknown123.vegetable-bean-chili',
      );
      expect(result.hasValidParams).toBe(true);
      expect(result.selectedRecipeServings).toEqual({
        '/vegetable-bean-chili/': 4,
      });
    });

    test('parses optional store layout parameter l', () => {
      const result = parseRecipeUrlParams(MOCK_RECIPES, '?l=standard');
      expect(result.hasValidParams).toBe(true);
      expect(result.layoutId).toBe('standard');
    });

    test('returns empty when no r or l query parameters present', () => {
      const result = parseRecipeUrlParams(MOCK_RECIPES, '');
      expect(result.hasValidParams).toBe(false);
      expect(result.selectedRecipeServings).toEqual({});
      expect(result.layoutId).toBeNull();
    });
  });

  describe('serializeRecipeUrlParams', () => {
    test('compresses to r=all when all catalog recipes are selected at base yields', () => {
      const selected = {
        '/vegetable-bean-chili/': 4,
        '/chorizo-roasted-red-pepper-spinach-gnocchi/': 4,
        '/slow-cooker-thai-chicken-curry/': 6,
      };
      const result = serializeRecipeUrlParams(
        selected,
        MOCK_RECIPES,
        'market-basket-pnh',
      );
      expect(result.r).toBe('all');
      expect(result.l).toBeNull();
    });

    test('serializes specific shortIds and custom portion counts when subset selected', () => {
      const selected = {
        '/vegetable-bean-chili/': 6,
        '/slow-cooker-thai-chicken-curry/': 6,
      };
      const result = serializeRecipeUrlParams(
        selected,
        MOCK_RECIPES,
        'standard',
      );
      expect(result.r).toBe('vbc6.tcc');
      expect(result.l).toBe('standard');
    });

    test('returns r=null when zero recipes are selected', () => {
      const result = serializeRecipeUrlParams(
        {},
        MOCK_RECIPES,
        'market-basket-pnh',
      );
      expect(result.r).toBeNull();
      expect(result.l).toBeNull();
    });
  });
});
