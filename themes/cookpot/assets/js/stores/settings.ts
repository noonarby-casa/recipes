import { writable } from 'svelte/store';
import type { FontSizeOption, SettingsState } from '../types';
import { persistedWritable } from '../utils/storage';
import { formatIsoDate, getMondayOfWeek } from '../utils/dates';

const SETTINGS_KEY = 'noonarby-meal-plan-settings';
const FONT_SIZE_KEY = 'recipe-instructions-font-size';
const TIMER_MUTED_KEY = 'timer-sound-muted';

const defaultSettings: SettingsState = {
  activeTab: 'view',
  startDate: formatIsoDate(getMondayOfWeek()),
  durationDays: 5,
  workWeekOnly: true,
};

export const settingsStore = persistedWritable<SettingsState>(
  SETTINGS_KEY,
  defaultSettings,
  {
    deserializer: (raw) => {
      const parsed = raw as {
        workWeekOnly?: unknown;
        durationDays?: unknown;
        startDate?: unknown;
      } | null;

      let workWeekOnly = true;
      let durationDays = 5;
      let startDate = formatIsoDate(getMondayOfWeek());

      if (parsed?.workWeekOnly !== undefined) {
        workWeekOnly = Boolean(parsed.workWeekOnly);
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
      if (
        typeof parsed?.startDate === 'string' &&
        parsed.startDate.length === 10
      ) {
        startDate = parsed.startDate;
      }

      return {
        activeTab: 'view',
        startDate,
        durationDays,
        workWeekOnly,
      };
    },
    serializer: (state) => ({
      workWeekOnly: state.workWeekOnly,
      durationDays: state.durationDays,
      startDate: state.startDate,
    }),
  },
);

// ---------------------------------------------------------------------------
// Font size preference for recipe instruction columns
// ---------------------------------------------------------------------------

export const fontSizeStore = persistedWritable<FontSizeOption>(
  FONT_SIZE_KEY,
  'default',
  {
    storageType: 'string',
    deserializer: (saved) =>
      saved === 'smaller' || saved === 'larger' ? saved : 'default',
  },
);

// ---------------------------------------------------------------------------
// Current scale factor shared between SingleRecipeScaler and RecipeShoppingList
// ---------------------------------------------------------------------------

export const recipeScaleStore = writable<number>(1.0);

// ---------------------------------------------------------------------------
// Timer sound muted preference
// ---------------------------------------------------------------------------

export const timerMutedStore = persistedWritable<boolean>(
  TIMER_MUTED_KEY,
  false,
  {
    storageType: 'string',
    deserializer: (val) => val === 'true',
    serializer: (muted) => String(muted),
  },
);
