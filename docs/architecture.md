# Codebase Feature Architecture & Implementation Details

This document covers the technical details, layouts, scripts, and stylesheets for the core interactive features of the Noonarby Casa Recipes website.

---

## 🔍 Recipe Search Engine

The site features a client-side search engine for filtering recipes dynamically.

- **Search Index Generation:** Hugo generates a search index at `index.json` (using the template at [index.json](themes/cookpot/layouts/index.json)) compiled from all pages. This index contains all recipe metadata (including `title`, `permalink`, `date`, `times`, `recipeSource`, `tags`, `ingredients`, `summary`, and responsive image WebP crops).
- **Lazy Loading Data:** The search module in [search.ts](themes/cookpot/assets/js/search.ts) lazily fetches `index.json` only when the user hovers over or focuses on the search input box.
- **Client-Side Filtering:** Searching matches search queries case-insensitively against titles, tags, ingredients, and summaries.
- **Header Toggle:** Clicking the global search icon in the header dynamically scrolls to and focuses the search input.

---

## 📄 Pagination

Recipe lists (on the homepage and category/tag list pages) are paginated to prevent performance issues.

- **Configuration:** Pager size is set via `pagerSize = 10` inside [hugo.toml](hugo.toml).
- **Markup & Partial:** Handled in [pagination.html](themes/cookpot/layouts/_partials/pagination.html) and styled inside [recipe-list.css](themes/cookpot/assets/css/recipe-list.css).
- **Template Integration:** Paginated lists in [home.html](themes/cookpot/layouts/home.html) and [list.html](themes/cookpot/layouts/list.html) iterate over the page items using `.Paginate` and render the pagination navigation buttons at the bottom.

---

## 🔀 Random Recipe Selector

A client-side random recipe selector is integrated into the site header to encourage user discovery.

- **Markup & Entry Point:** A button with a crossing shuffle arrows SVG icon is rendered in [header.html](themes/cookpot/layouts/_partials/header.html). It embeds all regular page permalinks serialized as a JSON string under the `data-recipes` attribute.
- **Routing Logic:** The script in [random.ts](themes/cookpot/assets/js/random.ts) handles click events, parses the JSON array, filters out the currently viewed recipe page (if there are multiple recipes), picks a random path, and redirects the user.

---

## 🏷️ Homepage Tag Cloud & Categorization

An alphabetized tag cloud is displayed on the homepage beneath the search bar, allowing users to browse recipes by category.

- **Listing & Count:** Rendered using `site.Taxonomies.tags.Alphabetical` inside [home.html](themes/cookpot/layouts/home.html) to display each tag alongside its recipe count.
- **Layout & Style:** Styled using hoverable pills that shift and highlight on focus/hover (defined in [recipe-list.css](themes/cookpot/assets/css/recipe-list.css)).

---

## 🛒 Shopping List Feature

A custom client-side shopping list toggle aggregates scaled ingredients, converts them to commercial packaging formats, and isolates staples:

- **Orchestrator:** [shopping-list.ts](themes/cookpot/assets/js/shopping-list.ts) toggles view tabs and handles UI rendering.
- **Conversion Rules Registry:** [converters.ts](themes/cookpot/assets/js/shopping-list/converters.ts) contains rules matching specific ingredients (e.g. converting 10 garlic cloves to 1 head, volume butter to sticks, weight dry pasta to boxes, egg yolks to whole eggs).
- **Aggregating Pipeline:** [pipeline.ts](themes/cookpot/assets/js/shopping-list/pipeline.ts) combines quantities, merges note segments, groups duplicated ingredients, and splits outputs into target Buy/Staples lists.
- **Pantry Staples Filtering:** Common spices, oils, small butter portions (<4 sticks), and water are dynamically filtered into a separate collapsible staples list.
- **Clean & Copy:** Cleaned of prep words (chopped, minced) and features standard abbreviation logic. A button copies the entire checklist as markdown to clipboard.
- **Meal Plan Integration:** The meal planner's View UX incorporates a combined shopping list tab. It aggregates ingredients across all days/recipes in the schedule, scales them by the globally selected portions, and runs them through the pipeline to output a single consolidated checklist. It allows omitting completed items from clipboard output and checking/unchecking items.

---

## 📅 Interactive Meal Planner

Accessible at `/plan/` (using [plan.html](themes/cookpot/layouts/plan.html) layout and [plan/index.md](content/plan/index.md) content), styled in [meal-plan.css](themes/cookpot/assets/css/meal-plan.css) and driven by [meal-plan.ts](themes/cookpot/assets/js/meal-plan.ts), the weekly calendar-based planner aggregates recipes and scales portions:

- **Interactive Calendar Assignments:** Allows users to schedule recipes to specific days of the week (Sunday through Saturday). Offers a quick toggle between a full **7-Day Week** and a **5-Day Work Week** layout.
- **Recipe Adding UX:** Includes a Search Overlay Modal for searching and selecting recipes to schedule, alongside drag-and-drop mechanics to assign recipes to days. Includes a **Drag-to-Delete Trash Zone** that reveals itself only when an item is dragged.
- **Servings Scaler:** Global portions controls scale all planned recipes by standard portion ratios.
- **Plan Category Balance Stats:** Displays real-time category/tag balance distributions (like pasta, chicken, soup) for recipes currently in the plan, aiding in menu planning.
- **Undo / Recovery:** Incorporates a toast notification for undoing deleted plans or recipe removals.
- **Shared Plans & Conflict Resolution:** Serializes the scheduled state to URL query parameters for sharing. Opening a shared plan displays a **Compare-Draft Conflict Resolution Banner** (Option C), allowing users to compare the shared layout with their local draft, keep their local draft, load the shared plan, or merge both.
- **Contextual "Back to Meal Plan" Navigation:** When a user visits a recipe page directly from the Meal Planner view, the app appends `?from=plan` to the URL. The script [meal-plan.ts](themes/cookpot/assets/js/meal-plan.ts) detects this query parameter and dynamically appends a fixed/floating "Back to Meal Plan" button in the viewport, which safely redirects back to `/plan/?view=1`.

---

## ⏱️ Screen Wake Lock & Drifting Mitigation

To support distraction-free cooking, the timer engine in [timers.ts](themes/cookpot/assets/js/timers.ts) incorporates modern browser power-management and precise delta checking:

- **Screen Wake Lock API:** Automatically requests a wake lock (`navigator.wakeLock.request("screen")`) when cooking timers are started. It keeps the device screen active to prevent dimming or sleeping.
- **Reference Counting:** The lock is requested when `activeTimersCount` increases to 1, and released when all running timers are paused or reset (`activeTimersCount === 0`).
- **Visibility Re-acquisition:** Listens for `visibilitychange` events to automatically re-request the wake lock when the page returns to the foreground.
- **Timer Drift Prevention:** Computes elapsed time using timestamp deltas (`Date.now() - startTime`) rather than depending on strict `setInterval` counts, ensuring countdown accuracy when the browser tab goes into background sleep mode.
- **Audio Alarm Enhancements:** Sound alerts (written in [audio.ts](themes/cookpot/assets/js/audio.ts)) include a bright ascending major triad pattern played twice for lower-bound warnings, and a double-volume crescendo swing pattern repeating 4 times (~5 seconds) for upper-bound alerts.

---

## 🧪 Private Timer Test Suite

A private, dedicated page at `/timers/` (using [timers.html](themes/cookpot/layouts/timers.html) layout and [timers/index.md](content/timers/index.md) content) serves as an isolated playground to verify:

- Single-value countdowns and warnings.
- Decimal parser formats and shorthands (e.g. `10s`, `10 sec`, `0.1 minutes`).
- Multi-timer Wake Lock reference counting (running multiple timers and checking release conditions).
- Alarm chimes and visual countdown color states.
