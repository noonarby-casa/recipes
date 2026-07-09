# Recipe Timers Toast Overlay Design Specification

This document details the architectural decisions and design specifications for adding global recipe timer support to the Noonarby Casa Recipes website via a persistent overlay cooking dashboard.

## 1. State Persistence & Storage

- **Mechanism:** Active and paused timer states are stored in browser `localStorage` under the key `noonarby-casa-timers`.
- **Schema:**
  - `recipeTitle` (string): The title of the recipe (e.g., `"Easy French Toast"`).
  - `recipeUrl` (string): The relative path/slug of the recipe page (e.g., `"/easy-french-toast/"`).
  - `timerIndex` (number): The unique index of the timer relative to its recipe page.
  - `durationLabel` (string): The raw duration string (e.g., `"5-7 minutes"`).
  - `minSeconds` (number): Parsed lower-bound duration in seconds.
  - `maxSeconds` (number): Parsed upper-bound duration in seconds.
  - `startedAt` (number | null): Epoch timestamp when the timer was last resumed (or `null` if paused).
  - `elapsedBeforeStart` (number): Total elapsed seconds counted prior to the current run.
  - `status` (`'running' | 'paused'`): The active state of the timer.
  - `lowerChimePlayed` (boolean): Flag indicating if the lower-bound alert has fired.
  - `upperChimePlayed` (boolean): Flag indicating if the upper-bound alert has fired.

- **Formula for Current Elapsed Time:**
  ```js
  const elapsed =
    elapsedBeforeStart +
    (status === 'running' ? Math.floor((Date.now() - startedAt) / 1000) : 0);
  ```

---

## 2. Toast Overlay UI & Layout

- **Container:** Consolidate all timers inside a single "Cooking Dashboard" card in the bottom-left `OverlayContainer` (built-in floating element), avoiding spamming individual toast notifications.
- **Grouping:** Group active timers by recipe under recipe-specific header links.
- **Recipe Link:** Clicking a recipe header redirects the user back to the recipe page.
- **Controls:** Each timer row displays the ticking countdown alongside controls to **Play/Pause**, **Reset**, and **Dismiss (✕)**.
- **Auto-Dismiss:** The Cooking Dashboard automatically hides when all active timers are removed.

---

## 3. Audio & Autoplay Restrictions

- **autounblock:** A global document-wide interaction listener (`click`, `touchstart`) will call `initAudio()` on page load to proactively unblock Web Audio API contexts.
- **Web Audio Queueing:** If a timer finishes before user interaction, the AudioContext remains suspended. Web Audio API naturally queues and plays the alert sound immediately upon the next user click.
- **Visuals:** Reuse the standard orange pulsing `.is-beyond-range` visual state for timer completion to keep styling language consistent.

---

## 4. Multi-Tab Synchronization

- **UI Updates:** Hook into the browser's `storage` event. When `noonarby-casa-timers` updates (e.g., from an action in another tab), the active page reloads the timer state and matches the UI.
- **Chime De-duplication:** Track `lowerChimePlayed` and `upperChimePlayed` flags inside the shared `localStorage` state. The first tab to tick past the threshold plays the audio chime and sets the flag to `true`, preventing other tabs from triggering duplicate sounds.

---

## 5. Redundancy Control

- **Context-Aware Display:**
  - If all active timers belong to the recipe page the user is currently viewing, hide the Cooking Dashboard.
  - If there are active timers from other recipes, display the dashboard containing _only_ those other recipes' timers.
- **Restore State:** When loading a recipe page, the inline timers check `localStorage` (matching the current `window.location.pathname`) to restore state, ensuring they sync with any actions taken elsewhere on the site.

---

## 6. Time-Based Calculation Ticking

- **Option B (Time-Based Calculation):** Save to `localStorage` **only** during state changes (Play, Pause, Reset, and Dismiss).
- Do _not_ write to disk on every second's tick. Each page runs its own local tick loop (`setInterval`) updating the DOM by computing dynamic duration relative to `startedAt`.

---

## 7. Wake Lock Behavior

- **Auto-Reacquire:** On page load, if any running timers are active in `localStorage`, request a screen Wake Lock.
- **Auto-Release:** Release the Wake Lock as soon as all active timers are paused or cleared.

---

## 8. Automatic Cleanup

- On page load, scan the saved timers. Any timer that:
  1. Has been completed (beyond range) for more than **2 hours**, or
  2. Has not updated for more than **12 hours** (e.g. from a past cooking session),
     is automatically cleared to prevent clutter.
