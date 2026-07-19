import { writable, get } from 'svelte/store';
import type { PlannedItem } from '../types';
import { recipesStore } from './recipes';
import { settingsStore } from './settings';
import { favoritesStore } from './favorites';
import { filtersStore } from './filters';

const STORAGE_KEY = 'noonarby-meal-plan';

export interface PlannerState {
  plan: PlannedItem[];
  localPlan: PlannedItem[];
  sharedPlan: PlannedItem[];
  hasConflict: boolean;
  isPreviewing: boolean;
  previewMode: 'local' | 'shared';
  lastRemovedRecipe: PlannedItem | null;
  lastRemovedIndex: number | null;
}

function getLocalPlanFromStorage(): PlannedItem[] {
  if (typeof localStorage === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading plan from storage:', e);
  }
  return [];
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

export const plannerStore = {
  subscribe: store.subscribe,
  set: store.set,
  update: store.update,

  addRecipe(day: string, permalink: string, flashId?: string): string {
    const instanceId =
      flashId ||
      `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    store.update((state) => {
      const newItem: PlannedItem = {
        instanceId,
        permalink,
        scale: 1.0,
        day,
      };
      const nextPlan = [...state.plan, newItem];
      const nextLocal = state.isPreviewing ? state.localPlan : nextPlan;
      if (!state.isPreviewing) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPlan));
      }
      return {
        ...state,
        plan: nextPlan,
        localPlan: nextLocal,
      };
    });
    return instanceId;
  },

  addCustomItem(day: string, title: string): string {
    const instanceId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    store.update((state) => {
      const newItem: PlannedItem = {
        instanceId,
        customTitle: title,
        scale: 1.0,
        day,
      };
      const nextPlan = [...state.plan, newItem];
      const nextLocal = state.isPreviewing ? state.localPlan : nextPlan;
      if (!state.isPreviewing) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPlan));
      }
      return {
        ...state,
        plan: nextPlan,
        localPlan: nextLocal,
      };
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
      const nextLocal = state.isPreviewing ? state.localPlan : nextPlan;
      if (!state.isPreviewing) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPlan));
      }

      return {
        ...state,
        plan: nextPlan,
        localPlan: nextLocal,
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
      const nextLocal = state.isPreviewing ? state.localPlan : nextPlan;
      if (!state.isPreviewing) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPlan));
      }

      return {
        ...state,
        plan: nextPlan,
        localPlan: nextLocal,
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
      const nextLocal = state.isPreviewing ? state.localPlan : nextPlan;
      if (!state.isPreviewing) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPlan));
      }
      return {
        ...state,
        plan: nextPlan,
        localPlan: nextLocal,
      };
    });
  },

  updateExtraIngredients(instanceId: string, extraIngredients: any[]) {
    store.update((state) => {
      const nextPlan = state.plan.map((item) =>
        item.instanceId === instanceId ? { ...item, extraIngredients } : item,
      );
      const nextLocal = state.isPreviewing ? state.localPlan : nextPlan;
      if (!state.isPreviewing) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPlan));
      }
      return {
        ...state,
        plan: nextPlan,
        localPlan: nextLocal,
      };
    });
  },

  updateCustomTitle(instanceId: string, customTitle: string) {
    store.update((state) => {
      const nextPlan = state.plan.map((item) =>
        item.instanceId === instanceId ? { ...item, customTitle } : item,
      );
      const nextLocal = state.isPreviewing ? state.localPlan : nextPlan;
      if (!state.isPreviewing) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPlan));
      }
      return {
        ...state,
        plan: nextPlan,
        localPlan: nextLocal,
      };
    });
  },

  reorderRecipes(nextPlan: PlannedItem[]) {
    store.update((state) => {
      const nextLocal = state.isPreviewing ? state.localPlan : nextPlan;
      if (!state.isPreviewing) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPlan));
      }
      return {
        ...state,
        plan: nextPlan,
        localPlan: nextLocal,
      };
    });
  },

  clearPlan() {
    store.update((state) => {
      const nextPlan: PlannedItem[] = [];
      const nextLocal = state.isPreviewing ? state.localPlan : nextPlan;
      if (!state.isPreviewing) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPlan));
      }
      return {
        ...state,
        plan: nextPlan,
        localPlan: nextLocal,
      };
    });
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.localPlan));
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.sharedPlan));
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
        merged.push({
          ...item,
          instanceId: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        });
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
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
            instanceId: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            permalink: randomRec.permalink,
            scale: 1.0,
            day,
          });
          planChanged = true;
        }
      });

      if (planChanged) {
        if (!state.isPreviewing) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPlan));
        }
        return {
          ...state,
          plan: nextPlan,
          localPlan: state.isPreviewing ? state.localPlan : nextPlan,
        };
      }

      return state;
    });

    return planChanged;
  },
};
