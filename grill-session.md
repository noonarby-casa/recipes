# Grill Session: Shopping List Selected Recipes URL Parameter

## Closed Decisions

### Q1. Target Page & Route Scope

- **Question:** Which page(s) and application views should parse and support this new URL parameter shortcut for selected recipes?
- **Decision:** Scope strictly to the `/shopping-debug/` page.
- **Details:** Main `/planner/` and single recipe pages will not process this shortcut parameter. The URL shortcut is dedicated to driving and sharing selections on `/shopping-debug/`.

### Q2. Query Parameter Name & Shorthand Syntax

- **Question:** What query parameter name should we use on `/shopping-debug/`, and what exact shorthand syntax should represent selecting "all recipes" vs a subset of recipes?
- **Decision:** Parameter name `r`. Use `r=all` for all recipes, otherwise dot-separated shortIds (e.g., `r=chili.tacos.curry`).
- **Details:** Parsing is case-insensitive for `all`. Unknown shortIds in a list are gracefully skipped.

### Q3. Serving Sizes & Portion Overrides in URL

- **Question:** How should serving sizes / portion counts be handled in the URL query parameter?
- **Decision:** Match the `p` parameter encoding from `planUrlSync.ts`: `shortId` directly followed by total portion count digits for non-default servings (e.g., `r=vbc6.crg.tcc8`).
- **Details:**
  - Real catalog `shortId`s are 3-4 letter codes (e.g., `vbc` for Vegetable Bean Chili, `crg` for Chorizo Gnocchi, `tcc` for Thai Chicken Curry).
  - If digits follow the `shortId` (e.g., `vbc6`), portions are set to 6.
  - If no digits are attached (e.g., `crg`), it defaults to the recipe's base yield.
  - `r=all` selects all recipes at their default base yield.

### Q4. Bidirectional URL Synchronization & `r=all` Compression

- **Question:** How should interactive recipe selection changes in `ShoppingDebugApp` update the browser address bar?
- **Decision:** Bi-directional, real-time sync via `history.replaceState`.
- **Details:**
  - Toggling recipes or adjusting serving steppers immediately updates `r=` in the URL.
  - If all catalog recipes are selected at default yields, automatically compress `r=` to `r=all`.
  - If no recipes are selected, remove `r=` from the query parameters.

### Q5. Strict shortId Resolution & Invalid Entry Handling

- **Question:** How should the URL parser handle unrecognized codes or permalinks passed in parameter `r`?
- **Decision:** Strictly use `shortId`s. No fallback to permalinks. Gracefully ignore invalid/unrecognized entries. Always serialize `shortId`s to URL.
- **Details:** Any token in parameter `r` that is not a valid `shortId` (or `all`) is discarded during URL parsing.

### Q6. Interaction with Search / Tag Filters & "Select All"

- **Question:** How should `r=all` interact with active UI search filters or category/favorite toggles, and how should "Select All" update the URL when filters are active?
- **Decision:** `r=all` represents all catalog recipes. "Select All" with no filters sets `r=all`. "Select All" with active filters selects visible recipes and serializes explicit shortIds.
- **Details:**
  - Opening `r=all` selects all catalog recipes regardless of initial filter state.
  - Clicking "Select All" when a filter is applied adds only the filtered recipes to selection and serializes explicit `shortId`s to `r=`.
  - If the resulting selection equals all catalog recipes at base yields, it auto-compresses back to `r=all`.

### Q7. Optional Store Layout Query Parameter (`l`)

- **Question:** Should `/shopping-debug/` also support an optional store layout parameter (e.g. `l=standard` or `l=market-basket-pnh`)?
- **Decision:** Yes, support parameter `l` for store layout syncing on `/shopping-debug/`.
- **Details:**
  - Valid layout IDs: `market-basket-pnh` (default), `standard`, `dairy-first`, `meat-first`.
  - Reading `l=` sets the store layout state. If omitted, uses default layout `market-basket-pnh`.
  - Writing `l=` updates URL state via `history.replaceState`. Default layout `market-basket-pnh` is omitted from URL for clean links.

## Open Questions

_(All design decisions resolved!)_
