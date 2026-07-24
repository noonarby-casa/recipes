# Grill Session: Enhanced Shopping List Export Flow

## Closed Decisions

### Q1. Entry Point & Integration Scope

- **Question:** Where should the enhanced export flow live and what UI trigger should open it?
- **Decision:** Replace the `<select>` dropdown in `RecipeShoppingList.svelte` with a primary "Export List..." button that opens an Export Modal, and reuse this modal component in the Meal Planner (`ShoppingListColumn.svelte`).
- **Details:**
  - Single primary button ("Export List...") with icon.
  - Shared reusable modal component serving both single recipe and combined meal planner shopping lists.

### Q2. Supported Export Formats & Targets

- **Question:** Which export formats and actions should be supported in the modal?
- **Decision:** Only use the current 2 formats, explicitly titled **Google Keep** and **Markdown**.
- **Details:**
  - Google Keep: Plain text list without markdown checkboxes, ideal for Google Keep notes/lists.
  - Markdown: Markdown header and checklist syntax (`- [ ] item`).
  - No external file downloads or extra formats.

### Q3. Export Content Customization & Filter Options

- **Question:** What options should users be able to configure inside the modal before copying?
- **Decision:** Only include the **Item Filter** control (`Unchecked Only`, `All Items`, `Checked Only`).
- **Details:**
  - `Unchecked Only` (Default): Copies items that are currently unchecked.
  - `All Items`: Copies all items regardless of check state.
  - `Checked Only`: Copies items that are currently checked.
  - Optional items are included/excluded strictly based on their checked/unchecked status in the UI, without a separate toggle.

### Q4. Format Selector UI (Vertical Toggle List Component)

- **Question:** How should export format selection be presented to support scaling to >3 options gracefully?
- **Decision (Pivoted & Clarified):** Use a vertical **Toggle List / Radio Card List** component for selecting the format option, rather than horizontal pill toggles or individual format buttons.
- **Details:**
  - Vertical toggle list items (e.g. radio-style rows with icon, label, and description) stack vertically, allowing seamless addition of future integrations (e.g. Todoist, Reminders, CSV) without horizontal layout breakage.
  - Footer features a single primary action button (**Copy to Clipboard**) that operates on the currently selected item in the toggle list.

### Q5. Responsive Layout & Live Preview (Desktop 2-Column & Mobile Tabs)

- **Question:** How should the modal layout and live preview adapt across desktop and mobile screens?
- **Decision:** Use a 2-column equal-height split layout on desktop, and a Mobile Segmented Tabbed layout (`Options` | `Preview`) on mobile screens.
- **Details:**
  - **Desktop (min-width: 768px):** Equal-height 2-column grid inside modal body:
    - Left Column: Filter toggle at top, Vertical Toggle List of format options in middle, primary "Copy to Clipboard" button anchored at bottom.
    - Right Column: Full-height, scrollable Live Preview panel (~22-25 lines visible).
  - **Mobile (< 768px):** Segmented Tabs in modal header (`Options` | `Preview`):
    - `Options` Tab: Filter toggle + Vertical Toggle List of formats.
    - `Preview` Tab: Full-height mobile text preview.
    - Bottom Action Bar: Sticky "Copy to Clipboard" primary action button anchored at the bottom across both mobile tabs for 1-tap copying.

### Q6. Preference Persistence & Default Settings

- **Question:** Should the modal remember user preferences across sessions?
- **Decision:** Stateless. Do NOT persist any preferences in `localStorage` or session storage.
- **Details:**
  - Modal always initializes with hardcoded defaults each time it opens:
    - Item Filter: `Unchecked Only`
    - Export Format: `Google Keep`
  - Keeps behavior completely clean and predictable on every invocation.

### Q7. Shared Component Architecture & Modal Template

- **Question:** Does the export modal use the site's modal template?
- **Decision:** Yes! `ExportModal.svelte` will wrap [Modal.svelte](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/components/Modal.svelte).
- **Details:**
  - Leverages [Modal.svelte](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/components/Modal.svelte) for backdrop click handling, ESC key dismissal, accessible dialog markup, and consistent header rendering.
  - Shared between `RecipeShoppingList.svelte` (single recipe) and `ShoppingListColumn.svelte` (Meal Planner).
  - Formatting logic decoupled into `export-formatter.ts`.

### Q8. ToggleGroup Option Schema & Component Unification

- **Question:** What are the fields of an option in `ToggleGroup.svelte` and how do they support vertical layout?
- **Decision:** Extend `Option` in `ToggleGroup.svelte` with an optional `description?: string` field, and add `orientation?: 'horizontal' | 'vertical'`.
- **Details:**
  - `id`: Unique identifier string for tracking selection (`'google-keep'`, `'markdown'`, `'unchecked'`).
  - `label`: Main title text rendered on the option button (e.g. `"Google Keep"`).
  - `description?`: Optional subtitle/explanation text rendered under the label in vertical mode (e.g. `"Plain text list without markdown checkboxes"`).
  - `badgeCount?`: Optional badge number (e.g. item count).
  - `idAttr?`: Optional DOM element ID for testing/accessibility.

## Open Questions

_None! All branches of the design decision tree have been resolved._
