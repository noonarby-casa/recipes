import { writable } from 'svelte/store';

const FILTERS_KEY = 'noonarby-meal-plan-filters';

import type { FiltersState } from '../types';

function loadFilters(): FiltersState {
  let includedTags: string[] = [];
  let excludedTags: string[] = [];
  let includedSources: string[] = [];
  let excludedSources: string[] = [];
  let searchQuery = '';
  let favoritesOnly = false;

  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(FILTERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.includedTags) {
          includedTags = parsed.includedTags;
        }
        if (parsed.excludedTags) {
          excludedTags = parsed.excludedTags;
        }
        if (parsed.includedSources) {
          includedSources = parsed.includedSources;
        }
        if (parsed.excludedSources) {
          excludedSources = parsed.excludedSources;
        }
      }
    } catch (e) {
      console.error('Error loading filters from storage:', e);
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

export const filtersStore = writable<FiltersState>(loadFilters());

filtersStore.subscribe((state) => {
  if (typeof localStorage !== 'undefined') {
    try {
      const data = {
        includedTags: state.includedTags,
        excludedTags: state.excludedTags,
        includedSources: state.includedSources,
        excludedSources: state.excludedSources,
      };
      localStorage.setItem(FILTERS_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving filters to storage:', e);
    }
  }
});
