import { writable } from 'svelte/store';
import { ls } from '../utils/storage';

const FILTERS_KEY = 'noonarby-meal-plan-filters';

import type { FiltersState } from '../types';

function loadFilters(): FiltersState {
  let includedTags: string[] = [];
  let excludedTags: string[] = [];
  let includedSources: string[] = [];
  let excludedSources: string[] = [];
  let searchQuery = '';
  let favoritesOnly = false;

  const stored = ls.getJson<Record<string, unknown>>(FILTERS_KEY);
  if (stored) {
    if (stored.includedTags) {
      includedTags = stored.includedTags as string[];
    }
    if (stored.excludedTags) {
      excludedTags = stored.excludedTags as string[];
    }
    if (stored.includedSources) {
      includedSources = stored.includedSources as string[];
    }
    if (stored.excludedSources) {
      excludedSources = stored.excludedSources as string[];
    }
  }

  if (typeof window !== 'undefined' && window.location) {
    try {
      const params = new URLSearchParams(window.location.search);

      const tagParam = params.get('tag') ?? params.get('tags');
      if (tagParam !== null) {
        includedTags = tagParam
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
        excludedTags = [];
      }

      const qParam =
        params.get('q') ?? params.get('query') ?? params.get('search');
      if (qParam !== null && qParam !== 'focus') {
        searchQuery = qParam.trim();
      }

      const sourceParam = params.get('source') ?? params.get('sources');
      if (sourceParam !== null) {
        includedSources = sourceParam
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        excludedSources = [];
      }

      const favParam = params.get('favorites') ?? params.get('favorite');
      if (favParam !== null) {
        favoritesOnly = favParam === 'true' || favParam === '';
      }
    } catch (e) {
      console.error('Error parsing filters from URL:', e);
    }
  }

  return {
    searchQuery,
    favoritesOnly,
    includedTags,
    excludedTags,
    includedSources,
    excludedSources,
  };
}

import { syncStoreWithUrl } from './urlSyncStore';

export const filtersStore = writable<FiltersState>(loadFilters());

filtersStore.subscribe((state) => {
  ls.setJson(FILTERS_KEY, {
    includedTags: state.includedTags,
    excludedTags: state.excludedTags,
    includedSources: state.includedSources,
    excludedSources: state.excludedSources,
  });
});

syncStoreWithUrl(filtersStore, {
  paramKeys: ['q', 'tag', 'source', 'favorites'],
  serialize: (state) => ({
    q: state.searchQuery ? state.searchQuery : null,
    tag: state.includedTags.length > 0 ? state.includedTags.join(',') : null,
    source:
      state.includedSources.length > 0 ? state.includedSources.join(',') : null,
    favorites: state.favoritesOnly ? '1' : null,
  }),
  deserialize: (params) => {
    const deserialized: Partial<FiltersState> = {};
    if (params.has('q')) {
      deserialized.searchQuery = params.get('q') || '';
    }
    if (params.has('tag')) {
      deserialized.includedTags = (params.get('tag') || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }
    if (params.has('source')) {
      deserialized.includedSources = (params.get('source') || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (params.has('favorites')) {
      deserialized.favoritesOnly = params.get('favorites') === '1';
    }
    return deserialized;
  },
});

function hasTag(rTags: string[] | undefined, tag: string): boolean {
  if (!rTags || rTags.length === 0) {
    return false;
  }
  const normalizedTag = tag.trim().toLowerCase();
  return rTags.some((t) => t.trim().toLowerCase() === normalizedTag);
}

export function filterRecipes(
  recipes: import('../types').Recipe[],
  filters: FiltersState,
  favorites: string[],
  overrideQuery?: string,
): import('../types').Recipe[] {
  const query = (
    overrideQuery !== undefined ? overrideQuery : filters.searchQuery
  )
    .trim()
    .toLowerCase();
  const {
    favoritesOnly,
    includedTags,
    excludedTags,
    includedSources,
    excludedSources,
  } = filters;

  return recipes.filter((r) => {
    if (favoritesOnly && (!r.shortId || !favorites.includes(r.shortId))) {
      return false;
    }

    if (query) {
      const titleMatch = r.title.toLowerCase().includes(query);
      const summaryMatch = r.summary && r.summary.toLowerCase().includes(query);
      const sourceMatch =
        r.recipeSource && r.recipeSource.toLowerCase().includes(query);
      const tagsMatch =
        r.tags && r.tags.some((t) => t.toLowerCase().includes(query));
      const ingMatch =
        r.ingredients &&
        r.ingredients.some((ing) => {
          const item = typeof ing === 'string' ? ing : ing.item;
          return item.toLowerCase().includes(query);
        });
      if (
        !titleMatch &&
        !summaryMatch &&
        !sourceMatch &&
        !tagsMatch &&
        !ingMatch
      ) {
        return false;
      }
    }

    const rSrc = r.recipeSource || 'Noonarby';
    if (includedSources.length > 0) {
      const inc = includedSources.some(
        (s) => s.trim().toLowerCase() === rSrc.trim().toLowerCase(),
      );
      if (!inc) {
        return false;
      }
    }
    if (excludedSources.length > 0) {
      const exc = excludedSources.some(
        (s) => s.trim().toLowerCase() === rSrc.trim().toLowerCase(),
      );
      if (exc) {
        return false;
      }
    }

    if (includedTags.length > 0) {
      if (!includedTags.every((t) => hasTag(r.tags, t))) {
        return false;
      }
    }
    if (excludedTags.length > 0) {
      if (excludedTags.some((t) => hasTag(r.tags, t))) {
        return false;
      }
    }

    return true;
  });
}

export function calculateTagTallies(
  recipes: import('../types').Recipe[],
  uniqueTags: string[],
  filters: FiltersState,
  favorites: string[],
): Record<string, number> {
  const tallies: Record<string, number> = {};
  const { includedTags, excludedTags } = filters;

  recipes.forEach((r) => {
    if (
      !filterRecipes(
        [r],
        { ...filters, includedTags: [], excludedTags: [] },
        favorites,
      ).length
    ) {
      return;
    }

    uniqueTags.forEach((tag) => {
      if (!hasTag(r.tags, tag)) {
        return;
      }
      const otherInc = includedTags.filter(
        (t) => t.trim().toLowerCase() !== tag.trim().toLowerCase(),
      );
      if (otherInc.length > 0 && !otherInc.every((t) => hasTag(r.tags, t))) {
        return;
      }
      const otherExc = excludedTags.filter(
        (t) => t.trim().toLowerCase() !== tag.trim().toLowerCase(),
      );
      if (otherExc.length > 0 && otherExc.some((t) => hasTag(r.tags, t))) {
        return;
      }
      tallies[tag] = (tallies[tag] || 0) + 1;
    });
  });

  return tallies;
}

export function calculateSourceTallies(
  recipes: import('../types').Recipe[],
  filters: FiltersState,
  favorites: string[],
): Record<string, number> {
  const tallies: Record<string, number> = {};
  const { excludedSources } = filters;

  recipes.forEach((r) => {
    if (
      !filterRecipes(
        [r],
        { ...filters, includedSources: [], excludedSources: [] },
        favorites,
      ).length
    ) {
      return;
    }

    const rSrc = r.recipeSource || 'Noonarby';
    const otherExcSources = excludedSources.filter(
      (s) => s.trim().toLowerCase() !== rSrc.trim().toLowerCase(),
    );
    if (
      otherExcSources.some(
        (s) => s.trim().toLowerCase() === rSrc.trim().toLowerCase(),
      )
    ) {
      return;
    }

    tallies[rSrc] = (tallies[rSrc] || 0) + 1;
  });

  return tallies;
}
