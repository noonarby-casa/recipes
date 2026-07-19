# Noonarby Casa Recipes: Svelte Migration — Part 2

This document continues from [svelte-migration.md](./svelte-migration.md) and
covers the remaining cleanup tasks after the core component migration was
completed.

---

## 🗺️ Overview

| Task   | Description                                                            | Status  |
| ------ | ---------------------------------------------------------------------- | ------- |
| Task 1 | Migrate `OverlayContainer` + `initRecipePagePlanIntegration` to Svelte | 🔲 TODO |
| Task 2 | Extract `getSiteBasePath` to a shared utility                          | 🔲 TODO |
| Task 3 | Migrate styles into scoped Svelte `<style>` blocks                     | 🔲 TODO |
| Task 4 | Vitest component tests                                                 | 🔲 TODO |

---

### 🧩 Task 1: Migrate `OverlayContainer` + `initRecipePagePlanIntegration`

**Objective:** Replace the imperative `OverlayContainer` class singleton and the
legacy `initRecipePagePlanIntegration()` function with a composed Svelte
hierarchy. After this task, `overlay-container.ts` and the
`initRecipePagePlanIntegration` export from `meal-plan.ts` can both be deleted.

#### Background

`initRecipePagePlanIntegration` (in [meal-plan.ts](../themes/cookpot/assets/js/meal-plan.ts))
does two things when `?from=plan` is in the URL:

1. Creates a "Back to Meal Plan" `<a>` and registers it with `OverlayContainer`.
2. Reads `localStorage`, finds the matching `PlannedItem` by `instanceId` or
   pathname, and appends its `extraIngredients` as a "Sides" section into the
   static `.recipe-ingredients-list`.

[OverlayContainer](../themes/cookpot/assets/js/components/overlay-container.ts)
is a class singleton that manages a `position: fixed` panel in `document.body`,
containing the toggle button, two minimized FABs (dashboard, back), and the
actual child content nodes appended by `TimersManager.svelte` and
`initRecipePagePlanIntegration`.

#### Chosen approach: A2 — Direct Svelte composition

`OverlayPanel.svelte` becomes the single fixed container. It **directly
imports and renders** `TimersManager` and `PlanBackButton` as Svelte children.
No portals are needed. Each component owns its own `<style>` block.
`svelte-main.ts` mounts `OverlayPanel` once globally; the two children are
no longer mounted separately via `getElementById` entries in `svelte-main.ts`.

```
OverlayPanel.svelte  (mounts once on #overlay-panel-mount in baseof.html)
  ├── <TimersManager />    ← renders nothing if no active dashboard timers
  └── <PlanBackButton />   ← renders nothing if ?from=plan is absent
```

`RecipeSidesInjector.svelte` is separate — it renders inside
`.recipe-ingredients-list` on single recipe pages and is not part of the overlay.

---

#### 1a. New store: `stores/overlay.ts`

```typescript
import { writable, derived } from 'svelte/store';

interface OverlayState {
  isMinimized: boolean;
  backHref: string | null;
  hasDashboard: boolean;
}

const MINIMIZED_KEY = 'cooking-dashboard-minimized';

const store = writable<OverlayState>({
  isMinimized: localStorage.getItem(MINIMIZED_KEY) === 'true',
  backHref: null,
  hasDashboard: false,
});

export const overlayStore = {
  subscribe: store.subscribe,
  setBackHref(href: string | null) {
    store.update((s) => ({ ...s, backHref: href }));
  },
  setHasDashboard(has: boolean) {
    store.update((s) => ({ ...s, hasDashboard: has }));
  },
  minimize() {
    localStorage.setItem(MINIMIZED_KEY, 'true');
    store.update((s) => ({ ...s, isMinimized: true }));
  },
  expand() {
    localStorage.setItem(MINIMIZED_KEY, 'false');
    store.update((s) => ({ ...s, isMinimized: false }));
  },
  toggle() {
    store.update((s) => {
      const next = !s.isMinimized;
      localStorage.setItem(MINIMIZED_KEY, String(next));
      return { ...s, isMinimized: next };
    });
  },
};

/** True when the overlay has any content to display. */
export const overlayVisible = derived(
  store,
  ($s) => $s.hasDashboard || $s.backHref !== null,
);
```

---

#### 1b. New component: `components/OverlayPanel.svelte`

The single fixed container. Imports `TimersManager` and `PlanBackButton`
directly — no mount-point lookups. Each child renders nothing when inactive,
so the `{#if $overlayVisible}` guard keeps the panel fully hidden on pages
where neither feature is active (e.g., the homepage, planner).

```svelte
<script lang="ts">
  import { overlayStore, overlayVisible } from '../stores/overlay';
  import TimersManager from './TimersManager.svelte';
  import PlanBackButton from './PlanBackButton.svelte';

  const state = $derived($overlayStore);
</script>

{#if $overlayVisible}
  <div class="overlay-container" class:is-minimized={state.isMinimized}>
    <button
      type="button"
      class="overlay-toggle-btn"
      aria-label={state.isMinimized ? 'Expand overlay' : 'Minimize overlay'}
      aria-expanded={!state.isMinimized}
      onclick={() => overlayStore.toggle()}
    >
      <!-- SVG icon -->
    </button>

    {#if state.hasDashboard}
      <button
        type="button"
        class="minimized-fab fab-dashboard"
        aria-label="Restore Cooking Dashboard"
        onclick={() => overlayStore.expand()}
      ><!-- SVG icon --></button>
    {/if}

    {#if state.backHref}
      <button
        type="button"
        class="minimized-fab fab-back"
        aria-label="Back to Meal Plan"
        onclick={() => { window.location.href = state.backHref!; }}
      ><!-- SVG icon --></button>
      <a
        href={state.backHref}
        class="plan-back-btn btn-brand"
        class:hidden={state.isMinimized}
      >
        <!-- SVG arrow --> <span>Back to Meal Plan</span>
      </a>
    {/if}

    <TimersManager />
  </div>
{/if}

<style>
  /* All overlay container layout and FAB styles live here.
     Replaces components/overlay-container.css in full. */
  .overlay-container { … }
  .overlay-toggle-btn { … }
  .minimized-fab { … }
  .plan-back-btn { … }
  .hidden { display: none; }
</style>
```

---

#### 1c. Refactor: `components/TimersManager.svelte`

Replace the imperative `OverlayContainer.getInstance().add/remove(element)`
calls with `overlayStore.setHasDashboard()`. Remove `bind:this` and the
`OverlayContainer` import entirely. The minimize hide/show that was
previously driven by `.overlay-container.is-minimized #cooking-dashboard`
(a global parent–child CSS selector) becomes a reactive class binding read
from `overlayStore`.

```diff
- import { OverlayContainer } from './overlay-container';
+ import { overlayStore } from '../stores/overlay';

- let element = $state<HTMLElement | null>(null);

  $effect(() => {
-   const overlay = OverlayContainer.getInstance();
-   if (element) {
-     if (dashboardTimers.length > 0) {
-       if (!overlay.has(element)) overlay.add(element);
-     } else {
-       if (overlay.has(element)) overlay.remove(element);
-     }
-   }
+   overlayStore.setHasDashboard(dashboardTimers.length > 0);
  });

  onMount(() => {
    recipeUrl = window.location.pathname;
    timersStore.syncWithStorage();
    return () => {
-     if (element) OverlayContainer.getInstance().remove(element);
+     overlayStore.setHasDashboard(false);
    };
  });
```

Add a reactive `minimized` binding and a scoped `<style>` block:

```svelte
<script lang="ts">
  import { overlayStore } from '../stores/overlay';
  const minimized = $derived($overlayStore.isMinimized);
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  id="cooking-dashboard"
  class="cooking-dashboard"
  class:hidden={minimized}
  tabindex="0"
>
  …existing timer markup…
</div>

<style>
  .hidden { display: none; }
  /* All .cooking-dashboard styles moved here from timers.css / meal-plan.css */
</style>
```

---

#### 1d. New component: `components/PlanBackButton.svelte`

No DOM manipulation. Signals state to `overlayStore` — `OverlayPanel` renders
the actual `<a>` link declaratively using `state.backHref`.

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { overlayStore } from '../stores/overlay';
  import { getSiteBasePath } from '../utils/site';

  onMount(() => {
    const fromPlan =
      new URLSearchParams(window.location.search).get('from') === 'plan';
    if (fromPlan) {
      overlayStore.setBackHref(getSiteBasePath() + 'plan/');
    }
  });

  onDestroy(() => {
    overlayStore.setBackHref(null);
  });
</script>

<!-- No visible markup — OverlayPanel renders the back link reactively -->
```

---

#### 1e. New component: `components/RecipeSidesInjector.svelte`

Mounts on `#recipe-sides-mount` inside `.recipe-ingredients-list` in
[single.html](../themes/cookpot/layouts/single.html). Reads `plannerStore`
(already hydrated from `localStorage` — no extra parse), derives the matching
`PlannedItem`, and renders the "Sides" section as real
`<li class="recipe-ingredient" data-*>` elements so that `SingleRecipeScaler`'s
`scaleIngredientsInDOM` automatically picks them up for scaling.

```svelte
<script lang="ts">
  import { plannerStore } from '../stores/planner';
  import { formatItemQuantity } from '../units';

  const urlParams = new URLSearchParams(window.location.search);
  const fromPlan = urlParams.get('from') === 'plan';
  const instanceId = urlParams.get('instanceId');
  const currentPath = window.location.pathname;
  const norm = (p: string) => p.replace(/\/+$/, '').replace(/^\/+/, '');

  const sides = $derived.by(() => {
    if (!fromPlan) return [];
    const item = $plannerStore.plan.find((p) =>
      instanceId
        ? p.instanceId === instanceId
        : p.permalink
          ? norm(p.permalink) === norm(currentPath)
          : false,
    );
    return item?.extraIngredients ?? [];
  });
</script>

{#if sides.length > 0}
  <h3 class="ingredient-category compound-list-header">Sides</h3>
  <ul class="recipe-ingredients-sublist compound-list-items">
    {#each sides as ing (ing.item)}
      {@const qtyVal =
        ing.qty !== undefined
          ? Array.isArray(ing.qty) ? ing.qty[0] : ing.qty
          : null}
      {@const formatted = formatItemQuantity(qtyVal, ing.unit ?? '', ing.item, true)}
      <li
        class="recipe-ingredient"
        data-item={ing.item}
        data-qty={qtyVal ?? undefined}
        data-unit={ing.unit ?? undefined}
        data-desc={ing.desc ?? undefined}
        data-prep={ing.prep ?? undefined}
      >
        {#if qtyVal !== null}
          <span class="recipe-quantity"
                data-base-qty={qtyVal}
                data-unit={ing.unit ?? ''}>{formatted.qtyStr}</span>{' '}
        {/if}
        {ing.desc ? `${ing.desc} ` : ''}{formatted.itemStr}{ing.prep ? `, ${ing.prep}` : ''}
      </li>
    {/each}
  </ul>
{/if}
```

---

#### 1f. Layout changes

**[baseof.html](../themes/cookpot/layouts/baseof.html)** — add the global
overlay mount point before `</body>`:

```diff
+ <div id="overlay-panel-mount"></div>
  </body>
```

**[single.html](../themes/cookpot/layouts/single.html)** — add the sides
injector mount inside the ingredients list; remove `#recipe-timers-mount`
(now a Svelte child of `OverlayPanel`, not a separately mounted island);
add the back-button mount:

```diff
  <div class="recipe-ingredients-list compound-list">
    {{ range .Params.ingredients }}…{{ end }}
+   <div id="recipe-sides-mount"></div>
  </div>

- <div id="recipe-timers-mount"></div>
+ <div id="recipe-plan-back-mount"></div>
```

---

#### 1g. Changes to `svelte-main.ts`

```diff
- import TimersManager from './components/TimersManager.svelte';
+ import OverlayPanel from './components/OverlayPanel.svelte';
  import RecipeSidesInjector from './components/RecipeSidesInjector.svelte';
  import PlanBackButton from './components/PlanBackButton.svelte';

- // Timers — previously a separate island
- const timersTarget = document.getElementById('recipe-timers-mount');
- if (timersTarget) {
-   mount(TimersManager, { target: timersTarget });
- }

+ // Overlay panel — mounts globally; TimersManager is a composed child
+ const overlayTarget = document.getElementById('overlay-panel-mount');
+ if (overlayTarget) {
+   mount(OverlayPanel, { target: overlayTarget });
+ }

  // Single recipe extras
  const sidesTarget = document.getElementById('recipe-sides-mount');
  if (sidesTarget) {
    mount(RecipeSidesInjector, { target: sidesTarget });
  }

  const planBackTarget = document.getElementById('recipe-plan-back-mount');
  if (planBackTarget) {
    mount(PlanBackButton, { target: planBackTarget });
  }
```

---

#### 1h. Cleanup after verification

- Remove `import { initRecipePagePlanIntegration } from './meal-plan'` and
  its call from [main.ts](../themes/cookpot/assets/js/main.ts).
- Delete [overlay-container.ts](../themes/cookpot/assets/js/components/overlay-container.ts).
- Delete [components/overlay-container.css](../themes/cookpot/assets/css/components/overlay-container.css)
  once its rules have been moved into `OverlayPanel.svelte`'s `<style>` block.

---

### 🧩 Task 2: Extract `getSiteBasePath` to a shared utility

**Objective:** Eliminate the duplicated `getSiteBasePath` function currently
copy-pasted inline into four locations.

**Files with inline copies:**

- [BrowseCard.svelte](../themes/cookpot/assets/js/components/BrowseCard.svelte) (line 15)
- [MealPlannerApp.svelte](../themes/cookpot/assets/js/components/MealPlannerApp.svelte) (line 38)
- [HomepageSearchApp.svelte](../themes/cookpot/assets/js/components/HomepageSearchApp.svelte) (line 79)
- `meal-plan.ts` (line 128) — leave in place until `meal-plan.ts` is deleted

Create `themes/cookpot/assets/js/utils/site.ts`:

```typescript
/**
 * Returns the site base path prefix, accounting for subdirectory deployments.
 * Returns '/recipes/' when deployed under that path, otherwise '/'.
 */
export function getSiteBasePath(): string {
  return window.location.pathname.startsWith('/recipes/') ? '/recipes/' : '/';
}
```

Replace each inline copy with:

```diff
- function getSiteBasePath(): string {
-   return window.location.pathname.startsWith('/recipes/') ? '/recipes/' : '/';
- }
+ import { getSiteBasePath } from '../utils/site';
```

`PlanBackButton.svelte` (Task 1d above) imports from this utility from the start.

---

### 🧩 Task 3: CSS Migration into Scoped Svelte `<style>` Blocks

**Objective:** Move styles out of global CSS files and into the `<style>` blocks
of the Svelte components that own them. Each component becomes fully
self-contained: script, template, and styles in one file. Global CSS files are
deleted once fully drained.

#### Strategy

Migrate one CSS file at a time. After each file's rules are fully moved, delete
the file and remove its `@import` from the Hugo CSS pipeline. Run `pnpm run ci`
after each migration to confirm nothing regressed.

#### File-to-component mapping

| CSS file                           | Owner component(s)                                                                                                                                 | Notes                                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `components/overlay-container.css` | `OverlayPanel.svelte`                                                                                                                              | Migrate as part of **Task 1**                                                     |
| `components/button.css`            | `Button.svelte`                                                                                                                                    |                                                                                   |
| `components/toggle.css`            | `ToggleGroup.svelte`                                                                                                                               |                                                                                   |
| `components/modal.css`             | `FiltersModal.svelte`, `RecipeSelectorModal.svelte`, `PlannedRecipeDetailsModal.svelte`                                                            | Shared rules → one component gets them, others `@import` or duplicate selectively |
| `components/favorites.css`         | `FavoriteButton.svelte`                                                                                                                            |                                                                                   |
| `components/compound-list.css`     | `RecipeSidesInjector.svelte` (for sides list)                                                                                                      | Some rules apply to static Hugo-rendered HTML — keep those `:global`              |
| `components/dropdown.css`          | Whichever component renders the copy-format `<select>`                                                                                             |                                                                                   |
| `components/titlebar.css`          | `DayColumn.svelte`, `CalendarGrid.svelte`                                                                                                          |                                                                                   |
| `components/scrollable.css`        | `scrollable.ts` (vanilla JS) — keep global until that module is migrated or deleted                                                                |                                                                                   |
| `timers.css`                       | `InlineTimer.svelte`, `TimersManager.svelte`                                                                                                       |                                                                                   |
| `recipe-list.css`                  | `RecipeCard.svelte`, `HomepageSearchApp.svelte`                                                                                                    |                                                                                   |
| `meal-plan.css`                    | `MealPlannerApp.svelte`, `CalendarGrid.svelte`, `DayColumn.svelte`, `PlannedRecipeCard.svelte`, `ShoppingListColumn.svelte`, `FiltersModal.svelte` | Largest file — split per component                                                |
| `recipe-single.css`                | `SingleRecipeScaler.svelte`, `RecipeSidesInjector.svelte`; static layout rules → keep `:global`                                                    |                                                                                   |
| `shopping-list.css`                | `ShoppingListColumn.svelte`                                                                                                                        |                                                                                   |
| `global.css`                       | **Keep global** — resets, typography, layout primitives                                                                                            |                                                                                   |
| `variables.css`                    | **Keep global** — CSS custom properties must be unscoped                                                                                           |                                                                                   |
| `sitemap.css`                      | No Svelte component — **keep global**                                                                                                              |                                                                                   |

#### Notes on scoped styles

- Svelte's `<style>` blocks are scoped by default. Use `:global(…)` only for
  styles targeting DOM nodes Svelte doesn't own — e.g., the Hugo-rendered
  `.recipe-ingredient` `<li>` elements that `SingleRecipeScaler` and
  `RecipeSidesInjector` manipulate via `data-*` attributes.
- `vite-plugin-css-injected-by-js` bundles component styles into
  `meal-planner.js` automatically — no extra Vite config needed.
- CSS custom properties defined in `variables.css` are available inside Svelte
  `<style>` blocks as normal since they remain global.

---

### 🧩 Task 4: Vitest Component Tests

**Objective:** Add component-level tests using `@testing-library/svelte`
(already installed). Unit logic tests (`units.test.ts`, `simple-parser.test.ts`)
already exist and pass.

#### Priority components

| Component                    | What to test                                                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OverlayPanel.svelte`        | Renders when `overlayVisible` is true; hidden when false; toggle button flips `is-minimized` class; FABs appear when `hasDashboard`/`backHref` are set |
| `PlanBackButton.svelte`      | Sets `overlayStore.backHref` on mount when `?from=plan` present; clears on unmount; no-ops when param is absent                                        |
| `RecipeSidesInjector.svelte` | Renders Sides `<h3>` + `<li>` elements when store has `extraIngredients` matching the path; renders nothing otherwise                                  |
| `SingleRecipeScaler.svelte`  | Servings increment/decrement; `scaleIngredientsInDOM` updates `.recipe-ingredient` innerHTML                                                           |
| `FavoriteButton.svelte`      | Toggle updates `favoritesStore`; dispatches `favoritesChanged` custom event                                                                            |

#### Test file naming convention

Place test files alongside their components using the `.svelte.test.ts` suffix:

```
themes/cookpot/assets/js/components/OverlayPanel.svelte.test.ts
themes/cookpot/assets/js/components/PlanBackButton.svelte.test.ts
themes/cookpot/assets/js/components/RecipeSidesInjector.svelte.test.ts
…
```
