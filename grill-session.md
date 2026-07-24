# Grill Session: Adapting Recipe Selector Modal for Custom Recipes / Ingredients

## Closed Decisions

### Q1. Modal Architecture & Mobile Switcher

- **Question:** How should the recipe selector modal structure its layout for browsing recipes vs. entering custom recipes/ingredients?
- **Decision:** Mirror `ExportModal.svelte` with a 2-column grid on desktop (Browse Recipes left, Custom Entry right) and a segmented `ToggleGroup` tab switcher on mobile ("Browse Recipes" vs. "Custom Entry").
- **Details:**
  - Desktop (≥768px): Dual column view allows side-by-side search/browse and custom creation without switching tabs.
  - Mobile (<768px): Top segmented control toggles `browse` vs `custom` pane using `.mobile-hidden` rules matching Export Modal styling.

### Q2. Custom Entry Input Granularity & Form Fields

- **Question:** What input fields and interaction pattern should the custom dish panel feature in the selector modal?
- **Decision:** Dish title input + Icon Selector & Base Servings Picker row + interactive item-by-item sides/ingredients builder.
- **Details:**
  - Title Input: Required text field for custom dish name.
  - Icon & Servings Row: Side-by-side `IconPicker.svelte` + Base Servings `PortionPicker` (defaulting to 4 servings).
  - Sides Builder: Modular `IngredientsEditor.svelte` component with single-line input, "Add" button, live parsed breakdown preview (`Qty`, `Unit`, `Item`, `Prep`), and removable item chips/list.
  - Reuses `parseRawUserInput` from `simple-parser.ts` to convert inputs to `IngredientInput[]`.

### Q3. Persistence & Reusability Scope

- **Question:** Should custom recipes/ingredients created in the modal be saved strictly to the active meal plan, or saved locally for reuse across future plans?
- **Decision:** Plan-Bound Entries (matching sides & current storage architecture).
- **Details:**
  - Stored directly in `localStorage['noonarby-meal-plan']` via `plannerStore`.
  - Clearing the meal plan or removing the item removes the custom item.

### Q4. URL Encoding & Storage Sync Specification

- **Question:** How should custom recipes be represented in `p` and `x` URL parameters and `localStorage`?
- **Decision:** Compact `c` code in `p` parameter + Base64Url payload in `x` parameter.
- **Details:**
  - `p` Parameter: Uses `c` shortId (e.g. `1.5c` for Friday custom dish). Backward-compatible with legacy `custom` code.
  - `x` Parameter: Base64Url payload containing `<index>|<customTitle>|<icon>|<ingredients...>` to preserve unconstrained titles, icon selection, and item breakdown.
  - `localStorage`: Stores `PlannedItem` with `customTitle`, `icon`, and `extraIngredients` array.

### Q5. Post-Selection Editing & Card Presentation

- **Question:** How should custom recipes be rendered on the planner grid and edited after selection?
- **Decision:** Identical card layout to catalog recipes in `RecipeCard.svelte` + full editing in `PlannedRecipeDetailsModal.svelte`.
- **Details:**
  - Uses `RecipeCard` with same grid bounds, portion picker, edit details, swap, and remove buttons.
  - Displays a clean "Custom" pill badge overlay on the card.
  - Clicking opens `PlannedRecipeDetailsModal.svelte` to edit title, portions, sides, or icon.

### Q6. Custom Recipe Image Placeholder & Icon Picker

- **Question:** What replaces the recipe image header for custom dishes?
- **Decision:** Stylized SVG gradient header with user-selectable food icon (defaulting to Utensils / Chef Hat).
- **Details:**
  - Icon Picker in `RecipeSelectorModal` and `PlannedRecipeDetailsModal` allowing selection between food icons (e.g. Utensils, Chef Hat, Recipe Book, Pizza, Bowl, BBQ).
  - Default icon: `utensils`.
  - Icon key stored on `PlannedItem.icon` and synced in `x` URL parameter.

### Q7. Meal Plan Interactions & Global Portion Scaling

- **Question:** How do custom recipes interact with meal plan features (portion scaling, conflict detection, auto-generation, shopping list)?
- **Decision:** Full integration across all meal plan features.
- **Details:**
  - Global Portion Scaler: Custom items assume a base of 4 servings, allowing global `+` / `-` portion buttons in `MealPlannerApp.svelte` to scale custom item portions and ingredient quantities proportionally.
  - Shopping List: Ingredients from custom items are automatically aggregated, scaled, and attributed to `item.customTitle` in `stores/shopping.ts`.
  - Conflict Resolution & Auto-Planner: Handled natively via existing `arePlansEqual` check and day-slot detection in `plannerStore`.

## Open Questions

_(All design decisions resolved!)_
