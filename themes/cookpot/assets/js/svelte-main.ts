import { mount } from 'svelte';
import type { Component } from 'svelte';
import { initDarkMode } from './darkmode';
import { initRandomRecipe } from './random';
import MealPlannerApp from './components/apps/MealPlannerApp.svelte';
import HomepageSearchApp from './components/apps/HomepageSearchApp.svelte';
import SingleRecipeScaler from './components/apps/SingleRecipeScaler.svelte';
import OverlayPanel from './components/primitives/OverlayPanel.svelte';
import RecipeSidesInjector from './components/domain/RecipeSidesInjector.svelte';
import InlineTimer from './components/domain/InlineTimer.svelte';
import ToggleGroup from './components/primitives/ToggleGroup.svelte';
import FontSizeController from './components/primitives/FontSizeController.svelte';
import SettingsModal from './components/domain/SettingsModal.svelte';
import RecipeShoppingList from './components/domain/RecipeShoppingList.svelte';

/** Registry mapping component names to Svelte component definitions. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COMPONENT_REGISTRY: Record<string, Component<any>> = {
  MealPlannerApp,
  HomepageSearchApp,
  SingleRecipeScaler,
  OverlayPanel,
  RecipeSidesInjector,
  InlineTimer,
  ToggleGroup,
  FontSizeController,
  SettingsModal,
  RecipeShoppingList,
};

interface MountConfig {
  component: string;
  selector: string;
  many?: boolean;
  clearInner?: boolean;
  props?: (el: HTMLElement, index: number) => Record<string, unknown>;
}

/** Pre-configured legacy DOM mounting targets mapped to registry components. */
const LEGACY_ISLAND_CONFIGS: MountConfig[] = [
  { component: 'MealPlannerApp', selector: '#meal-planner' },
  { component: 'HomepageSearchApp', selector: '#homepage-search-mount' },
  {
    component: 'SingleRecipeScaler',
    selector: '#recipe-scale-mount',
    clearInner: true,
    props: (el) => ({
      baseServings: parseInt(el.dataset['baseServings'] ?? '4', 10),
      shortId: el.dataset['shortId'],
    }),
  },
  { component: 'OverlayPanel', selector: '#overlay-panel-mount' },
  { component: 'RecipeSidesInjector', selector: '#recipe-sides-mount' },
  { component: 'FontSizeController', selector: '#font-size-controller-mount' },
  { component: 'SettingsModal', selector: '#settings-modal-mount' },
  { component: 'RecipeShoppingList', selector: '#recipe-shopping-list-mount' },
  {
    component: 'InlineTimer',
    selector: '.recipe-timer',
    many: true,
    clearInner: true,
    props: (el, index) => ({
      duration: el.dataset['duration'] ?? '',
      index,
      target: el,
    }),
  },
  {
    component: 'ToggleGroup',
    selector: '.toggle-group-mount',
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

      return { options, selectedId, onChange: () => {} };
    },
  },
];

function mountComponent(
  componentName: string,
  el: HTMLElement,
  index: number,
  options: {
    clearInner?: boolean;
    customProps?: Record<string, unknown>;
    propsExtractor?: (
      el: HTMLElement,
      index: number,
    ) => Record<string, unknown>;
  } = {},
) {
  const component = COMPONENT_REGISTRY[componentName];
  if (!component) {
    console.warn(`[SvelteMount] Unknown component "${componentName}"`);
    return;
  }

  if (options.clearInner) {
    el.innerHTML = '';
  }

  let finalProps: Record<string, unknown> = {};
  if (el.dataset['props']) {
    try {
      finalProps = JSON.parse(el.dataset['props']);
    } catch (err) {
      console.error(
        `[SvelteMount] Invalid JSON in data-props for ${componentName}`,
        err,
      );
    }
  } else if (options.propsExtractor) {
    finalProps = options.propsExtractor(el, index);
  } else if (options.customProps) {
    finalProps = options.customProps;
  }

  mount(component, { target: el, props: finalProps });
}

function initSvelteIslands() {
  // 1. Declarative data-attribute island mounting ([data-svelte-component])
  const declarativeElements = Array.from(
    document.querySelectorAll<HTMLElement>('[data-svelte-component]'),
  );
  declarativeElements.forEach((el, index) => {
    const name = el.dataset['svelteComponent'];
    if (name) {
      el.setAttribute('data-svelte-mounted', 'true');
      const clearInner = el.dataset['clearInner'] === 'true';
      mountComponent(name, el, index, { clearInner });
    }
  });

  // 2. Legacy island selector mounting
  LEGACY_ISLAND_CONFIGS.forEach((cfg) => {
    const targets = cfg.many
      ? Array.from(document.querySelectorAll<HTMLElement>(cfg.selector))
      : Array.from(
          [document.querySelector<HTMLElement>(cfg.selector)].filter(
            (x): x is HTMLElement => x !== null,
          ),
        );

    targets.forEach((el, index) => {
      if (el.hasAttribute('data-svelte-mounted')) {
        return;
      }
      el.setAttribute('data-svelte-mounted', 'true');

      mountComponent(cfg.component, el, index, {
        clearInner: cfg.clearInner,
        propsExtractor: cfg.props,
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  initRandomRecipe();
  initSvelteIslands();
});
