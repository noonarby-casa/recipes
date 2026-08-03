# Grill Session: Single Recipe Plan Bar Week Date Display

## Closed Decisions

### Q1. Label Wording & Placement

- **Question:** How should the Monday date be phrased and placed within the plan bar?
- **Decision:** Use `Plan (MMM D):` on desktop and collapse to `MMM D:` on mobile screens (e.g. `Plan (Aug 3):` -> `Aug 3:`).
- **Details:**
  - Replaces static `Plan:` label in [`SingleRecipeScaler.svelte`](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/components/apps/SingleRecipeScaler.svelte#L185).

### Q2. Active Week Source of Truth

- **Question:** Should the displayed Monday track `settingsStore.startDate` or the current real-world calendar week's Monday?
- **Decision:** Track `$settingsStore.startDate` (the active meal plan week).
- **Details:**
  - Computes Monday using `getMondayOfWeek(parseIsoDate($settingsStore.startDate))` from [`utils/dates.ts`](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/utils/dates.ts#L64).

### Q3. Non-Monday Start Dates & Date Precision

- **Question:** How should weekday pills behave and display dates if `settingsStore.startDate` is a non-Monday date?
- **Decision:** Keep UI as compact weekday circle pills `[M] [T] [W] [T] [F] [S] [S]`. Update underlying data mapping to store exact ISO dates (`YYYY-MM-DD`).
- **Details:**
  - The label header shows the Monday date (e.g. `Plan (Aug 3):`).
  - The 7 circle pills `[M]`, `[T]`, etc., remain visually identical (`M`, `T`, `W`, `T`, `F`, `S`, `S`).
  - Under the hood, clicking `M` resolves to `addDays(mondayDate, 0)` (`2026-08-03`), `T` resolves to `addDays(mondayDate, 1)` (`2026-08-04`), etc.
  - Tooltips reflect the full day and date (e.g., `Add to Monday, Aug 3`).

### Q4. Date Format Style

- **Question:** How should the month and day be formatted in the date string?
- **Decision:** `MMM D` format (e.g., `Aug 3`), using `toLocaleDateString('en-US', { month: 'short', day: 'numeric' })`.
- **Details:**
  - Consistent with existing date formatting across the application.

### Q5. Plan Interactions & Backwards Compatibility

- **Question:** How should multi-day scheduling, legacy plans, reactivity, and plan navigation interact?
- **Decision:**
  - `isScheduledOn` checks both exact ISO date (`YYYY-MM-DD`) and legacy day keys (`"mon"`).
  - Pill active states and Monday dates react dynamically to `$settingsStore` changes.
  - Pills evaluate independently for multi-day scheduling.
  - `View Plan →` link navigates to `/plan/`.

## Open Questions

_(None. All design decisions resolved and approved for implementation!)_
