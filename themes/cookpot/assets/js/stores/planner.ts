import { writable, get } from 'svelte/store';
import type { IngredientInput, PlannedItem, PlannerState } from '../types';
import { recipesStore } from './recipes';
import { settingsStore } from './settings';
import { favoritesStore } from './favorites';
import { filtersStore } from './filters';
import { ls } from '../utils/storage';
import { generateInstanceId } from '../utils/ids';
import {
  addDays,
  formatIsoDate,
  getDateSequence,
  getMondayOfWeek,
} from '../utils/dates';

const STORAGE_KEY = 'noonarby-calendar-ledger';
const LEGACY_STORAGE_KEY = 'noonarby-meal-plan';

export type CalendarLedger = Record<string, PlannedItem[]>;

/**
 * Performs legacy migration from `noonarby-meal-plan` to `noonarby-calendar-ledger` if needed.
 */
export function getCalendarLedgerFromStorage(): CalendarLedger {
  const existingLedger = ls.getJson<CalendarLedger>(STORAGE_KEY);
  if (existingLedger && Object.keys(existingLedger).length > 0) {
    return existingLedger;
  }

  // Legacy fallback migration
  const legacyPlan = ls.getJson<PlannedItem[]>(LEGACY_STORAGE_KEY);
  if (legacyPlan && Array.isArray(legacyPlan) && legacyPlan.length > 0) {
    const monday = getMondayOfWeek();
    const dayMap: Record<string, number> = {
      mon: 0,
      tue: 1,
      wed: 2,
      thu: 3,
      fri: 4,
      sat: 5,
      sun: 6,
    };

    const newLedger: CalendarLedger = {};
    legacyPlan.forEach((item) => {
      let targetDate = 'supplemental';
      const itemDay = item.day || item.date;
      if (itemDay && dayMap[itemDay] !== undefined) {
        targetDate = formatIsoDate(addDays(monday, dayMap[itemDay]));
      } else if (item.date) {
        targetDate = item.date;
      }

      if (!newLedger[targetDate]) {
        newLedger[targetDate] = [];
      }
      newLedger[targetDate].push({
        ...item,
        date: targetDate,
      });
    });

    saveLedgerToStorage(newLedger);
    ls.remove(LEGACY_STORAGE_KEY);
    return newLedger;
  }

  return {};
}

/**
 * Safely saves ledger to localStorage, catching QuotaExceededError and auto-pruning.
 */
export function saveLedgerToStorage(ledger: CalendarLedger): void {
  try {
    ls.setJson(STORAGE_KEY, ledger);
  } catch (e) {
    console.warn(
      'QuotaExceededError while saving calendar ledger. Auto-pruning entries older than 365 days...',
      e,
    );
    const cutoffDate = formatIsoDate(addDays(new Date(), -365));
    const prunedLedger: CalendarLedger = {};

    Object.keys(ledger).forEach((key) => {
      if (key === 'supplemental' || key >= cutoffDate) {
        prunedLedger[key] = ledger[key];
      }
    });

    try {
      ls.setJson(STORAGE_KEY, prunedLedger);
    } catch (retryError) {
      console.error(
        'Failed to save calendar ledger even after pruning:',
        retryError,
      );
    }
  }
}

/**
 * Downloads a .json file backup of the calendar ledger.
 */
export function exportLedgerBackup(): void {
  const ledger = getCalendarLedgerFromStorage();
  const dateStr = formatIsoDate(new Date());
  ls.downloadJson(`noonarby-recipes-history-${dateStr}.json`, ledger);
}

/**
 * Returns current ledger storage metrics.
 */
export function getLedgerStats(): {
  totalMeals: number;
  totalDays: number;
  storageKb: number;
  percent: number;
} {
  const ledger = getCalendarLedgerFromStorage();
  let totalMeals = 0;
  let totalDays = 0;

  Object.keys(ledger).forEach((key) => {
    totalMeals += ledger[key].length;
    if (ledger[key].length > 0 && key !== 'supplemental') {
      totalDays += 1;
    }
  });

  const usage = ls.getStorageUsage();
  return {
    totalMeals,
    totalDays,
    storageKb: usage.kb,
    percent: usage.percent,
  };
}

/**
 * Returns flat list of PlannedItems for a given date range + supplemental items.
 */
export function getPlanFromLedger(
  ledger: CalendarLedger,
  startDateStr: string,
  durationDays: number,
): PlannedItem[] {
  const activeDates = getDateSequence(startDateStr, durationDays);
  const plan: PlannedItem[] = [];

  activeDates.forEach((dStr) => {
    if (ledger[dStr]) {
      plan.push(...ledger[dStr]);
    }
  });

  if (ledger['supplemental']) {
    plan.push(...ledger['supplemental']);
  }

  return plan;
}

/**
 * Converts a flat plan array into a ledger mapping.
 */
function buildLedgerFromPlan(
  baseLedger: CalendarLedger,
  startDateStr: string,
  durationDays: number,
  newPlan: PlannedItem[],
): CalendarLedger {
  const activeDates = new Set(getDateSequence(startDateStr, durationDays));
  const updatedLedger: CalendarLedger = { ...baseLedger };

  // Clear current active range + supplemental
  activeDates.forEach((dStr) => {
    delete updatedLedger[dStr];
  });
  delete updatedLedger['supplemental'];

  // Re-insert new plan items
  newPlan.forEach((item) => {
    const key = item.date || 'supplemental';
    if (!updatedLedger[key]) {
      updatedLedger[key] = [];
    }
    updatedLedger[key].push(item);
  });

  return updatedLedger;
}

export function getLocalPlanFromStorage(): PlannedItem[] {
  const ledger = getCalendarLedgerFromStorage();
  const settings = get(settingsStore);
  const startDate = settings.startDate || formatIsoDate(getMondayOfWeek());
  const durationDays = settings.durationDays || 5;
  return getPlanFromLedger(ledger, startDate, durationDays);
}

const initialLedger = getCalendarLedgerFromStorage();
const initialSettings = get(settingsStore);
const initialPlan = getPlanFromLedger(
  initialLedger,
  initialSettings.startDate || formatIsoDate(getMondayOfWeek()),
  initialSettings.durationDays || 5,
);

const initialState: PlannerState = {
  plan: initialPlan,
  localPlan: initialPlan,
  sharedPlan: [],
  hasConflict: false,
  isPreviewing: false,
  previewMode: 'local',
  lastRemovedRecipe: null,
  lastRemovedIndex: null,
};

const store = writable<PlannerState>(initialState);

function commitPlan(
  state: PlannerState,
  nextPlan: PlannedItem[],
): PlannerState {
  const nextLocal = state.isPreviewing ? state.localPlan : nextPlan;
  if (!state.isPreviewing) {
    const settings = get(settingsStore);
    const startDate = settings.startDate || formatIsoDate(getMondayOfWeek());
    const durationDays = settings.durationDays || 5;

    const baseLedger = getCalendarLedgerFromStorage();
    const updatedLedger = buildLedgerFromPlan(
      baseLedger,
      startDate,
      durationDays,
      nextPlan,
    );
    saveLedgerToStorage(updatedLedger);
  }
  return { ...state, plan: nextPlan, localPlan: nextLocal };
}

export const plannerStore = {
  subscribe: store.subscribe,
  set: store.set,
  update: store.update,

  /** Reloads active plan from ledger when settings (startDate / durationDays) change */
  reloadActivePlan() {
    const ledger = getCalendarLedgerFromStorage();
    const settings = get(settingsStore);
    const startDate = settings.startDate || formatIsoDate(getMondayOfWeek());
    const durationDays = settings.durationDays || 5;
    const activePlan = getPlanFromLedger(ledger, startDate, durationDays);

    store.update((state) => ({
      ...state,
      plan: activePlan,
      localPlan: activePlan,
      hasConflict: false,
      isPreviewing: false,
    }));
  },

  addRecipe(dateStr: string, permalink: string, flashId?: string): string {
    const instanceId = flashId || generateInstanceId();
    const createdAt = formatIsoDate(new Date());
    store.update((state) => {
      const newItem: PlannedItem = {
        instanceId,
        permalink,
        scale: 1.0,
        date: dateStr,
        createdAt,
      };
      return commitPlan(state, [...state.plan, newItem]);
    });
    return instanceId;
  },

  addCustomItem(dateStr: string, title: string): string {
    const instanceId = generateInstanceId();
    const createdAt = formatIsoDate(new Date());
    store.update((state) => {
      const newItem: PlannedItem = {
        instanceId,
        customTitle: title,
        scale: 1.0,
        date: dateStr,
        createdAt,
      };
      return commitPlan(state, [...state.plan, newItem]);
    });
    return instanceId;
  },

  removeRecipe(instanceId: string) {
    store.update((state) => {
      const idx = state.plan.findIndex((p) => p.instanceId === instanceId);
      if (idx === -1) {
        return state;
      }
      const target = state.plan[idx];
      const nextPlan = state.plan.filter((p) => p.instanceId !== instanceId);
      if (nextPlan.length === 0) {
        ls.remove('noonarby-planner-banner-dismissed');
      }
      return {
        ...commitPlan(state, nextPlan),
        lastRemovedRecipe: { ...target },
        lastRemovedIndex: idx,
      };
    });
  },

  undoRemove() {
    store.update((state) => {
      if (state.lastRemovedRecipe === null || state.lastRemovedIndex === null) {
        return state;
      }
      const nextPlan = [...state.plan];
      nextPlan.splice(state.lastRemovedIndex, 0, state.lastRemovedRecipe);
      return {
        ...commitPlan(state, nextPlan),
        lastRemovedRecipe: null,
        lastRemovedIndex: null,
      };
    });
  },

  clearLastRemoved() {
    store.update((state) => ({
      ...state,
      lastRemovedRecipe: null,
      lastRemovedIndex: null,
    }));
  },

  updateScale(instanceId: string, scale: number) {
    store.update((state) => {
      const nextPlan = state.plan.map((item) =>
        item.instanceId === instanceId ? { ...item, scale } : item,
      );
      return commitPlan(state, nextPlan);
    });
  },

  updateExtraIngredients(
    instanceId: string,
    extraIngredients: IngredientInput[],
  ) {
    store.update((state) => {
      const nextPlan = state.plan.map((item) =>
        item.instanceId === instanceId ? { ...item, extraIngredients } : item,
      );
      return commitPlan(state, nextPlan);
    });
  },

  updateCustomTitle(instanceId: string, customTitle: string) {
    store.update((state) => {
      const nextPlan = state.plan.map((item) =>
        item.instanceId === instanceId ? { ...item, customTitle } : item,
      );
      return commitPlan(state, nextPlan);
    });
  },

  updateIcon(instanceId: string, icon: string) {
    store.update((state) => {
      const nextPlan = state.plan.map((item) =>
        item.instanceId === instanceId ? { ...item, icon } : item,
      );
      return commitPlan(state, nextPlan);
    });
  },

  reorderRecipes(nextPlan: PlannedItem[]) {
    store.update((state) => commitPlan(state, nextPlan));
  },

  clearPlan() {
    ls.remove('noonarby-planner-banner-dismissed');
    store.update((state) => commitPlan(state, []));
  },

  setConflict(sharedPlan: PlannedItem[], localPlan: PlannedItem[]) {
    store.update((state) => ({
      ...state,
      sharedPlan,
      localPlan,
      plan: sharedPlan,
      hasConflict: true,
      isPreviewing: true,
      previewMode: 'shared',
    }));
  },

  showSharedPreview() {
    store.update((state) => ({
      ...state,
      plan: state.sharedPlan,
      previewMode: 'shared',
    }));
  },

  showLocalPreview() {
    store.update((state) => ({
      ...state,
      plan: state.localPlan,
      previewMode: 'local',
    }));
  },

  keepLocal() {
    store.update((state) => {
      const settings = get(settingsStore);
      const startDate = settings.startDate || formatIsoDate(getMondayOfWeek());
      const durationDays = settings.durationDays || 5;

      const baseLedger = getCalendarLedgerFromStorage();
      const updatedLedger = buildLedgerFromPlan(
        baseLedger,
        startDate,
        durationDays,
        state.localPlan,
      );
      saveLedgerToStorage(updatedLedger);

      return {
        ...state,
        plan: state.localPlan,
        hasConflict: false,
        isPreviewing: false,
      };
    });
  },

  loadShared() {
    store.update((state) => {
      const settings = get(settingsStore);
      const startDate = settings.startDate || formatIsoDate(getMondayOfWeek());
      const durationDays = settings.durationDays || 5;

      const baseLedger = getCalendarLedgerFromStorage();
      const updatedLedger = buildLedgerFromPlan(
        baseLedger,
        startDate,
        durationDays,
        state.sharedPlan,
      );
      saveLedgerToStorage(updatedLedger);

      return {
        ...state,
        plan: state.sharedPlan,
        localPlan: state.sharedPlan,
        hasConflict: false,
        isPreviewing: false,
      };
    });
  },

  mergePlan() {
    store.update((state) => {
      const merged = [...state.localPlan];
      state.sharedPlan.forEach((item) => {
        merged.push({ ...item, instanceId: generateInstanceId() });
      });

      const settings = get(settingsStore);
      const startDate = settings.startDate || formatIsoDate(getMondayOfWeek());
      const durationDays = settings.durationDays || 5;

      const baseLedger = getCalendarLedgerFromStorage();
      const updatedLedger = buildLedgerFromPlan(
        baseLedger,
        startDate,
        durationDays,
        merged,
      );
      saveLedgerToStorage(updatedLedger);

      return {
        ...state,
        plan: merged,
        localPlan: merged,
        hasConflict: false,
        isPreviewing: false,
      };
    });
  },

  generateDinnerPlan(): boolean {
    const recipes = get(recipesStore);
    if (recipes.length === 0) {
      return false;
    }

    let planChanged = false;
    store.update((state) => {
      const settings = get(settingsStore);
      const favs = get(favoritesStore);

      const startDateStr =
        settings.startDate || formatIsoDate(getMondayOfWeek());
      const durationDays = settings.durationDays || 5;
      const activeDates = getDateSequence(startDateStr, durationDays);

      const filters = get(filtersStore);
      let pool = recipes.filter(
        (r) => r.tags && r.tags.some((t) => t.toLowerCase() === 'dinner'),
      );

      if (filters.favoritesOnly) {
        pool = pool.filter((r) => r.shortId && favs.includes(r.shortId));
      }

      if (pool.length === 0) {
        return state;
      }

      const nextPlan = [...state.plan];

      activeDates.forEach((dateStr) => {
        const hasDinner = nextPlan.some((p) => p.date === dateStr);
        if (!hasDinner) {
          const plannedPermalinks = new Set(nextPlan.map((p) => p.permalink));
          let candidates = pool.filter(
            (r) => !plannedPermalinks.has(r.permalink),
          );
          if (candidates.length === 0) {
            candidates = pool;
          }
          const randomRec =
            candidates[Math.floor(Math.random() * candidates.length)];
          nextPlan.push({
            instanceId: generateInstanceId(),
            permalink: randomRec.permalink,
            scale: 1.0,
            date: dateStr,
            createdAt: formatIsoDate(new Date()),
          });
          planChanged = true;
        }
      });

      if (planChanged) {
        return commitPlan(state, nextPlan);
      }

      return state;
    });

    return planChanged;
  },
};
