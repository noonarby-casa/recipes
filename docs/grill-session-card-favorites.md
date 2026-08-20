# Grill Session: Recipe Card Favoriting & Batch Search Favoriting

## Closed Decisions

### Q1. Button Placement & Click Hierarchy

- **Question:** Where should the interactive favorite button be located on the recipe card, and how should it interact with the card's navigation links?
- **Decision:** Place an interactive `<button type="button" class="recipe-card-favorite-btn">` in the top-right corner (`top: 6px; right: 6px`) of `.recipe-card-media-wrapper` over the image, replacing the read-only badge.
- **Details:**
  - Rendered as a sibling to the image link `<a>` to avoid nested interactive elements.
  - Click event handler executes `stopPropagation()` and `preventDefault()` to prevent card navigation.
  - Positioned at `z-index: 5` above the media element.

### Q2. Unfavorited State Visibility & Affordance

- **Question:** How should the favorite button look and behave when a recipe is not favorited yet across desktop and mobile?
- **Decision:** Always visible at `opacity: 0.75` on all surfaces/devices for unfavorited cards, transitioning to `opacity: 1.0` on hover, focus, or when favorited.
- **Details:**
  - **Unfavorited:** Rendered with an outlined heart icon and subtle translucent backdrop (`background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(2px)`) at `opacity: 0.75`.
  - **Hover/Focus:** Scales subtly and increases to `opacity: 1.0`.
  - **Favorited:** Filled heart with `var(--heart-color)` at `opacity: 1.0`.

### Q3. Behavior When Un-favoriting While "Favorites Only" Filter is Active

- **Question:** If the user has the "Favorites" filter pill active (`favoritesOnly: true`) and un-favorites a recipe directly from its card, what should happen?
- **Decision:** Instant reactive removal.
- **Details:**
  - The recipe is immediately removed from the active view via Svelte 5 `$derived(filterRecipes(...))` reactive pipeline.
  - Maintains consistent reactive behavior with other tag and search filters.

### Q4. Scope Across Card Variants

- **Question:** Which `RecipeCard` variants should have interactive favoriting?
- **Decision:** Only `standard` (homepage and search results).
- **Details:**
  - `standard`: Full interactive toggle button.
  - `planner`: Read-only badge (toggling managed in Edit Details modal).
  - `compact`: Read-only mini badge to prevent mis-clicks during meal selection.

### Q5. Static HTML Pre-Hydration Representation

- **Question:** How should the static Hugo HTML template render the favorite button prior to Svelte hydration?
- **Decision:** Mirror the exact `<button type="button" class="recipe-card-favorite-btn">` markup in `recipe-list-item.html`.
- **Details:**
  - Ensures 0 Cumulative Layout Shift (CLS) and seamless visual continuity when Svelte mounts.
  - Uses identical positioning, dimensions, and backdrop CSS tokens.

### Q6. Sizing & Micro-Interactions on Toggle

- **Question:** What dimensions should the recipe card favorite button have, and what micro-animation should play when toggled?
- **Decision:** `34px × 34px` circular button with `18px` icon, `scale(0.92)` press state, and `0.3s` heart-pop animation on favorite.
- **Details:**
  - Circular target with `background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(2px)`.
  - `@keyframes heart-pop` applied on active favorited transition.

### Q7. Keyboard Navigation & Accessibility

- **Question:** How should the card favorite button announce its state and respond to keyboard interactions?
- **Decision:** Native `<button>` semantics with dynamic ARIA attributes and distinct `:focus-visible` styling.
- **Details:**
  - `aria-pressed="true|false"`, `aria-label="Add/Remove {title} from favorites"`.
  - `Space` and `Enter` toggle favorite status cleanly.
  - Prominent focus outline using `var(--noonblue)`.

### Q8. Visibility & Trigger Conditions for "Add All to Favorites"

- **Question:** When should the "Add all to favorites" button be visible on the homepage/search results?
- **Decision:** Show only when an active search query or tag/source filter is applied, `favoritesOnly` is false, and at least one matching result is not yet favorited.
- **Details:**
  - Hidden on default unfiltered homepage to prevent accidental bulk-favoriting of the entire database.
  - Hidden when all matching results are already favorited.

### Q9. Target Scope for "Add All"

- **Question:** Should "Add all to favorites" add all matching results (`searchResults`) or only visible paginated cards (`paginatedResults`)?
- **Decision:** All matching results (`searchResults`).
- **Details:**
  - Matches the full filtered set count shown in the search summary.
  - Removes need for manual scrolling to bottom before bulk action.

### Q10. UI Placement, Button Text & Layout Integration

- **Question:** Where should the button be placed in the UI layout and what should the button text say?
- **Decision:** Inside `.search-results-info` grouped in a flex actions container next to "Clear filters", labeled **`Favorite all`**.
- **Details:**
  - Markup: `<button type="button" class="btn-favorite-all"><HeartIcon ... /><span>Favorite all</span></button>`.
  - Clean secondary pill button with a red/pink heart icon accent.
  - Naturally stacks/wraps on mobile screens.

### Q11. Feedback, Confirmation & Undo

- **Question:** How should the user be notified and given a safety net when clicking "Favorite all"?
- **Decision:** Instant non-blocking execution with a floating toast notification containing an [Undo] button for 5 seconds.
- **Details:**
  - No blocking modal dialogs.
  - Undo immediately rolls back the specific added short IDs.
  - "Favorite all" button automatically hides as soon as all matching recipes are favorited.

### Q12. Batch Store Mutation Method & Store API

- **Question:** How should batch additions and undos be integrated into `favoritesStore`?
- **Decision:** Add atomic `addAll(shortIds: string[]): string[]` and `removeAll(shortIds: string[]): void` methods.
- **Details:**
  - `addAll` returns the array of newly favorited IDs to allow easy rollback by `removeAll`.
  - Single atomic localStorage writes and store updates.

## Open Questions

_(All questions have been resolved!)_
