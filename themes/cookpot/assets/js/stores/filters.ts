import { writable } from 'svelte/store';

const FILTERS_KEY = 'noonarby-meal-plan-filters';

import type { FiltersState } from '../types';

function loadFilters(): FiltersState {
  let includedTags: string[] = [];
  let excludedTags: string[] = [];
  let includedSources: string[] = [];
  let excludedSources: string[] = [];

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

  return {
    searchQuery: '',
    favoritesOnly: false,
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
