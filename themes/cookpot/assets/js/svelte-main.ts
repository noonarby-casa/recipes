import { mount } from 'svelte';
import { initDarkMode } from './darkmode';
import { initRandomRecipe } from './random';
import MealPlannerApp from './components/MealPlannerApp.svelte';
import HomepageSearchApp from './components/HomepageSearchApp.svelte';
import SingleRecipeScaler from './components/SingleRecipeScaler.svelte';
import OverlayPanel from './components/OverlayPanel.svelte';
import RecipeSidesInjector from './components/RecipeSidesInjector.svelte';
import InlineTimer from './components/InlineTimer.svelte';
import ToggleGroup from './components/ToggleGroup.svelte';
import FontSizeController from './components/FontSizeController.svelte';
import SettingsModal from './components/SettingsModal.svelte';
import RecipeShoppingList from './components/RecipeShoppingList.svelte';
import type { Component } from 'svelte';

function mountAppToTarget(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: Component<any>,
  idOrSelector: string,
  options: {
    many?: boolean;
    clearInner?: boolean;
    props?: (el: HTMLElement, index: number) => Record<string, unknown>;
  } = {},
) {
  const { many = false, clearInner = false, props } = options;
  const targets: HTMLElement[] = many
    ? Array.from(document.querySelectorAll<HTMLElement>(idOrSelector))
    : filterNullish([document.getElementById(idOrSelector)]);

  targets.forEach((el, index) => {
    if (clearInner) {
      el.innerHTML = '';
    }
    mount(component, { target: el, props: props?.(el, index) });
  });
}

function filterNullish<T>(arr: (T | null)[]): T[] {
  return arr.filter((x): x is T => x !== null);
}

document.addEventListener('DOMContentLoaded', () => {
  // ---------------------------------------------------------------------------
  // Plain utilities (no Svelte needed — targets Hugo-rendered header elements)
  // ---------------------------------------------------------------------------
  initDarkMode();
  initRandomRecipe();

  // ---------------------------------------------------------------------------
  // Svelte islands
  // ---------------------------------------------------------------------------

  // Meal planning functionality at /plan
  mountAppToTarget(MealPlannerApp, 'meal-planner');

  // Search functionality on homepage and tags/
  mountAppToTarget(HomepageSearchApp, 'homepage-search-mount');

  // Recipe scaling functionality on a recipe page
  mountAppToTarget(SingleRecipeScaler, 'recipe-scale-mount', {
    clearInner: true,
    props: (el) => ({
      baseServings: parseInt(el.dataset['baseServings'] ?? '4', 10),
      shortId: el.dataset['shortId'],
    }),
  });
  // Overlay panel for displaying content in the bottom left of the site
  mountAppToTarget(OverlayPanel, 'overlay-panel-mount');
  mountAppToTarget(RecipeSidesInjector, 'recipe-sides-mount');

  // Font-size controller — single-recipe pages only (no-ops elsewhere)
  mountAppToTarget(FontSizeController, 'font-size-controller-mount');

  // Settings modal — combines theme, text-size, store-layout, and timer-sound controls
  mountAppToTarget(SettingsModal, 'settings-modal-mount');

  // Recipe shopping list — replaces imperative shopping-list.ts
  mountAppToTarget(RecipeShoppingList, 'recipe-shopping-list-mount');

  mountAppToTarget(InlineTimer, '.recipe-timer', {
    many: true,
    clearInner: true,
    props: (el, index) => ({
      duration: el.dataset['duration'] ?? '',
      index,
      target: el,
    }),
  });

  mountAppToTarget(ToggleGroup, '.toggle-group-mount', {
    many: true,
    clearInner: true,
    props: (el) => {
      const rawOptions = el.dataset['options'] ?? '';
      const options = rawOptions.split(',').map((pair) => {
        const parts = pair.split(':');
        const id = parts[0]?.trim() ?? '';
        const label = parts[1]?.trim() ?? id;
        return { id, label };
      });
      const storageKey = el.dataset['storageKey'];
      const selectedId = storageKey
        ? localStorage.getItem(storageKey) || (el.dataset['selected'] ?? '')
        : (el.dataset['selected'] ?? '');

      return {
        options,
        selectedId,
        onChange: () => {},
      };
    },
  });
});
