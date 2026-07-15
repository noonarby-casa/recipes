# Grill Session: Displaying Optional Ingredients in the Recipe List

## Closed Decisions

### Q1. Visual representation in the Recipe View

- **Question:** How should optional ingredients be visually styled and labeled in the standard Recipe view?
- **Decision:** Use a Pill Badge (Approach A) at the end of the ingredient line.
- **Details:**
  - Append a CSS-styled badge with the text "Optional" at the end of the ingredient.
  - This avoids parenthesis nesting `(or ...) (optional)` and avoids using opacity which could be confused with checked or disabled states.

### Q2. Inline Styling vs. Separate Section

- **Question:** Should optional ingredients remain inline in their original categories or be grouped into a separate "Optional" section?
- **Decision:** Keep optional ingredients inline in their original categories in the Recipe view.
- **Details:**
  - Preserves culinary context (knowing which part of the recipe/preparation uses the optional ingredient).
  - Maintains the existing separate "Optional" section for the Shopping List view only, as store categorization is more important than cooking context when buying.

### Q3. Hugo vs. Client-side JS Rendering

- **Question:** Where should the optional indicator/text be inserted (server-side Hugo templates or client-side JavaScript)?
- **Decision:** Implement in both (hybrid approach).
- **Details:**
  - In Hugo's `ingredient.html`, statically render `<span class="ingredient-optional-badge">Optional</span>` for SEO and initial load.
  - In TS/JS (`units.ts` / `scaler.ts`), update `formatRecipeIngredientHTML` to accept an `optional?: boolean` argument to ensure the badge persists when portions are scaled.

### Q4. Display Toggle Option

- **Question:** Should there be an interactive toggle/filter to hide optional ingredients entirely from the Recipe view?
- **Decision:** No, do not add a toggle.
- **Details:**
  - Keeps the UI minimal and focused.
  - The Pill Badge is sufficient for inline scanning.
  - Users who want a filtered view of only required items can use the "Shopping List" view, where optional items are already grouped separately.

### Q5. Copying/Clipboard Behavior

- **Question:** How should optional ingredients be handled when using the "Copy Unchecked" shopping list feature?
- **Decision:** Copy optional ingredients by default if unchecked, maintaining Markdown headers and appending `(optional)` suffix for Google Keep.
- **Details:**
  - **Markdown:** Group optional items under a dedicated `### Optional` header.
  - **Google Keep:** Since Google Keep uses a flat checklist, append ` (optional)` to the end of the text for optional items.
  - Like required items, optional items checked in the UI are excluded from the copy.

### Q6. Meal Plan Clipboard Copying Behavior

- **Question:** Should the Google Keep clipboard copy format in the Meal Plan page also append ` (optional)` to optional items, matching the single recipe behavior?
- **Decision:** Yes, align Meal Plan Google Keep copy behavior to append ` (optional)` to optional items for consistency.
- **Details:**
  - Update [meal-plan.ts](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/meal-plan.ts) copy formatting logic so that flat Google Keep lists append ` (optional)` to any optional items.

## Open Questions

_(All decisions have been successfully closed!)_
