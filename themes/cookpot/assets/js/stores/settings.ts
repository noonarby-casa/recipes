import { writable } from 'svelte/store';
import type { FontSizeOption, SettingsState } from '../types';

const SETTINGS_KEY = 'noonarby-meal-plan-settings';
const FONT_SIZE_KEY = 'recipe-instructions-font-size';

function loadSettings(): SettingsState {
  let workWeekOnly = true;
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.workWeekOnly !== undefined) {
          workWeekOnly = !!parsed.workWeekOnly;
        }
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  }
  return {
    activeTab: 'view',
    workWeekOnly,
  };
}

export const settingsStore = writable<SettingsState>(loadSettings());

settingsStore.subscribe((state) => {
  if (typeof localStorage !== 'undefined') {
    try {
      const settings = {
        workWeekOnly: state.workWeekOnly,
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  }
});

// ---------------------------------------------------------------------------
// Font size preference for recipe instruction columns
// ---------------------------------------------------------------------------

function loadFontSize(): FontSizeOption {
  if (typeof localStorage === 'undefined') {
    return 'default';
  }
  const saved = localStorage.getItem(FONT_SIZE_KEY);
  if (saved === 'smaller' || saved === 'larger') {
    return saved;
  }
  return 'default';
}

export const fontSizeStore = writable<FontSizeOption>(loadFontSize());

fontSizeStore.subscribe((size) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(FONT_SIZE_KEY, size);
  }
});

// ---------------------------------------------------------------------------
// Current scale factor shared between SingleRecipeScaler and RecipeShoppingList
// ---------------------------------------------------------------------------

export const recipeScaleStore = writable<number>(1.0);
