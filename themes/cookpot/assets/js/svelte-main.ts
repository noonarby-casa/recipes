import { mount } from 'svelte';
import MealPlannerApp from './components/MealPlannerApp.svelte';
import HomepageSearchApp from './components/HomepageSearchApp.svelte';
import SingleRecipeScaler from './components/SingleRecipeScaler.svelte';
import FavoriteButton from './components/FavoriteButton.svelte';
import TimersManager from './components/TimersManager.svelte';
import InlineTimer from './components/InlineTimer.svelte';

function mountAppToTarget(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: any,
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
  mountAppToTarget(MealPlannerApp, 'meal-planner');

  mountAppToTarget(HomepageSearchApp, 'homepage-search-mount');

  mountAppToTarget(SingleRecipeScaler, 'recipe-scale-mount', {
    clearInner: true,
    props: (el) => ({
      baseServings: parseInt(el.dataset['baseServings'] ?? '4', 10),
      shortId: el.dataset['shortId'],
    }),
  });

  mountAppToTarget(FavoriteButton, 'recipe-favorite-mount', {
    props: (el) => ({ shortId: el.dataset['shortId'] ?? '' }),
  });

  mountAppToTarget(TimersManager, 'recipe-timers-mount');

  mountAppToTarget(InlineTimer, '.recipe-timer', {
    many: true,
    clearInner: true,
    props: (el, index) => ({
      duration: el.dataset['duration'] ?? '',
      index,
      target: el,
    }),
  });
});
