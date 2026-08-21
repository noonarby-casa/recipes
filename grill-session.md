# Grill Session: Consistent Toast Notifications

## Closed Decisions

### Q1. Toast Architecture & State Management

- **Question:** Should toast notifications be managed via a centralized global `toastStore` + single top-level `<ToastContainer />` or component-scoped instances?
- **Decision:** Global `toastStore` with a single top-level `<ToastContainer />`.
- **Details:**
  - Any component or store across the site can trigger toasts via a unified API (e.g., `toastStore.show(...)` / `showToast(...)`).
  - Centralizes lifecycle, animations, positioning, and accessibility.

### Q2. Viewport Placement & Overlay Collision

- **Question:** Where should the toast container be positioned on screen relative to the floating Timer overlay?
- **Decision:** Fixed Bottom-Center.
- **Details:**
  - `bottom: 1.5rem; left: 50%; transform: translateX(-50%);` with `max-width: min(90vw, 420px)`.
  - Avoids collisions with the bottom-left floating timer FAB / Cooking Dashboard overlay ([`OverlayPanel.svelte`](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/components/primitives/OverlayPanel.svelte)).
  - Natural reachability on mobile devices.

### Q3. Single Toast Display & Auto-Dismiss Lifecycle

- **Question:** What should the display concurrency and auto-dismiss timeouts be?
- **Decision:** Single visible toast with hover/focus pause.
- **Details:**
  - Only 1 toast is visible at any given moment on screen (no vertical multi-toast stack).
  - Durations: 5000ms for toasts with actions (Undo), 3000ms for plain informational toasts.
  - Hovering or focusing the toast pauses the countdown timer.

### Q4. Toast Replacement & Queue Semantics

- **Question:** When a toast replaces an active toast or is dismissed, should older toasts be queued/resumed or discarded?
- **Decision:** Option A — Discard / Immediate Replace.
- **Details:**
  - Incoming toasts immediately replace any active toast and cancel the previous timer.
  - No re-emerging of older toasts. Keeps undo semantics aligned with single-level store undos and prevents UI churn.

### Q5. Toast API, Data Model & Visual Variants

- **Question:** How should the toast data model and visual styles be structured?
- **Decision:** Unified `ToastOptions` interface with left-accent styling.
- **Details:**
  - Interface: `id`, `message`, `emphasisText?`, `variant? ('default' | 'favorite' | 'success' | 'warning')`, `action? ({ label, onClick })`, `duration?`, `onDismiss?`.
  - Visual styling: `var(--card-bg)`, elevated shadow, left accent border (`4px solid var(--noonblue) | var(--heart-color) | var(--success-color)`), matching uppercase action button, and right-aligned `✕` dismiss button.

### Q6. Catalog of Toast Triggers vs. Inline / Banner Actions

- **Question:** What actions across the website should trigger a Toast vs. remaining an Inline State or Banner?
- **Decision:** Standardized trigger catalog.
- **Details:**
  - **Toasts (with Undo):** Remove meal from plan, Clear meal plan, "Favorite all" from search results.
  - **Toasts (Informational / Success):** "Share Plan" (URL copied), "Copy Menu" (menu text copied).
  - **Inline Only (No Toast):** Single recipe favorite heart toggle (visual heart animation only), Modal export copy button.
  - **Banners (Persistent/In-flow):** Homepage planner promo banner, Conflict resolution banner, Favorite fallback generator notice.

### Q7. Accessibility Semantics & Keyboard Interaction

- **Question:** How should toasts announce to assistive technology and handle keyboard interaction?
- **Decision:** Non-intrusive polite live region with keyboard dismiss.
- **Details:**
  - `role="status"`, `aria-live="polite"`, `aria-atomic="true"`.
  - No focus stealing upon appearance; accessible tab navigation with `:focus-visible` styling.
  - Pressing `Escape` dismisses the active toast if no modal is currently open.

### Q8. Global Island Mounting Strategy

- **Question:** How should the toast container be mounted into the DOM across all pages?
- **Decision:** Base template mount target + Svelte island.
- **Details:**
  - Add `<div id="toast-container-mount"></div>` to [`baseof.html`](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/layouts/baseof.html).
  - Register `ToastContainer` in [`svelte-main.ts`](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/svelte-main.ts) alongside `OverlayPanel` and `SettingsModal`.

## Open Questions

_(None — all design branches resolved)_
