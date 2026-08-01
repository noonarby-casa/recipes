# Grill Session: Ensuring Favorite Recipes Can Be Filtered in Meal Planner Edit UX

## Closed Decisions

### Q1. Primary UX Entry Point for Favorites Filtering

- **Question:** Where should the UI control for filtering by favorite recipes be exposed within the Meal Planner edit experience?
- **Decision:** Both `RecipeSelectorModal.svelte` (inline heart button next to search input) and `FiltersModal.svelte` (dedicated toggle row).
- **Details:**
  - Inline heart button in `RecipeSelectorModal.svelte` allows zero-click toggling while browsing/adding recipes to a day.
  - Toggle in `FiltersModal.svelte` provides consistency when configuring broader recipe search filters for the planner.

### Q2. Scope & Persistence of Favorites Filter

- **Question:** How should the "Favorites Only" state behave regarding persistence and scope across the application?
- **Decision:** Bind directly to `$filtersStore.favoritesOnly` (Option A).
- **Details:**
  - Persisted in `localStorage` (`noonarby-meal-plan-filters`) and synchronized with URL search params (`?favorites=1`).
  - Single global store guarantees consistent behavior between homepage search and meal planner modal views.

### Q3. Handling Empty Favorites State & Active Filter Notice Banner

- **Question:** How should the UX communicate active favorite filtering and zero-result states in the recipe selector?
- **Decision:** Option A (enhanced notice banner + targeted empty state with recovery action).
- **Details:**
  - Include `Favorites only` in `filtersNotice` within `RecipeSelectorModal.svelte` when active.
  - When 0 results match with `favoritesOnly` active, display targeted `EmptyState` text ("No favorite recipes match your search") and a direct action button ("Show All Recipes") to disable the filter in one click.

### Q4. Visual Control Style & Micro-Interactions

- **Question:** How should the Favorites Filter controls be styled visually in `RecipeSelectorModal.svelte` and `FiltersModal.svelte`?
- **Decision:** Option A (circular heart button in selector + dedicated tally pill in filters modal).
- **Details:**
  - In `RecipeSelectorModal.svelte`: Circular heart icon button beside search input, using `--heart-color` fill and `pop-anim` micro-animation matching `FavoriteButton.svelte`.
  - In `FiltersModal.svelte`: Top-level toggle pill (`♥ Favorites Only`) with tally count of favorited recipes.

### Q5. Auto-Planner ("Generate Dinner Plan") Feedback & Edge Cases

- **Question:** How should the auto-planner handle cases where `favoritesOnly` is active but no favorited dinner recipes are available?
- **Decision:** Option A (replace native `alert()` with in-app banner/toast offering fallback).
- **Details:**
  - Replaces native browser `alert()` with a smooth in-app notice banner/toast.
  - Offers single-click action button ("Generate from All Recipes") to proceed without getting blocked.

### Q7. Automated Testing Strategy (Vitest Unit & Playwright E2E Specs)

- **Question:** How will automated tests verify the favorites filtering feature across unit logic and UI workflows?
- **Decision:** Implement a dual-layer test suite using Vitest (store/filtering logic) and Playwright (E2E browser interactions).
- **Details:**
  - **Unit & Store Tests (`themes/cookpot/assets/js/stores/filters.test.ts` & `planner.test.ts`):**
    - Verify `filterRecipes()` filters recipes correctly when `favoritesOnly: true`.
    - Verify `plannerStore.generateDinnerPlan()` pools favorited dinner recipes and returns `false` when no favorited dinner recipes exist.
    - Verify URL query param synchronization (`?favorites=1`) and `localStorage` persistence.
  - **E2E Playwright Tests (`tests/e2e/meal-plan.spec.ts`):**
    - Test inline heart toggle in `RecipeSelectorModal.svelte` and verify `filtersNotice` updates.
    - Test empty state recovery ("Show All Recipes" button) when zero favorited recipes match a search query.
    - Test top-level `♥ Favorites Only` toggle pill and tally count in `FiltersModal.svelte`.
    - Test auto-planner fallback banner ("Generate from All Recipes") when generating with 0 favorited recipes.
  - **Verification:** Validated using `pnpm run test`, `pnpm run test:e2e`, and `pnpm run ci`.

## Open Questions

_(All design decisions resolved)_
