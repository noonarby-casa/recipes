# Simplified Combined Shopping List UI Design

This document details the finalized design decisions and implementation details for the Noonarby Casa Recipes Meal Plan Shopping List UI simplification, as aligned during the grill session.

## Core User Journey

1. **Assemble Plan:** The user builds a meal plan, selects recipes, and adds manual sides.
2. **Review Shopping List:** The user navigates to the Shopping List tab on the site.
3. **Filter On-Hand Items:** The user reviews the combined list and checks off items they already have on hand.
4. **Export List:** The user copies only the remaining (unchecked) items using the "Copy Unchecked" dropdown, transferring them to their preferred shopping app (Markdown or Google Keep).

---

## Final Design Decisions

### 1. Clipboard Copying Behavior

- **Markdown Copying:** Exports unchecked items only, formatted as interactive checklist items (e.g., `- [ ] 1 cup Milk`).
- **Google Keep Copying:** Exports unchecked items only, formatted as a plain list of items (one per line, e.g., `1 cup Milk`) with no Markdown markers or section headers, so Google Keep can cleanly auto-convert them into checkbox items.
- **Exclusion:** Checked items (representing items already on hand) are completely filtered out and excluded from all clipboard exports.

### 2. Pantry Staples Simplification

- **Unified List:** The separate "Pantry Staples" accordion section and the "+" depletion buttons are removed. All ingredients are displayed in a single unified list.
- **Default States:**
  - Pantry staples (e.g., salt, pepper, oil) are **checked off by default** when the list renders.
  - Standard ingredients (e.g., chicken, broccoli, cheese) are **unchecked by default**.
- **Flow:** If the user has a staple on hand (the normal case), they do nothing. If they run out of a staple, they uncheck it to include it in their shopping list.

### 3. UI and Toolbar Layout

- **Visual Checklist:** Checked items remain visible in the UI, styled as dimmed and crossed-off, so users can easily toggle them back if they make a mistake.
- **Redundancy Removed:** The "Omit checked items" checkbox toggle is removed from the toolbar to simplify the layout.
- **Helper Subtitle:** A new subtitle is added under the "Combined Shopping List" header: `"Check off items you already have on hand."`
- **Dropdown Renaming:** The select dropdown placeholder is renamed from `"Copy List"` to `"Copy Unchecked"`.
- **Toolbar Ordering:** Items are ordered from left to right:
  1. `Copy Unchecked` dropdown (primary tool).
  2. `Copy Menu` button (secondary utility).
  3. `Reset Checkboxes` button (red outline destructive utility, last).
