import type { FiltersState } from '../types';
import { persistedWritable } from '../utils/storage';
import { syncStoreWithUrl } from './urlSyncStore';

const FILTERS_KEY = 'noonarby-meal-plan-filters';

const defaultFilters: FiltersState = {
  searchQuery: '',
  favoritesOnly: false,
  includedTags: [],
  excludedTags: [],
  includedSources: [],
  excludedSources: [],
};

export const filtersStore = persistedWritable<FiltersState>(
  FILTERS_KEY,
  defaultFilters,
  {
    deserializer: (raw) => {
      const stored = raw as Record<string, unknown> | null;
      return {
        searchQuery: '',
        favoritesOnly: false,
        includedTags: Array.isArray(stored?.includedTags)
          ? (stored.includedTags as string[])
          : [],
        excludedTags: Array.isArray(stored?.excludedTags)
          ? (stored.excludedTags as string[])
          : [],
        includedSources: Array.isArray(stored?.includedSources)
          ? (stored.includedSources as string[])
          : [],
        excludedSources: Array.isArray(stored?.excludedSources)
          ? (stored.excludedSources as string[])
          : [],
      };
    },
    serializer: (state) => ({
      includedTags: state.includedTags,
      excludedTags: state.excludedTags,
      includedSources: state.includedSources,
      excludedSources: state.excludedSources,
    }),
  },
);

syncStoreWithUrl(filtersStore, {
  paramKeys: [
    'q',
    'query',
    'search',
    'tag',
    'tags',
    'source',
    'sources',
    'favorites',
    'favorite',
  ],
  serialize: (state) => ({
    q: state.searchQuery ? state.searchQuery : null,
    tag: state.includedTags.length > 0 ? state.includedTags.join(',') : null,
    source:
      state.includedSources.length > 0 ? state.includedSources.join(',') : null,
    favorites: state.favoritesOnly ? '1' : null,
  }),
  deserialize: (params) => {
    const deserialized: Partial<FiltersState> = {};
    const qParam =
      params.get('q') ?? params.get('query') ?? params.get('search');
    if (qParam !== null && qParam !== 'focus') {
      deserialized.searchQuery = qParam.trim();
    }
    const tagParam = params.get('tag') ?? params.get('tags');
    if (tagParam !== null) {
      deserialized.includedTags = tagParam
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      deserialized.excludedTags = [];
    }
    const sourceParam = params.get('source') ?? params.get('sources');
    if (sourceParam !== null) {
      deserialized.includedSources = sourceParam
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      deserialized.excludedSources = [];
    }
    const favParam = params.get('favorites') ?? params.get('favorite');
    if (favParam !== null) {
      deserialized.favoritesOnly =
        favParam === '1' || favParam === 'true' || favParam === '';
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
