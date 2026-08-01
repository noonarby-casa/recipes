# Plan History & Date-Based Meal Planner Design Specification

## Overview & Architecture

This document defines the technical design and user experience specification for transitioning Noonarby Casa Recipes' Meal Planner from a relative single-week model to a **Date-Based Continuous Ledger** with flexible plan durations (1 to 21 days) and a monthly **History View**.

---

## 1. Data Model Architecture

- **Absolute Date Keys**: In [`types.ts`](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/types.ts), `PlannedItem.day` is replaced with `date: string` formatted as ISO `'YYYY-MM-DD'` (or `'supplemental'`).
- **Continuous Calendar Ledger**: `localStorage` stores a continuous date-indexed map: `Record<string, PlannedItem[]>`.
- **Active Plan vs. History**:
  - Past dates (`date < today`) automatically form historical meal logs.
  - Future & current dates form upcoming plans.
  - Opening any date window (e.g., Aug 1–Aug 14) executes a date-range query over the ledger.
  - Overlapping dates automatically populate pre-existing items.

---

## 2. URL Encoding & Parameters (`d`, `w`, `p` version 2)

- **`d` (Start Date)**: `d=YYYYMMDD` (e.g., `d=20260801`). Defaults to Monday of the current week if omitted.
- **`w` (Duration in Days)**: Integer from `1` to `21` (e.g., `w=14`, `w=5`).
- **`p` (Payload Version 2)**: Encoded as `p=2.0codePortions.1codePortions...`. Day indicators are relative day offsets (`0` to `w-1`) from `d`, plus `S` for supplemental items.
- **Backwards Compatibility**: Version `1` parser remains intact to parse legacy shared URLs without `d`.

---

## 3. Plan View & History View Layouts

- **Plan View**:
  - Single column on mobile, 5-column grid on tablet/desktop.
  - 1 to 21 dates flow continuously across columns and wrapped rows.
  - Day column titles use `"DayName, Mon DD"` format (e.g., `"Monday, Aug 3"`).
- **History View (Monthly Calendar)**:
  - 7-day Sunday-oriented monthly calendar view.
  - Compact recipe cards showing small image and title only. Clicking any date or range opens that plan window in Plan View (`m=v`).
  - Below the calendar matrix, a collapsible **"Anytime & Supplemental Meals"** section displays non-dated items logged during that month.

---

## 4. Single Source of Truth Storage

- Single storage key `noonarby-calendar-ledger`: `Record<string, PlannedItem[]>`.
- Importing a shared URL converts its offset items into absolute date keys relative to `d` and populates them directly into the calendar ledger.

---

## 5. Navigation & Tab Integration

- `activeTab` updated to `'view' | 'edit' | 'shop' | 'history'`.
- URL mode parameter `m=h` activates the History Tab.

---

## 6. Date-Scoped Conflict Detection & Merge Resolution

- Conflict checking is scoped strictly to the target date range (`d` to `d + w - 1`).
- If target dates are empty, incoming shared items load cleanly.
- If target dates contain existing items, the Conflict Banner offers:
  1. **Replace Range**: Overwrites only the dates in `d` .. `d + w - 1`.
  2. **Combine**: Appends shared items alongside existing local items for those dates.
  3. **Keep Mine**: Preserves local ledger items.

---

## 7. Auxiliary Workflows

- **Shopping List**: Aggregates ingredients for all dates in the active window (`d` to `d + w - 1`) plus supplemental items.
- **Generate Dinner Plan**: Populates empty date slots across `d` to `d + w - 1`.
- **Legacy Migration**: Auto-maps existing relative `'mon'`..'sun'`items from`noonarby-meal-plan`to current week dates in`noonarby-calendar-ledger` on startup.
- **Date Range Picker**: Google Flights-style two-click interactive calendar popover for selecting start date `d` and end date `d + w - 1`.
- **Clear Plan**: Changes to **"Clear Active Range"**, wiping items only for dates currently in the active view window.

---

## 8. Storage Capacity & Quota Management

- **Capacity Indicator & Details Modal**: Storage button in `#toolbar-history` (`💾 X MB (Y%)`) opens a Storage & Backup Details Modal with stats, gauge bar, and `[ 📥 Backup History (JSON) ]` export.
- **Auto-Prune Fallback**: If writing to `localStorage` throws a `QuotaExceededError`, automatically prune ledger entries older than 365 days, retry saving, and display an archive notification toast.

---

## 9. Vertical Viewport & Layout Optimization

- **Toolbar Storage Button**: Single compact storage button in `#toolbar-history` opens a Storage Details Modal, removing the bottom 60px footer block.
- **Responsive Cell Heights**: Uses `min-height: clamp(72px, 11vh, 95px)` so 5-week and 6-week calendar months, toolbars, and site footers fit 100% inside 768px+ viewports without page scrollbars.
- **Zero-Height Empty Month Alert**: When `totalMonthMeals === 0`, displays a compact alert pill in `#toolbar-history` (`[ 🗓️ Empty Month — Plan Now ]`) and a subtle watermark overlay inside the calendar card, adding 0px to the vertical stack height.
