# Recipe Inclusion/Exclusion Filters

This document outlines the design decisions and implementation plan for the meal plan filter improvements.

## Closed Decisions

### Q1. UI/UX: Cycle-on-Click Interaction for Tags

- **Question:** How should the user toggle between Including, Excluding, or resetting a tag filter?
- **Decision:** Each tag filter pill cycles through three states on click: Neutral -> Include (green) -> Exclude (red) -> Neutral.
- **Details:**
  - Reuses the same pill UI without having to split the screen.
  - Prefixes/badges will show visual state (e.g., `+` or green for inclusion, `-` or red for exclusion).

### Q2. UI/UX: Location of Recipe Source Filters

- **Question:** Where should the recipe source filter UI be placed?
- **Decision:** Inside the existing "Filter Recipes by Tag" Modal, below the tag cloud.
- **Details:**
  - Rename modal header to "Filter Recipes".
  - Add a dedicated section "Filter by Source" below the tags cloud.

### Q3. UI/UX: Interaction Model for Recipe Sources

- **Question:** How should the user select recipe sources to include or exclude?
- **Decision:** Display recipe sources as pills with three-state cycle-on-click, displaying the matched recipe count next to each source.
- **Details:**
  - Consistent pill styling matching the tags section.
  - Show counts (e.g. `Rickarbys 5`) dynamically computed based on active filters, just like tags.

### Q4. Logic: Logical Interactions of Inclusions and Exclusions

- **Question:** How should multiple includes and excludes combine mathematically/logically?
- **Decision:**
  - **Tags:** All included tags must match (AND). No excluded tags must be present (NOT).
  - **Sources:** At least one included source must match (OR, since recipes have one source). No excluded sources must match (NOT).
  - **Overall:** Recipes must satisfy the tag filters AND the source filters.

### Q5. Persistence: Filter State Storage

- **Question:** Should active filters persist across page reloads?
- **Decision:** Persist filters (included/excluded tags and sources) in LocalStorage (under `noonarby-meal-plan-filters`) but do not include them in the shared URL query string.
- **Details:**
  - Avoids bloating shared URLs.
  - Saves active selections for convenience between browsing sessions.

### Q6. Behavior: Dynamic Refinement of Filter Options

- **Question:** Should tags and sources that no longer match the current filter selection be dynamically removed from the lists?
- **Decision:** Do not hide non-matching tags/sources. Instead:
  - **Tags:** If a tag has a count of `0` and is **not** currently active (included/excluded), it will be visually dimmed and disabled (non-clickable) to prevent selecting filters that yield 0 results. If it is active, it remains clickable so the user can deselect it.
  - **Sources:** Sources with a count of `0` remain clickable and in their neutral state to indicate they can still be selected.
- **Details:**
  - Prevents creating zero-match states for tags while preserving the ability to clear active filters.
  - Preserves full clickability for source selection.
