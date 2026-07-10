# Grill Session: Displaying Sides from Meal Plan on Recipe Pages

This session focuses on the design and implementation details for showing custom "Sides & Extra Ingredients" (added during meal planning) on the individual recipe pages when accessed from a plan.

## Closed Decisions

### Q1. Instance Identification

- **Question:** How does the recipe page identify the correct meal plan slot/instance when the recipe is clicked?
- **Decision:** Append `instanceId` to the query string when linking from the meal planner.
- **Details:**
  - Links will be updated to: `${dm.permalink}?from=plan&instanceId=${dm.instanceId}&servings=${portions}`
  - The recipe page will query `localStorage` (`noonarby-meal-plan`) using this ID.
  - Fallback: If `instanceId` is missing but `?from=plan` is present, look up the first planned item matching the recipe permalink.

### Q2. DOM Insertion & Styling

- **Question:** Where and how should the sides be rendered on the individual recipe page?
- **Decision:** Dynamically append a new category section at the end of the existing `.recipe-ingredients-list` container.
- **Details:**
  - Markup will follow the existing compound-list CSS components: a `compound-list-header` for the header "Sides", and a `compound-list-items` list of `recipe-ingredient` elements.

### Q3. Integration with Servings Scaler

- **Question:** Should side quantities scale when the user adjusts servings on the recipe page?
- **Decision:** Yes, side quantities should scale proportionally alongside standard ingredients.
- **Details:**
  - Modify `scaler.ts` to dynamically query `.recipe-quantity` elements inside `updateRecipeScale` rather than caching them once at startup. This enables new dynamically added quantities to be scaled.

### Q4. Integration with Shopping List

- **Question:** Should sides be included in the recipe page's "Shopping List" view tab?
- **Decision:** Yes, sides should be included in both the "Shopping List" view tab and copied clipboard lists.
- **Details:**
  - Side items will be generated using the `.recipe-ingredient` class.
  - Change execution order in `main.ts` so `initRecipePageAddToPlan()` is run before the shopping list and scaler initialization, making the side items fully discoverable.

### Q5. Editable vs View-Only

- **Question:** Can the user add, edit, or remove sides directly from the recipe page?
- **Decision:** Keep it view-only on the individual recipe page.
- **Details:**
  - Editing sides requires text parsing and complex lists, which are already handled by the meal planner.
  - Keeping it view-only keeps the recipe page code clean and light.

### Q6. Function Renaming (Aside)

- **Question:** Why is the initialization function on individual recipe pages named `initRecipePageAddToPlan` when it currently only renders back-button and sides logic? Should it be renamed?
- **Decision:** Rename the function to `initRecipePagePlanIntegration`.
- **Details:**
  - This rename makes the function's scope (which now handles both back-link and displaying sides) accurate.
  - Update references in `meal-plan.ts` and `main.ts`.

## Open Questions

_(None)_
