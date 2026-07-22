import { writable } from 'svelte/store';
import type { FontSizeOption, SettingsState } from '../types';
import { ls } from '../utils/storage';

const SETTINGS_KEY = 'noonarby-meal-plan-settings';
const FONT_SIZE_KEY = 'recipe-instructions-font-size';

function loadSettings(): SettingsState {
  let workWeekOnly = true;
  const parsed = ls.getJson<{ workWeekOnly?: unknown }>(SETTINGS_KEY);
  if (parsed?.workWeekOnly !== undefined) {
    workWeekOnly = !!parsed.workWeekOnly;
  }
  return {
    activeTab: 'view',
    workWeekOnly,
  };
}

export const settingsStore = writable<SettingsState>(loadSettings());

settingsStore.subscribe((state) => {
  ls.setJson(SETTINGS_KEY, { workWeekOnly: state.workWeekOnly });
});

// ---------------------------------------------------------------------------
// Font size preference for recipe instruction columns
// ---------------------------------------------------------------------------

function loadFontSize(): FontSizeOption {
  const saved = ls.getString(FONT_SIZE_KEY);
  if (saved === 'smaller' || saved === 'larger') {
    return saved;
  }
  return 'default';
}

export const fontSizeStore = writable<FontSizeOption>(loadFontSize());

fontSizeStore.subscribe((size) => {
  ls.setString(FONT_SIZE_KEY, size);
});

// ---------------------------------------------------------------------------
// Current scale factor shared between SingleRecipeScaler and RecipeShoppingList
// ---------------------------------------------------------------------------

export const recipeScaleStore = writable<number>(1.0);
