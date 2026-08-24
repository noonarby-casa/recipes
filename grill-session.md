# Grill Session: Multiple Custom Recipes & Selector Modal Visibility

## Closed Decisions

### Q1. Modal Layout & Custom Entry Discoverability

- **Question:** How should the custom recipe creation entry point be structured inside the recipe selector modal so that adding custom dishes is always immediately obvious and accessible while preserving the two-column desktop / tabbed mobile layout?
- **Decision:** Combine Sticky Footer + Active Action State + Search-to-Custom Bridge:
- **Details:**
  - Make custom form scrollable with a sticky/fixed action footer so the button is always in view.
  - Keep "Add Custom Dish" button visually active; if clicked while title is empty, focus/highlight the title input.
  - In empty search states, show a "Create custom dish for '[query]'" button that switches to Custom tab on mobile and pre-fills title.

### Q2. Swapping vs Adding Custom Recipes

- **Question:** Should custom recipe cards in the meal planner feature a swap/shuffle button?
- **Decision:** Omit the swap/shuffle button on custom recipes.
- **Details:**
  - Custom recipe cards will only show "Edit Details" (pencil) and "Remove" (✕) in edit mode.
  - Prevents accidental destruction of custom titles, icons, and ingredient lists from one-click randomization.

### Q3. Custom Recipe Quick-Fill & Recent Suggestions

- **Question:** How should previously planned custom recipes be suggested/reused in the selector modal without horizontal swiping on mobile and with consistent desktop/mobile styling?
- **Decision:** Alternative 1 (Title Input Autocomplete / Dropdown Suggestions).
- **Details:**
  - Zero vertical clutter when idle; dropdown list of matching recent custom dishes appears when the Title field is focused/typed into.
  - Derived dynamically from `CalendarLedger` history (top recent unique custom dishes).
  - Selecting a suggestion auto-fills the Title, Icon, Base Servings, and Ingredients list.

### Q4. Base Servings & Portion Scaling for Custom Recipes

- **Question:** How should ingredient quantities entered into a custom recipe be scaled when setting/adjusting servings?
- **Decision:** Custom recipes establish an explicit `baseServings` (the 1.0 scale baseline for the entered ingredient amounts).
- **Details:**
  - Entered ingredient amounts correspond to the chosen base servings (e.g., entering a 1-portion smoothie or 6-portion chili).
  - Card portion adjustments scale relative to that base (`scale = currentPortions / baseServings`).
  - `PlannedRecipeDetailsModal` allows modifying the custom dish's base servings, title, icon, and ingredient list post-creation.

### Q5. Shopping List Aggregation & Attribution for Custom Items

- **Question:** How should custom recipe ingredients be displayed, attributed, and merged in the shopping list when multiple custom meals share ingredients?
- **Decision:** Full pipeline consolidation with custom recipe name attribution.
- **Details:**
  - Custom ingredients merge seamlessly with catalog recipes and other custom meals (e.g. adding avocados together).
  - Aisle sorting and package matching rules apply automatically, with unrecognized items routing to the "Other" aisle.
  - Item tooltips and exported text attribute ingredient sources clearly (e.g., "Needed for: Breakfast Tacos (Custom)").

### Q6. URL State Serialization for Multiple Custom Recipes

- **Question:** How should multiple custom recipes with custom base servings be encoded into the URL `x` parameter?
- **Decision:** Option A with Version 2 (`2~<entries>`).
- **Details:**
  - Strict positional syntax: `2~<index>|<title>|<icon>|<baseServings>|<ingredient1>|<ingredient2>...`
  - Unambiguous parsing: field 0 = index, field 1 = title, field 2 = icon, field 3 = baseServings, field 4+ = ingredients.
  - Matches the versioned design of the `p` parameter (`p=2....`).
  - Separated by `~` entries and `|` fields, then Base64URL-encoded for minimal URL size.

### Q7. Standardized Modal Footer Primitive

- **Question:** How should `Modal.svelte` be upgraded to standardize modal footers across the design system?
- **Decision:** Add an optional `footer?: Snippet` and `footerClass?: string` to `Modal.svelte`.
- **Details:**
  - Adopt across `ExportModal` (unifying desktop & mobile copy actions), `StorageDetailsModal` (pinned JSON backup button), and `RecipeSelectorModal` (pinned "Add Custom Dish" button).
  - Pins action buttons cleanly at the bottom with standard border-top separator and responsive padding.

## Open Questions

_(All design questions and branches resolved!)_
