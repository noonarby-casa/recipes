# Interactive Pantry Audit & Shopping Checkbox State Model

This document outlines the architecture, data model, and user experience for the interactive pantry audit wizard across the Meal Planner and Shopping Debugger.

## 1. Overview

When preparing to shop from a meal plan, users need a rapid way to audit what pantry staples and ingredients they already have in their kitchen. The **Pantry Audit Wizard** provides a focused, keyboard-accessible mobile/desktop modal to triage items into "Have It" (on-hand) or "Need It" (to buy).

## 2. Checkbox State Model

### 2.1 Canonical Keying

Previously, shopping list checkbox keys incorporated unit and staple status (`${isStaple ? 'staple' : 'buy'}_${unit}_${rest}`). This was fragile under recipe scaling, unit conversions, and category adjustments.

The updated model keys checked states strictly by the normalized canonical item name:

```typescript
export function getIngredientKey(item: string): string {
  return (item || '').trim().toLowerCase().replace(/\s+/g, ' ');
}
```

### 2.2 Checked State Resolution & Defaults

- **Pantry Staples (`item.staple === 'in-pantry'`):** Default to `checked = true` (assumed on-hand unless explicitly marked "Need It" / unchecked).
- **Buy Items:** Default to `checked = false` (assumed needed unless explicitly marked "Have It" / checked).
- **State Overrides:** Stored as `Record<canonicalItem, boolean>`.

```typescript
export function isItemChecked(
  key: string,
  isStaple: boolean,
  states: Record<string, boolean>,
): boolean {
  if (key in states) {
    return states[key];
  }
  return isStaple;
}
```

### 2.3 Storage & Auto-Pruning

- Production meal planner states are stored in `localStorage` under `noonarby-shopping-checked-items-v3`.
- When the active shopping list is derived, stale keys for items no longer in the plan are pruned.
- An explicit `clearChecked()` / `resetChecked()` action restores all items to their default states.
- The Shopping Debugger (`/shopping-debug`) maintains an isolated, component-local state that does not pollute `localStorage`.

## 3. UI Component: `PantryAuditModal.svelte`

### 3.1 Interface & Props

```typescript
interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: ShoppingItem[];
  checkedStates: Record<string, boolean>;
  onSetChecked: (key: string, checked: boolean) => void;
}
```

### 3.2 Key Features

1. **Scope Switcher:** 2-way toggle in header:
   - _Pantry Staples_ (default): Audits items where `staple === 'in-pantry'`.
   - _All Items_: Audits all items across the combined buy and optional lists.
   - _Zero-Staples Fallback:_ Automatically defaults to "All Items" if the plan contains 0 staples.
2. **Stepper Experience:**
   - Shows item quantity, unit, canonical name, and recipe attributions / notes.
   - Current status badge (e.g. "Currently: On Hand" vs "Currently: Need to Buy").
   - Progress bar and counter (`Item 3 of 8`).
3. **Actions & Keyboard Shortcuts:**
   - **"Have It" (✓):** Sets `checked = true` (`Y` / `ArrowRight`). Auto-advances.
   - **"Need It" (✗):** Sets `checked = false` (`N` / `ArrowLeft`). Auto-advances.
   - **"Skip":** Advances without changing current state (`Space` / `ArrowDown`).
   - **"Previous":** Returns to the previous item (`P` / `ArrowUp` / Back button).
4. **Completion Summary:**
   - Summary card upon completing the final item:
     - Count of items on hand vs added to buy list.
     - List of items flagged as needing purchase.
     - "Done / View Shopping List" button to return to the main view.

## 4. Export Pipeline Integration

The export pipeline ([`shoppingExportPipeline.ts`](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/pipelines/shoppingExportPipeline.ts)) consumes `ExportItem { isChecked: boolean }` produced via `isItemChecked`.

- Default export filter `Unchecked` excludes items confirmed as "Have It" and includes all items flagged as "Need It".
