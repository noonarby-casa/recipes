import { writable, derived } from 'svelte/store';
import { plannerStore } from './planner';
import { recipesStore } from './recipes';
import type { IngredientInput } from '../types';
import { processShoppingList } from '../pipelines/pipeline';
import {
  getActiveStoreLayoutId,
  compareShoppingItems,
  STORE_LAYOUTS,
} from '../data/store-sections';
import { ls } from '../utils/storage';

const CHECKED_STORAGE_KEY = 'noonarby-shopping-checked-items-v3';

function loadCheckedStates(): Record<string, boolean> {
  return ls.getJson<Record<string, boolean>>(CHECKED_STORAGE_KEY) ?? {};
}

export const storeLayout = writable<string>(getActiveStoreLayoutId());

if (typeof document !== 'undefined') {
  document.addEventListener('store-layout:change', (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail && customEvent.detail.layoutId) {
      storeLayout.set(customEvent.detail.layoutId);
    }
  });
}

const checkedStates = writable<Record<string, boolean>>(loadCheckedStates());

export function getIngredientKey(item: string): string {
  return (item || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function isItemChecked(
  key: string,
  isStaple: boolean,
  states: Record<string, boolean>,
): boolean {
  if (key in states) {
    return states[key];
  }
  return isStaple;
}

export const shoppingCheckedStore = {
  subscribe: checkedStates.subscribe,
  toggle(key: string, isStaple: boolean) {
    checkedStates.update((states) => {
      const current = isItemChecked(key, isStaple, states);
      const next = { ...states, [key]: !current };
      ls.setJson(CHECKED_STORAGE_KEY, next);
      return next;
    });
  },
  setChecked(key: string, checked: boolean) {
    checkedStates.update((states) => {
      const next = { ...states, [key]: checked };
      ls.setJson(CHECKED_STORAGE_KEY, next);
      return next;
    });
  },
  pruneOrphans(validKeys: Set<string>) {
    checkedStates.update((states) => {
      let changed = false;
      const next: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(states)) {
        if (validKeys.has(k)) {
          next[k] = v;
        } else {
          changed = true;
        }
      }
      if (changed) {
        ls.setJson(CHECKED_STORAGE_KEY, next);
        return next;
      }
      return states;
    });
  },
  clearChecked() {
    checkedStates.set({});
    ls.remove(CHECKED_STORAGE_KEY);
  },
};

const ALT_SELECTIONS_STORAGE_KEY = 'noonarby-shopping-alt-selections-v1';

function loadAltSelections(): Record<string, string> {
  return ls.getJson<Record<string, string>>(ALT_SELECTIONS_STORAGE_KEY) ?? {};
}

const altSelections = writable<Record<string, string>>(loadAltSelections());

export const shoppingAltSelectionsStore = {
  subscribe: altSelections.subscribe,
  toggleAlt(recipeShortIdOrSlug: string, altItemSlug: string) {
    altSelections.update((states) => {
      const current = states[recipeShortIdOrSlug];
      const next = { ...states };
      if (current === altItemSlug) {
        delete next[recipeShortIdOrSlug];
      } else {
        next[recipeShortIdOrSlug] = altItemSlug;
      }
      ls.setJson(ALT_SELECTIONS_STORAGE_KEY, next);
      return next;
    });
  },
  clearAltSelections() {
    altSelections.set({});
    ls.remove(ALT_SELECTIONS_STORAGE_KEY);
  },
};

/**
 * Deep-clones an ingredient and scales its quantity (and alt quantity) by the
 * given scale factor. Handles both scalar and [min, max] tuple quantities.
 */
export function scaleIngredient(
  ing: IngredientInput,
  scale: number,
): IngredientInput {
  const parsed: IngredientInput = JSON.parse(JSON.stringify(ing));
  if (parsed.qty !== undefined) {
    parsed.qty = Array.isArray(parsed.qty)
      ? [parsed.qty[0] * scale, parsed.qty[1] * scale]
      : parsed.qty * scale;
  }
  if (parsed.alt?.qty !== undefined) {
    parsed.alt.qty = Array.isArray(parsed.alt.qty)
      ? [parsed.alt.qty[0] * scale, parsed.alt.qty[1] * scale]
      : parsed.alt.qty * scale;
  }
  return parsed;
}

export const combinedShoppingList = derived(
  [plannerStore, recipesStore, storeLayout, shoppingAltSelectionsStore],
  ([$planner, $recipes, $layoutId, $altSelections]) => {
    const planItems = $planner.plan;
    if (planItems.length === 0) {
      if (typeof window !== 'undefined') {
        shoppingCheckedStore.clearChecked();
      }
      return {
        buyItems: [],
        optionalItems: [],
        stapleItems: [],
        combinedBuyItems: [],
      };
    }

    const ingredients: IngredientInput[] = [];
    planItems.forEach((item) => {
      const rec = item.permalink
        ? $recipes.find((r) => r.permalink === item.permalink)
        : undefined;

      if (rec) {
        rec.ingredients.forEach((ing) => {
          const parsed = scaleIngredient(
            typeof ing === 'string' ? { item: ing } : ing,
            item.scale,
          );
          parsed.recipe = rec.title;
          parsed.recipeShortId = rec.shortId;
          ingredients.push(parsed);
        });
      }

      if (item.extraIngredients) {
        item.extraIngredients.forEach((ing) => {
          const parsed = scaleIngredient(ing, item.scale);
          parsed.recipe = item.customTitle || (rec ? rec.title : 'Custom Item');
          parsed.recipeShortId = rec?.shortId;
          ingredients.push(parsed);
        });
      }
    });

    const activeLayout =
      STORE_LAYOUTS.find((l) => l.id === $layoutId) || STORE_LAYOUTS[0];
    const { buyItems, optionalItems, stapleItems } = processShoppingList(
      ingredients,
      activeLayout,
      $altSelections,
    );

    const combinedBuyItems = [...buyItems, ...stapleItems].sort((a, b) =>
      compareShoppingItems(a, b, activeLayout),
    );

    if (typeof window !== 'undefined') {
      const validKeys = new Set<string>();
      [...combinedBuyItems, ...optionalItems].forEach((item) => {
        validKeys.add(getIngredientKey(item.item));
      });
      shoppingCheckedStore.pruneOrphans(validKeys);
    }

    return { buyItems, optionalItems, stapleItems, combinedBuyItems };
  },
);
