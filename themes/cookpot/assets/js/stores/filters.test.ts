// @vitest-environment jsdom
import { describe, expect, test } from 'vitest';
import { filterRecipes } from './filters';
import type { Recipe, FiltersState } from '../types';

describe('filterRecipes with favoritesOnly', () => {
  const sampleRecipes: Recipe[] = [
    {
      title: 'Tacos',
      permalink: '/recipes/tacos/',
      shortId: 'tacos-id',
      tags: ['dinner', 'mexican'],
      recipeSource: 'Noonarby',
      date: '2026-01-01',
      times: [],
      ingredients: [],
      servings: 4,
      summary: 'Tasty tacos',
    },
    {
      title: 'Pasta Carbonara',
      permalink: '/recipes/pasta/',
      shortId: 'pasta-id',
      tags: ['dinner', 'italian'],
      recipeSource: 'Grandma',
      date: '2026-01-01',
      times: [],
      ingredients: [],
      servings: 4,
      summary: 'Classic pasta',
    },
    {
      title: 'Pancakes',
      permalink: '/recipes/pancakes/',
      shortId: 'pancakes-id',
      tags: ['breakfast'],
      recipeSource: 'Noonarby',
      date: '2026-01-01',
      times: [],
      ingredients: [],
      servings: 4,
      summary: 'Fluffy pancakes',
    },
  ];

  const defaultFilters: FiltersState = {
    searchQuery: '',
    favoritesOnly: false,
    includedTags: [],
    excludedTags: [],
    includedSources: [],
    excludedSources: [],
  };

  test('returns all matching recipes when favoritesOnly is false', () => {
    const results = filterRecipes(sampleRecipes, defaultFilters, ['tacos-id']);
    expect(results).toHaveLength(3);
  });

  test('filters down to only favorited recipes when favoritesOnly is true', () => {
    const filters = { ...defaultFilters, favoritesOnly: true };
    const results = filterRecipes(sampleRecipes, filters, ['tacos-id']);
    expect(results).toHaveLength(1);
    expect(results[0].shortId).toBe('tacos-id');
  });

  test('combines favoritesOnly filter with search query', () => {
    const filters = {
      ...defaultFilters,
      favoritesOnly: true,
      searchQuery: 'Pasta',
    };
    const favorites = ['tacos-id', 'pasta-id'];
    const results = filterRecipes(sampleRecipes, filters, favorites);
    expect(results).toHaveLength(1);
    expect(results[0].shortId).toBe('pasta-id');
  });

  test('returns empty array when favoritesOnly is true and no favorites match', () => {
    const filters = { ...defaultFilters, favoritesOnly: true };
    const results = filterRecipes(sampleRecipes, filters, []);
    expect(results).toHaveLength(0);
  });
});
