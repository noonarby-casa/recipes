# Grill Session: Meal Selector Modal Keyboard UX & Interactions

## Closed Decisions

### Q1. Enter Key Behavior in Catalog Search Input

- **Question:** What should happen when pressing `Enter` in the recipe search input with or without an active arrow key selection?
- **Decision:** Consistent split between blur and explicit selection:
  - **Without arrow keys (`keyboardFocusedIndex === -1`):** Pressing `Enter` blurs the input (`inputElement.blur()`) to collapse the on-screen keyboard (or release input focus) and reveal matching results in the modal. It does _not_ auto-select the first result, even if there is only 1 match.
  - **With arrow keys (`keyboardFocusedIndex >= 0`):** Pressing `Enter` selects the highlighted recipe and adds it to the meal plan.

### Q2. Auto-focus Behavior on Modal Open Across Devices

- **Question:** How should the search input be focused when the recipe selector modal opens?
- **Decision:** Capability-based auto-focus using pointer media queries:
  - **Desktop / Mouse (`(pointer: fine)`):** Automatically focus the search input so desktop users can start typing to search immediately.
  - **Touch / Tablet / Mobile (`(pointer: coarse)`):** Do _not_ auto-focus on modal open, preventing the OS soft keyboard from prematurely covering the recipe list.

### Q3. Escape Key Semantics in Search Input

- **Question:** When the user presses `Escape`, should it clear the search query or close the modal?
- **Decision:** Two-step escape hierarchy:
  - **Step 1:** If search input has text (`searchQuery.length > 0`) or a card is highlighted (`keyboardFocusedIndex >= 0`), `Escape` clears the query, resets the highlighted index to `-1`, and keeps focus in the search box.
  - **Step 2:** If search input is already empty, `Escape` closes the modal.

### Q4. Arrow Key Navigation Mechanics & Boundaries

- **Question:** How should arrow keys navigate recipe cards and handle boundaries and new keystrokes?
- **Decision:** Linear non-wrapping boundary with typing reset:
  - **Input &rarr; Cards:** `ArrowDown` moves from input (`-1`) to the first card (`0`).
  - **Cards &rarr; Input:** `ArrowUp` from the first card (`0`) returns to `-1` (unhighlighting cards and returning focus to the search bar cursor).
  - **End of List:** `ArrowDown` at the last card stops at the last card (no infinite wrap).
  - **Typing Reset:** Any typing/input in the search box immediately resets `keyboardFocusedIndex` to `-1`.

### Q5. Keyboard Interactions in Custom Dish Entry Form

- **Question:** How should `Enter` and submission shortcuts behave within the Custom Dish form?
- **Decision:** Smart contextual actions and power shortcuts:
  - **Title Input:** If suggestion active &rarr; selects suggestion; if no suggestion active &rarr; submits custom dish if valid.
  - **Ingredients Input:** `Enter` commits the current ingredient and keeps focus in the input for the next item. `Escape` cancels editing.
  - **Power Shortcut:** `Cmd+Enter` / `Ctrl+Enter` submits the custom dish from anywhere in the custom panel.

### Q6. Tab Switching & Column Navigation via Keyboard

- **Question:** How should keyboard navigation handle moving between tabs on mobile, and between the two columns on desktop?
- **Decision:** Standard WAI-ARIA and linear Tab flow:
  - **Mobile / Tablet:** WAI-ARIA arrow navigation (`ArrowLeft` / `ArrowRight`) on the `ToggleGroup` tab header.
  - **Desktop:** Clean linear `Tab` ring across Search &rarr; Favorites &rarr; Shelf &rarr; Custom Form. No non-standard modifier combinations.

### Q7. "No Results" Empty State & Custom Dish Bridge Keyboard Actions

- **Question:** How should keyboard navigation interact with empty state action buttons?
- **Decision:** Predictable focus flow and smooth bridge:
  - `Enter` in search input blurs to reveal empty state without selecting.
  - `ArrowDown` / `Tab` from empty search focuses the action button (`+ Create Custom Dish` or `Show All Recipes`).
  - Activating `+ Create Custom Dish` copies query to title, switches tab on mobile, clears query, and focuses the title field.

## Open Questions

_(All initial questions resolved)_
