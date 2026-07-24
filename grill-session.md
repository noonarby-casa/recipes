# Grill Session: Reorganizing Header Icons into Settings Menu

## Closed Decisions

- **Meal Planner Placement:** Top-level primary pill button in header bar (`[ 🗓️ Meal Planner ]`).
- **Random Recipe Placement:** Placed on the homepage search area, as a button element positioned directly to the right of the search input field (`[ 🔍 Search input... ] [ 🎲 Surprise Me ]`).
- **Settings Trigger UI:** Top-level ⚙️ icon in header right that opens a unified **Settings Modal**.
- **Settings Modal Contents:**
  1. **Theme / Appearance:** 3-way toggle (`Light` | `Dark` | `System`) using a horizontal `ToggleGroup`.
  2. **Recipe Text Size:** 3-way toggle (`Smaller` | `Default` | `Larger`) synced with `fontSizeStore` (also kept on single recipe pages).
  3. **Store Layout Selection:** Vertical `ToggleGroup` with layout options and descriptions.
  4. **Timer Sound Alerts:** 2-way toggle (`Sound On` | `Muted`) controlling Web Audio chime playback.
- **Mobile Header Responsiveness:** Keep the full `[ 🗓️ Meal Planner ]` pill text visible on mobile screens; allow `.header-right` section to wrap cleanly below the site title/logo as a short, single row.
- **Data Handling & Storage Reset:** Explicitly omitted from the Settings Modal for now (deferred for separate dedicated design).

## Technical & UX Edge Case Handling

- **System Theme Sync & FOCU (Flash of Unstyled Content):**
  - Inline head script (`head.html`) checks `theme === 'dark'`, `theme === 'light'`, or `theme === 'system'` (fallback to `matchMedia('(prefers-color-scheme: dark)')`) _before page renders_ to prevent light/dark flash on reload.
  - Active `matchMedia('change')` listener dynamically toggles `.dark-mode` on `<html>` in real-time when OS mode changes while in `System` setting.
- **Static Hugo HTML Fallbacks:**
  - `header.html` renders static HTML `<button id="header-settings-btn">` gear icon.
  - `search.html` renders static HTML `<a id="static-surprise-btn">` surprise button next to search box so non-JS/pre-hydration works immediately.
- **Keyboard Navigation & Accessibility:**
  - `Escape` key closes `SettingsModal.svelte`.
  - Focus trap inside modal prevents keyboard navigation from dropping into page background while modal is open.
- **Search Button Dual Behavior:**
  - On Homepage: Clicking 🔍 focuses homepage search input directly.
  - On Recipe Page / Planner: Clicking 🔍 navigates to `/?search=focus`.
