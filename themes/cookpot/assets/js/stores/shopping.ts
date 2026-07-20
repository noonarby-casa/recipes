import { writable, derived } from 'svelte/store';
import { plannerStore } from './planner';
import { recipesStore } from './recipes';
import type { IngredientInput } from '../types';
import { processShoppingList } from '../shopping-list/pipeline';
import {
  getActiveStoreLayoutId,
  STORE_LAYOUTS,
} from '../shopping-list/store-sections';

const CHECKED_STORAGE_KEY = 'noonarby-shopping-checked-items-v2';

function loadCheckedStates(): Record<string, boolean> {
  if (typeof localStorage === 'undefined') {
    return {};
  }
  try {
    const raw = localStorage.getItem(CHECKED_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading checklist checked states:', e);
  }
  return {};
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

export const shoppingCheckedStore = {
  subscribe: checkedStates.subscribe,
  toggle(key: string, isStaple: boolean) {
    checkedStates.update((states) => {
      const current = states[key] !== undefined ? states[key] : isStaple;
      const next = { ...states, [key]: !current };
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(CHECKED_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  },
  setChecked(key: string, checked: boolean) {
    checkedStates.update((states) => {
      const next = { ...states, [key]: checked };
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(CHECKED_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  },
  clearChecked() {
    checkedStates.set({});
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(CHECKED_STORAGE_KEY);
    }
  },
};

export function getIngredientKey(
  isStaple: boolean,
  unit: string,
  rest: string,
): string {
  const stapleStr = isStaple ? 'staple' : 'buy';
  const normalizedUnit = (unit || '').trim().toLowerCase();
  const normalizedRest = (rest || '').trim().toLowerCase().replace(/\s+/g, ' ');
  return `${stapleStr}_${normalizedUnit}_${normalizedRest}`;
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

export const combinedShoppingList = derived(
  [plannerStore, recipesStore, storeLayout],
  ([$planner, $recipes, $layoutId]) => {
    const planItems = $planner.plan;
    if (planItems.length === 0) {
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
          let parsed: IngredientInput;
          if (typeof ing === 'string') {
            parsed = { item: ing };
          } else {
            parsed = JSON.parse(JSON.stringify(ing));
          }

          if (parsed.qty !== undefined) {
            if (Array.isArray(parsed.qty)) {
              parsed.qty = [
                parsed.qty[0] * item.scale,
                parsed.qty[1] * item.scale,
              ];
            } else {
              parsed.qty = parsed.qty * item.scale;
            }
          }
          if (parsed.alt?.qty !== undefined) {
            if (Array.isArray(parsed.alt.qty)) {
              parsed.alt.qty = [
                parsed.alt.qty[0] * item.scale,
                parsed.alt.qty[1] * item.scale,
              ];
            } else {
              parsed.alt.qty = parsed.alt.qty * item.scale;
            }
          }
          parsed.recipe = rec.title;
          ingredients.push(parsed);
        });
      }

      if (item.extraIngredients) {
        item.extraIngredients.forEach((ing) => {
          const parsed: IngredientInput = JSON.parse(JSON.stringify(ing));
          if (parsed.qty !== undefined) {
            if (Array.isArray(parsed.qty)) {
              parsed.qty = [
                parsed.qty[0] * item.scale,
                parsed.qty[1] * item.scale,
              ];
            } else {
              parsed.qty = parsed.qty * item.scale;
            }
          }
          if (parsed.alt?.qty !== undefined) {
            if (Array.isArray(parsed.alt.qty)) {
              parsed.alt.qty = [
                parsed.alt.qty[0] * item.scale,
                parsed.alt.qty[1] * item.scale,
              ];
            } else {
              parsed.alt.qty = parsed.alt.qty * item.scale;
            }
          }
          parsed.recipe = item.customTitle || (rec ? rec.title : 'Custom Item');
          ingredients.push(parsed);
        });
      }
    });

    const activeLayout =
      STORE_LAYOUTS.find((l) => l.id === $layoutId) || STORE_LAYOUTS[0];
    const { buyItems, optionalItems, stapleItems } = processShoppingList(
      ingredients,
      activeLayout,
    );

    const getSection = (category: string) => {
      const section = activeLayout.sections.find((s) =>
        s.categories.includes(category),
      );
      return (
        section ||
        activeLayout.sections.find((s) => s.id === 'other') ||
        activeLayout.sections[activeLayout.sections.length - 1]
      );
    };

    const combinedBuyItems = [...buyItems, ...stapleItems].sort((a, b) => {
      const secA = getSection(a.category);
      const secB = getSection(b.category);
      if (secA.order !== secB.order) {
        return secA.order - secB.order;
      }
      return a.item.localeCompare(b.item);
    });

    return { buyItems, optionalItems, stapleItems, combinedBuyItems };
  },
);
