# Grill Session: Shopping List Collapsible Sections & Category Sorting

## Closed Decisions

### Q1. Scope & Default Expansion State

- **Question:** Which shopping list views should feature collapsible sections, and what should their initial expansion state be when the page or list loads?
- **Decision:** Scope to both `ShoppingListColumn.svelte` (Meal Planner / Shopping Debug) and `RecipeShoppingList.svelte` (Single recipe view). All active sections are expanded by default when loaded.
- **Details:**
  - Non-empty store sections load expanded so users see all needed items immediately.
  - Sections can be manually collapsed by clicking their header.

### Q2. Category Sorting & Sub-sorting Rules within Sections

- **Question:** How should items inside a store section be ordered when a section contains multiple category types (for example, Produce containing `fresh-produce`, `fresh-herbs`, and `tofu-tempeh`)?
- **Decision:** Order by category index in `StoreSection.categories`, then alphabetically by item name. No extra visual sub-headers.
- **Details:**
  - Items are sorted first by the order of `item.category` in `section.categories`.
  - Ties are broken by `a.item.localeCompare(b.item)`.
  - Maintains a clean single list under each section header.

### Q3. Visual Header & Interaction Pattern for Collapsible Sections

- **Question:** What visual design and interaction pattern should we use for the collapsible section headers?
- **Decision:** Interactive `<button>` inside `.shopping-section-header` matching existing minimal column header styling, with an inline chevron indicator, item count badge, and `aria-expanded` attributes.
- **Details:**
  - Maintains the existing minimal typography and subtle aesthetic of `.compound-list-header`.
  - Accessible `<button type="button">` toggles collapse state via keyboard/mouse.
  - Subtle rotating chevron and item count (e.g., `(3)`).

### Q4. Global Controls & State Persistence

- **Question:** Should we add global "Expand All / Collapse All" toggle controls, and how should section collapse states persist across session navigation?
- **Decision:** Add a subtle "Expand All / Collapse All" action button in the list titlebar/toolbar. Collapse state persists in session reactivity state.
- **Details:**
  - Standardizes quick expand/collapse across all sections.
  - State is held in Svelte component `$state` per session, preserving section states across layout switches.

### Q5. Checked Items & Optional Sections Behavior

- **Question:** How should section collapse states interact when items are checked off, and should the Optional items section also be collapsible with category sorting?
- **Decision:** Sections remain open when fully checked off (showing `✓ x/x` indicator). Optional items section is also collapsible and category-sorted.
- **Details:**
  - Sections do not auto-collapse when completed; users retain manual collapse control.
  - Completed count (`✓ x/x`) updates dynamically.
  - The Optional section adopts the same collapsible header and category sorting logic.

## Open Questions

_(All design decisions resolved!)_
