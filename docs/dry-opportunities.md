# DRY Opportunities — Noonarby Casa Recipes

A structured audit of code duplication across the TypeScript, Svelte, and CSS
layers, grouped by category and ranked roughly by impact.

---

## 1. `formatTime()` — Duplicated in Two Timer Components

| File                                                                                                                                                | Lines  |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| [InlineTimer.svelte](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/components/InlineTimer.svelte#L96-L117)    | 96–117 |
| [TimersManager.svelte](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/components/TimersManager.svelte#L43-L57) | 43–57  |

The `formatTime(seconds: number): string` function body is **byte-for-byte
identical** in both files. The logic handles negative values, hours, minutes,
and seconds padding.

**Fix:** Extract to `themes/cookpot/assets/js/utils/timer.ts` and import it in
both components.

```ts
// utils/timer.ts
export function formatTime(seconds: number): string { … }
```

---

## 2. `instanceId` Generation — Repeated 6× Across Two Files

| File                                                                                                                        | Lines            |
| --------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| [planner.ts](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/stores/planner.ts)         | 48, 71, 286, 342 |
| [planUrlSync.ts](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/stores/planUrlSync.ts) | 235, 271         |

The string template `` `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}` ``
appears six times.

**Fix:** Introduce a shared utility function (same `utils/` folder or inline
in `planner.ts` and re-export):

```ts
export function generateInstanceId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}
```

---

## 3. `getLocalPlanFromStorage()` — Duplicated in Store and Component

| File                                                                                                                                                  | Location |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| [planner.ts](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/stores/planner.ts#L10-L23)                           | L10–23   |
| [MealPlannerApp.svelte](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/components/MealPlannerApp.svelte#L43-L54) | L43–54   |

Both implement the same `localStorage.getItem('noonarby-meal-plan')` parse
logic. `MealPlannerApp` also hard-codes the key string `'noonarby-meal-plan'`
four additional times (lines 91, 147, 201, 465), bypassing the `STORAGE_KEY`
constant that already lives in `planner.ts`.

**Fix:**

1. Export `getLocalPlanFromStorage` from `planner.ts`.
2. Delete the copy in `MealPlannerApp.svelte` and import the exported version.
3. Replace all bare `localStorage.getItem/setItem('noonarby-meal-plan', …)`
   calls in `MealPlannerApp` with calls through the store's API (or the
   exported constant `STORAGE_KEY`).

---

## 4. `localStorage` Guard Boilerplate — Repeated Across All Stores

| File                                                                                                                                          | Occurrences |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| [favorites.ts](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/stores/favorites.ts)                       | 1           |
| [filters.ts](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/stores/filters.ts)                           | 2           |
| [shopping.ts](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/stores/shopping.ts)                         | 4           |
| [overlay.ts](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/stores/overlay.ts)                           | 4           |
| [planner.ts](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/stores/planner.ts)                           | 1           |
| [settings.ts](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/stores/settings.ts)                         | 4           |
| [timers.ts](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/stores/timers.ts)                             | 2           |
| [MealPlannerApp.svelte](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/components/MealPlannerApp.svelte) | 1           |

**~20 occurrences** of either `if (typeof localStorage === 'undefined') …` or
`if (typeof localStorage !== 'undefined') …`. The pattern is identical every
time, and many call sites also wrap in a try/catch with similar `console.error`
formatting.

**Fix:** A tiny `localStorage.ts` utility (or add to the existing empty
`utils/` folder):

```ts
// utils/storage.ts
export const ls = {
  getJson<T>(key: string): T | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (e) {
      console.error(`Error reading "${key}" from localStorage:`, e);
      return null;
    }
  },
  setJson(key: string, value: unknown): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing "${key}" to localStorage:`, e);
    }
  },
  remove(key: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  },
  getString(key: string): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  },
  setString(key: string, value: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
  },
};
```

This alone could eliminate ~60 lines of defensive boilerplate.

---

## 5. Ingredient Quantity Scaling Block — Duplicated 2× in `shopping.ts`

| File                                                                                                                            | Lines                        |
| ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| [shopping.ts](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/stores/shopping.ts#L113-L139) | 113–139 (recipe ingredients) |
| [shopping.ts](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/stores/shopping.ts#L148-L167) | 148–167 (extra ingredients)  |

Both blocks clone an `IngredientInput`, scale its `.qty` (handling both
`number` and `[min, max]` tuples), and scale `.alt?.qty` identically.

**Fix:** Extract a `scaleIngredient(ing: IngredientInput, scale: number): IngredientInput` helper function at the top of `shopping.ts`:

```ts
function scaleIngredient(ing: IngredientInput, scale: number): IngredientInput {
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
```

---

## 6. `plannerStore.update(state => …)` Plan-Mutation Pattern — Repeated 9×

| File                                                                                                                | Methods                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [planner.ts](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/stores/planner.ts) | `addRecipe`, `addCustomItem`, `removeRecipe`, `undoRemove`, `updateScale`, `updateExtraIngredients`, `updateCustomTitle`, `reorderRecipes`, `clearPlan` |

Every mutating method in `planner.ts` follows the same `nextPlan / nextLocal /
if (!state.isPreviewing) localStorage.setItem(…)` boilerplate:

```ts
const nextLocal = state.isPreviewing ? state.localPlan : nextPlan;
if (!state.isPreviewing) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPlan));
}
return { ...state, plan: nextPlan, localPlan: nextLocal };
```

**Fix:** Extract a helper inside `createPlannerStore` (or at module level):

```ts
function commitPlan(
  state: PlannerState,
  nextPlan: PlannedItem[],
): PlannerState {
  const nextLocal = state.isPreviewing ? state.localPlan : nextPlan;
  if (!state.isPreviewing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPlan));
  }
  return { ...state, plan: nextPlan, localPlan: nextLocal };
}
```

This removes ~3 repeated lines from 9 methods = ~27 lines eliminated.

---

## 7. `getKey` / `getIngredientKey` — Near-Duplicate in Two Files

| File                                                                                                                                                          | Function                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| [shopping.ts](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/stores/shopping.ts#L70-L79)                                 | `getIngredientKey(isStaple, unit, rest)` |
| [RecipeShoppingList.svelte](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/components/RecipeShoppingList.svelte#L61-L64) | `getKey(isStaple, unit, item)`           |

Both compute an identical stable key string. `RecipeShoppingList` has a
slightly different variable name (`rest` vs `item`) but the logic is the same.

**Fix:** Delete `getKey` from `RecipeShoppingList.svelte` and import
`getIngredientKey` from `stores/shopping.ts` instead. A tiny rename of the
local parameter is all that's needed.

---

## 8. Shopping List Checklist Item Markup — Duplicated in `ShoppingListColumn.svelte`

| File                                                                                                                                                            | Lines                     |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| [ShoppingListColumn.svelte](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/components/ShoppingListColumn.svelte#L118-L155) | Buy items (L118–155)      |
| [ShoppingListColumn.svelte](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/components/ShoppingListColumn.svelte#L166-L203) | Optional items (L166–203) |

The `<li class="checklist-item">` template including the checkbox, quantity
display, note/detail sub-rendering, and the `sizeNote`/`ingredientNotes`/
`fallbackRecipes` blocks is essentially duplicated between the buy and optional
sections (only difference: `isStaple=false` and no section header for
optional).

**Fix:** Extract a reusable `ChecklistItem.svelte` snippet or component:

```svelte
<!-- ChecklistItem.svelte -->
<script lang="ts">
  let { item, isStaple, notes, formatted, checkedStore } = $props();
</script>
…
```

---

## 9. `getNotesString` / `getKeepNotesString` — Near-Duplicate in `MealPlannerApp.svelte`

| File                                                                                                                                                    | Lines                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| [MealPlannerApp.svelte](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/components/MealPlannerApp.svelte#L256-L302) | `getNotesString`     |
| [MealPlannerApp.svelte](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/components/MealPlannerApp.svelte#L309-L338) | `getKeepNotesString` |

Both functions iterate `item.note.ingredientNotes`, build `groups`, and join
`detailParts`. The only difference is that `getNotesString` includes a
`recipes: string[]` field in each group and appends `"for recipe1, recipe2"`,
while `getKeepNotesString` omits it.

**Fix:** Merge into one function with an optional `includeRecipes` flag:

```ts
function buildNotesString(item: any, includeRecipes = true): string { … }
function formatItemNotes(item: any)     { const s = buildNotesString(item, true);  return s ? ` (${s})` : ''; }
function formatKeepItemNotes(item: any) { const s = buildNotesString(item, false); return s ? ` (${s})` : ''; }
```

---

## 10. `adjustGlobalPortions` / `handleSwapRecipeClick` — Bypass Store API in `MealPlannerApp.svelte`

| File                                                                                                                                                    | Lines                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| [MealPlannerApp.svelte](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/components/MealPlannerApp.svelte#L136-L155) | `adjustGlobalPortions`  |
| [MealPlannerApp.svelte](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/components/MealPlannerApp.svelte#L196-L208) | `handleSwapRecipeClick` |

Both manually call `plannerStore.update(state => …)` with the same
`nextPlan / nextLocal / localStorage.setItem` triple, duplicating the pattern
already extracted in item 6 above. Additionally, they hard-code the storage
key string.

**Fix:** Move these behaviors into proper store actions (`plannerStore.adjustAllPortions(offset, recipes)` and `plannerStore.swapRecipe(instanceId, permalink)`), and call them from the component. This keeps all mutation logic inside the store.

---

## 11. `isVolumeUnit` / `isWeightUnit` — Near-Duplicate in `utils.ts`

| File                                                                                                                                           | Lines                          |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| [shopping-list/utils.ts](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/shopping-list/utils.ts#L311-L319) | `isVolumeUnit`, `isWeightUnit` |

```ts
export function isVolumeUnit(unit: string): boolean {
  const sing = getSingularUnit(unit);
  return sing in UNIT_CONVERSIONS && UNIT_CONVERSIONS[sing].system === 'volume';
}
export function isWeightUnit(unit: string): boolean {
  const sing = getSingularUnit(unit);
  return sing in UNIT_CONVERSIONS && UNIT_CONVERSIONS[sing].system === 'weight';
}
```

**Fix:** Consolidate with a shared helper:

```ts
function isUnitSystem(unit: string, system: 'volume' | 'weight'): boolean {
  const sing = getSingularUnit(unit);
  return sing in UNIT_CONVERSIONS && UNIT_CONVERSIONS[sing].system === system;
}
export const isVolumeUnit = (u: string) => isUnitSystem(u, 'volume');
export const isWeightUnit = (u: string) => isUnitSystem(u, 'weight');
```

---

## Priority Summary

| #   | Duplication                      | Files   | Lines Saved | Effort  |
| --- | -------------------------------- | ------- | ----------- | ------- |
| 4   | `localStorage` guard boilerplate | 8 files | ~60         | Medium  |
| 6   | `commitPlan` pattern in planner  | 1 file  | ~27         | Low     |
| 1   | `formatTime()`                   | 2 files | ~22         | Low     |
| 5   | `scaleIngredient` block          | 1 file  | ~20         | Low     |
| 3   | `getLocalPlanFromStorage` + key  | 2 files | ~20         | Low     |
| 2   | `generateInstanceId()`           | 2 files | ~5          | Trivial |
| 9   | `getNotesString` pair            | 1 file  | ~20         | Low     |
| 7   | `getKey` / `getIngredientKey`    | 2 files | ~5          | Trivial |
| 8   | Checklist item markup            | 1 file  | ~35         | Medium  |
| 10  | Store bypass in MealPlannerApp   | 1 file  | ~20         | Medium  |
| 11  | `isVolumeUnit`/`isWeightUnit`    | 1 file  | ~5          | Trivial |

> [!TIP]
> The highest-ROI starting points are **#4** (the `localStorage` utility),
> **#6** (the `commitPlan` helper), and **#1** (`formatTime` extraction)
> — each is low-effort and immediately makes several files shorter and testable.
