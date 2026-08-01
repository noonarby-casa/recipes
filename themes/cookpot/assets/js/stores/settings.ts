import { writable } from 'svelte/store';
import type { FontSizeOption, SettingsState } from '../types';
import { ls } from '../utils/storage';
import { formatIsoDate, getMondayOfWeek } from '../utils/dates';

const SETTINGS_KEY = 'noonarby-meal-plan-settings';
const FONT_SIZE_KEY = 'recipe-instructions-font-size';

function loadSettings(): SettingsState {
  let workWeekOnly = true;
  let durationDays = 5;
  let startDate = formatIsoDate(getMondayOfWeek());

  const parsed = ls.getJson<{
    workWeekOnly?: unknown;
    durationDays?: unknown;
    startDate?: unknown;
  }>(SETTINGS_KEY);

  if (parsed?.workWeekOnly !== undefined) {
    workWeekOnly = !!parsed.workWeekOnly;
    durationDays = workWeekOnly ? 5 : 7;
  }
  if (
    typeof parsed?.durationDays === 'number' &&
    parsed.durationDays >= 1 &&
    parsed.durationDays <= 21
  ) {
    durationDays = parsed.durationDays;
    workWeekOnly = durationDays === 5;
  }
  if (typeof parsed?.startDate === 'string' && parsed.startDate.length === 10) {
    startDate = parsed.startDate;
  }

  return {
    activeTab: 'view',
    startDate,
    durationDays,
    workWeekOnly,
  };
}

export const settingsStore = writable<SettingsState>(loadSettings());

settingsStore.subscribe((state) => {
  ls.setJson(SETTINGS_KEY, {
    workWeekOnly: state.workWeekOnly,
    durationDays: state.durationDays,
    startDate: state.startDate,
  });
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

// ---------------------------------------------------------------------------
// Timer sound muted preference
// ---------------------------------------------------------------------------

const TIMER_MUTED_KEY = 'timer-sound-muted';

function loadTimerMuted(): boolean {
  return ls.getString(TIMER_MUTED_KEY) === 'true';
}

export const timerMutedStore = writable<boolean>(loadTimerMuted());

timerMutedStore.subscribe((muted) => {
  ls.setString(TIMER_MUTED_KEY, String(muted));
});
