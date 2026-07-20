# Grill Session: Favorites Recipe Feature

This document tracks design decisions, open questions, and implementation details for the local "favorites" recipe feature across the Noonarby Casa Recipes website.

## Closed Decisions

### Q1. Storage & Persistence

- **Question:** How should the favorites data be stored client-side?
- **Decision:** Use `localStorage` with key `noonarby_favorites` storing a JSON-serialized array of recipe `shortId` strings (e.g., `["crg", "efa"]`).
- **Details:**
  - `shortId` is guaranteed to be a unique 2-6 lowercase letters string per recipe, validated at build time in [index.json](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/layouts/index.json).
  - Compact storage footprint.
  - Matches the identifier scheme used for URL sharing in the meal planner.

### Q2. Single Recipe Page UX

- **Question:** Where should the favorite toggle button live on the single recipe layout, and how should it behave?
- **Decision:** Place it inside the recipe controls panel alongside the servings size adjustor.
- **Details:**
  - **Color Palette:** Custom red/pink theme colors complementary to `--noonblue` (`#d11a5b` light theme / `#ff6584` dark theme).
  - **Behavior:** Outlined heart (unfavorited) transitions to a filled heart (favorited) with a premium scale-pop micro-animation on click.

### Q3. Controls Panel Layout

- **Question:** How should the favorite toggle be integrated inside the `.recipe-scale-panel` container?
- **Decision:** Place it as a sibling inside the `.recipe-scale-panel` (at the bottom, separated from the scaling controls by a subtle border/divider).
- **Details:**
  - A visual divider (`border-top: 1px solid var(--border-subtle)`) separates the Servings controls from the Favorites controls.
  - It will feature a label (e.g. "Save to Favorites" or similar) on the left, and the heart toggle button on the right.

### Q4. Recipe Cards & Lists

- **Question:** How should the favorite status be displayed on recipe list cards (homepage, search results, taxonomy pages), and should it be toggleable directly from lists?
- **Decision:** Display a read-only visual badge overlay on the recipe card image. No direct toggling from lists.
- **Details:**
  - A compact, semi-transparent circular badge featuring the filled red/pink heart icon is overlaid in the top-right corner of the recipe image.
  - It is visible only when the recipe is favorited.
  - Read-only behavior avoids nested link click issues and keeps the template/rendering logic robust and clean.
  - **Visual Consistency:** This identical overlay badge design and markup is reused for planner browse cards (see Q7).

### Q5. Filtering & Searching

- **Question:** How should users filter by favorites on the home page and search results?
- **Decision:** Place a dedicated "Favorites" filter chip directly in the `.homepage-tags-bar` alongside the primary/always-visible tag chips.
- **Details:**
  - Visual style matches the primary tag pills but features a heart icon.
  - Toggling the chip filters both the default homepage list and any active search results instantly in the client-side TypeScript code.
  - High-visibility positioning ensures instant access.

### Q6. Planner Filters UX

- **Question:** How should the favorites toggle be presented inside the `#planner-filters-modal`, and how should `generateDinnerPlan` behave if the pool of favorited dinner recipes is empty?
- **Decision:** Place a prominent, dedicated toggle row (`❤️ Favorites Only`) at the top of `#planner-filters-modal`. If favorites-only is active but the user has no favorited dinner recipes when clicking "Generate Plan", abort the operation and show a warning toast.
- **Details:**
  - The toggle lives above the tags and sources lists inside the filters modal.
  - Uses the standard toast notification system to inform the user why generation did not occur.

### Q7. Browse Shelf Heart Badge

- **Question:** What icon style and classes should we use for the heart badge in the selector modal's `.browse-title-wrapper`?
- **Decision:** Reuse the same read-only circular badge overlay (`.recipe-favorite-badge`) on the top-right corner of the browse card's thumbnail image.
- **Details:**
  - Inserted dynamically in `meal-plan.ts` during shelf rendering if `FavoritesManager.isFavorite(r.shortId)` is true.
  - Reuses the exact same CSS and SVG structure as Q4, ensuring a unified visual indicator for all recipe list/browse thumbnails across the entire site.

### Q8. Edit Details Modal Toggle

- **Question:** How should the favorite toggle be styled and positioned inside the Edit Details (Sides) modal for meals?
- **Decision:** Place a dedicated toggle row ("Save to Favorites") between the Portions and Sides sections inside the modal, only rendering if the item is an index-matched recipe.
- **Details:**
  - Visual layout: Separated by horizontal dividers matching the modal's theme.
  - Behavior: Leverages the same `recipe-favorite-btn` classes, active color variables, and transition keyframes.
  - Omitted for custom/arbitrary textual meals.

### Q9. Syncing & Portability

- **Question:** Should we offer import/export for local favorites, or is local-only storage sufficient?
- **Decision:** Keep it local-only (stored in `localStorage` under `noonarby_favorites`) for now.
- **Details:**
  - Avoids UI footprint creep.
  - Future enhancements for sharing/syncing the overall planner and favorites will be addressed collectively.

## Open Questions

_(All questions have been resolved during the grill session!)_
