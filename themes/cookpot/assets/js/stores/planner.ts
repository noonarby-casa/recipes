import { writable, get } from 'svelte/store';
import type { IngredientInput, PlannedItem, PlannerState } from '../types';
import { recipesStore } from './recipes';
import { settingsStore } from './settings';
import { favoritesStore } from './favorites';
import { filtersStore } from './filters';
import { ls } from '../utils/storage';
import { generateInstanceId } from '../utils/ids';

const STORAGE_KEY = 'noonarby-meal-plan';

export function getLocalPlanFromStorage(): PlannedItem[] {
  return ls.getJson<PlannedItem[]>(STORAGE_KEY) ?? [];
}

const initialPlan = getLocalPlanFromStorage();

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

/**
 * Applies a new plan to state, persisting it to localStorage unless we are in
 * preview/conflict mode. Keeps `localPlan` in sync when not previewing.
 */
function commitPlan(
  state: PlannerState,
  nextPlan: PlannedItem[],
): PlannerState {
  const nextLocal = state.isPreviewing ? state.localPlan : nextPlan;
  if (!state.isPreviewing) {
    ls.setJson(STORAGE_KEY, nextPlan);
  }
  return { ...state, plan: nextPlan, localPlan: nextLocal };
}

export const plannerStore = {
  subscribe: store.subscribe,
  set: store.set,
  update: store.update,

  addRecipe(day: string, permalink: string, flashId?: string): string {
    const instanceId = flashId || generateInstanceId();
    store.update((state) => {
      const newItem: PlannedItem = { instanceId, permalink, scale: 1.0, day };
      return commitPlan(state, [...state.plan, newItem]);
    });
    return instanceId;
  },

  addCustomItem(day: string, title: string): string {
    const instanceId = generateInstanceId();
    store.update((state) => {
      const newItem: PlannedItem = {
        instanceId,
        customTitle: title,
        scale: 1.0,
        day,
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
      ls.setJson(STORAGE_KEY, state.localPlan);
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
      ls.setJson(STORAGE_KEY, state.sharedPlan);
      return {
        ...state,
        plan: state.sharedPlan,
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
      ls.setJson(STORAGE_KEY, merged);
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
      const activeDays = settings.workWeekOnly
        ? ['mon', 'tue', 'wed', 'thu', 'fri']
        : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

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

      activeDays.forEach((day) => {
        const hasDinner = nextPlan.some((p) => p.day === day);
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
            day,
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
