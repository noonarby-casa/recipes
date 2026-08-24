# Grill Session: Meal Planner Calendar & Date Range Picker UX

## Closed Decisions

### Q1. Preset Controls & Jump Semantics

- **Question:** How should preset buttons and jump actions be labeled and structured in the calendar popover?
- **Decision:** Split controls into two distinct rows for **Start** and **Duration** in the popover:
  - **Row 1 (Start Anchors):** `Today`, `This Week` (snaps start to current week's Monday), `Next Week` (snaps start to next week's Monday). Preserves the currently selected duration.
  - **Row 2 (Duration Presets):** `5 Days`, `7 Days`, `14 Days`, `21 Days` (or `5d Workweek`, `7d Week`, `14d 2 Wks`, `21d 3 Wks`). Extends from the currently selected start date.
  - **Interaction:** Clicking any preset highlights the range immediately on the calendar grid without closing the modal. Active duration pills visually highlight when matching the current selection.

### Q2. Stepper Arrow Navigation Logic

- **Question:** How should the previous (`‹`) and next (`›`) stepper arrows calculate the date shift?
- **Decision:** Smart step rules based on duration:
  - **`durationDays === 1`:** Shift by **±1 day** for day-by-day navigation.
  - **`2 <= durationDays <= 6`:** Shift by **±7 days** (preserves the start day of the week, e.g. Mon–Fri workweeks or Fri–Sun weekends).
  - **`durationDays >= 7`:** Shift by **±`durationDays`** (e.g. ±7, ±14, ±21 days).

### Q3. Popover Dismissal & Closing Lifecycle

- **Question:** When and how should the popover close when interacting with the calendar grid or presets?
- **Decision:** Live updates with explicit and implicit dismissal:
  - All interactions (date clicks, jump buttons, duration presets) update the active range live in real-time.
  - The 2nd click on the calendar grid sets the end date without closing the popover, allowing the user to review or adjust the highlighted span.
  - Dismissal options: An explicit **"Done"** button in the popover footer, clicking outside (backdrop), or pressing `Escape`.

### Q4. Calendar Grid Week Starting Day

- **Question:** Should the calendar popover month matrices start on Sunday (`Su Mo Tu We Th Fr Sa`) or Monday (`Mo Tu We Th Fr Sa Su`)?
- **Decision:** Keep **Sunday-start (`Su Mo Tu We Th Fr Sa`)** to match standard U.S. consumer calendar conventions.

### Q5. Calendar Cell Visuals & Today Indicator

- **Question:** How should the active range and today's real-world date be indicated in the calendar matrix?
- **Decision:**
  - **Range Style:** Keep the current unified solid selection styling across the active range (reading top-left to bottom-right).
  - **Today Marker:** Render a small 4px accent dot centered beneath the date number (turning white when selected).

### Q6. Trigger Button Label & Range Formatting

- **Question:** Should the main toolbar date trigger button include day-of-week abbreviations in the label?
- **Decision:**
  - Display weekday names in the range label (e.g. `Mon, Aug 3 – Fri, Aug 7 (5 days)` or `Mon, Aug 3 – Sun, Aug 9 (7 days)`).
  - Provide instant clarity on the weekly rhythm without needing to open the popover.
  - Gracefully shorten on small mobile viewports if needed to avoid toolbar overflow.

### Q7. Mobile & Viewport Layout (< 600px)

- **Question:** How should the 2-month calendar and controls render on mobile screens?
- **Decision:**
  - Preserve the full **2-month view** on mobile (stacked vertically) so cross-month selection remains effortless.
  - Use **static positioning** for the footer presets and Done button beneath Month 2.
  - Set `max-height: 85vh; overflow-y: auto;` on the popover container so smaller screens scroll smoothly without collapsing or shrinking calendar cells (which stay fixed at 30px).

## Open Questions

_(All initial questions resolved)_
