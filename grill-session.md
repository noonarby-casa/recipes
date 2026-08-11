# Grill Session: Shopping List Debug Page

## Closed Decisions

### Q1. Page Route & Title

- **Question:** What should the URL route path and page title be for this debug page?
- **Decision:** Route path `/shopping-debug/`, title "Shopping List Debugger", template layout `shopping-debug`, added to `_content.gotmpl`.
- **Details:** Accessible directly via URL like `/timers/`, included in sitemap, excluded from primary nav bar.

### Q2. Selection State Scope

- **Question:** Should recipe selection state sync with `plannerStore` or be isolated?
- **Decision:** Isolated local Svelte state.
- **Details:** Debug selections are in-memory and will not mutate or overwrite the active user meal plan in localStorage.

### Q3. Recipe Servings & Scaling Controls

- **Question:** Should each selected recipe row include inline servings stepper controls?
- **Decision:** Yes, include inline servings adjustment controls (`+`/`-` or stepper).
- **Details:** Allows quick testing of unit scaling & quantity aggregation algorithms.

### Q4. Custom Left Panel Recipe Row Layout

- **Question:** What should the custom left-panel recipe row layout look like?
- **Decision:** Icon on far left, card/row border highlighting when selected (no checkbox), title in middle, inline serving controls on right.
- **Details:** Clicking a row toggles selection with active border styles matching the recipe selector modal (`isPlanned` style).

### Q5. "Select All" & "Clear All" Scope & Header Counter

- **Question:** How should "Select All" interact with active filters, and what should the left panel header display?
- **Decision:** "Select All" selects all currently visible/filtered recipes; "Clear All" deselects all recipes. Header displays a badge showing total count of selected recipes (e.g., "Recipes (3 selected)").
- **Details:** Added selection counter badge to left panel header.

### Q6. Store Picker Modal & Layout Scope

- **Question:** Should store layout selection on the debug page mutate global store settings or be isolated?
- **Decision:** Isolated debug store layout state.
- **Details:** Changing store layout in the debug page's StorePicker modal updates the debug list view in-memory without altering the user's global settings in localStorage.

### Q7. Responsive Mobile Layout

- **Question:** How should the two-column view adjust on small/mobile screens?
- **Decision:** Re-use the primitive `ToggleGroup` component for mobile segmented tabs (`[ Recipes (3) ] | [ Shopping List (12) ]`).
- **Details:** Uses `ToggleGroup` with `badgeCount` on viewports `<768px`.

### Q8. Shopping List Interactivity & Parity

- **Question:** How should checked state behave, and how should display logic align with the live meal plan page?
- **Decision:** Isolated checked item toggle state; exact identical display logic as `ShoppingListColumn` / `processShoppingList`.
- **Details:** Guaranteed 1:1 display parity so selecting identical recipes in the debug page produces the exact output shown on the live meal planner.

### Q9. Custom Dishes & Ingredients Scope

- **Question:** Should custom dishes or custom ingredient entry be supported on the debug page?
- **Decision:** No, exclude custom features from the debug page.
- **Details:** Focus purely on catalog recipes from `recipesStore`.

## Open Questions

_(All design decisions resolved!)_
