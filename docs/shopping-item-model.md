# Grill Session: Shopping Item Data Model & Improvements

## Closed Decisions

### Q1. Redundant Recipe Notes on Single Recipe Page
*   **Question:** How should we prevent the recipe attribution note from showing on the single recipe page while keeping it on the meal planner?
*   **Decision:** The notes model should remain rich and provide all types of data. Each page will decide which parts of the note are necessary or unnecessary. The single recipe page will explicitly omit displaying recipe names.
*   **Details:**
    *   Keep the data pipeline and source-level recipe attributions intact.
    *   Modify [shopping-list.ts](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/shopping-list.ts)'s `renderItem` to ignore the `recipes` array when formatting the item's notes.

### Q2. Display Names and Unit Duplication ("onion onion", "jar jarred...")
*   **Question:** How should we prevent duplicate words in formatting and clean up recipe descriptors leaking into the shopping list?
*   **Decision:** We will use the ingredient's raw `item` field as the canonical name of the ingredient (and keep descriptors in the `desc` field of the recipe front matter). On the shopping list, if the unit matches or is a substring of the item name, we omit the unit and pluralize the item name itself. If the unit is separate, we pluralize the unit and leave the item name as-is.
*   **Details:**
    *   Ensure recipe front matter stores canonical food names in `item` (e.g., `item = "roasted red pepper"`) and moves adjectives to `desc` (e.g., `desc = "jarred"`).
    *   Add a substring-based unit deduplication check in the shopping list rendering code.
    *   Pluralize the item name if the unit is omitted; pluralize the unit if it is displayed.

### Q3. Indirection in Store Layouts (Item -> Category -> Section Order)
*   **Question:** How should we model the indirection between items, categories, and store layouts?
*   **Decision:** We will introduce a global item-to-category classifier mapping items to fine-grained canonical categories (e.g. `tofu` $\rightarrow$ `tofu-tempeh`). Then, each store layout will define sections where each section explicitly lists the categories it houses (e.g. Section `Produce` containing `['fresh-produce', 'fresh-herbs', 'tofu-tempeh']`).
*   **Details:**
    *   Eliminates keyword collisions, as mapping happens once globally rather than per store section order.
    *   Makes rearranging store layouts highly modular and simple by moving category IDs between sections.

### Q4. Adding Raw Shopping Items to the Meal Plan
*   **Question:** How should we model and store raw/custom shopping items in the meal plan?
*   **Decision:** We will use a unified `PlannedItem` model in the plan state. If the recipe reference `permalink` is missing, it is a custom item or calendar placeholder. Both recipe-based cards and custom cards support an `extraIngredients` array for side dishes or standalone items, which scales and moves with the card. Standalone items can simply be added as custom cards in the `supplemental` area.
*   **Details:**
    *   Extend `PlannedRecipe` interface into `PlannedItem` with optional `permalink`, optional `customTitle`, and optional `extraIngredients?: IngredientInput[]`.

### Q5. Moving Pantry Staples to the Active Shopping List
*   **Question:** How should we support moving pantry staples to the "Need to Buy" list?
*   **Decision:** We will introduce a local storage state `depletedStaples: Set<string>`. The pipeline checks this set to override the `staple` status. The UI will show a `+` next to staples to move them to the buy list. When checked off, they are removed from the depleted set (auto-replenished).
*   **Details:**
    *   Pipeline outputs them in `buyItems` (under the correct store section based on its category) and excludes them from `stapleItems`.
    *   Copy List actions automatically inherit this state because they pull from the pipeline/DOM.

### Q6. Fortifying and Validating Static Configs
*   **Question:** How should we validate configs as they scale to prevent typos or circular dependencies?
*   **Decision:** We will use three levels of fortification: Strict TypeScript typing for categories and layout sections, automated validation tests in CI to check for duplicates, typos, and mathematical loops, and a CLI/test-based recipe database "linter" that warns when recipe ingredients fall back to the "Other" category.
*   **Details:**
    *   Set up a `config.test.ts` file.
    *   Integrate checks in the recipe parser/test flow to warn about unmapped ingredients.

### Q7. Editing Planned Items in the Edit Plan UI (Aside)
*   **Question:** How should the user add and edit the new fields (extraIngredients, custom titles, standalone items) in the Edit Plan view?
*   **Decision:** We will support inline custom card addition with smart parsing (NLP-like splitting of qty, unit, and item) for standalone items, and a details overlay modal for editing recipe side dishes and portion scaling. Standalone items can be edited inline or deleted with a click.
*   **Details:**
    *   Add custom item input box with `parseRawUserInput` parser integration.
    *   Add edit detail overlay in `meal-plan.ts` for adding sides to recipes.
    *   Serialize sides in URL using index-based stable mapping `x` parameter.

### Q8. Notes Model Refactoring
*   **Question:** How should we structure item-level vs source-level notes to keep the model simple and flexible?
*   **Decision:** We will group note-related fields into a single `ShoppingItemNote` structure on `ShoppingItem` and rename the source notes to `IngredientNote`.
*   **Details:**
    *   `IngredientNote` holds `recipe`, `altItem`, and `descriptor` (which carries descriptors like "organic" or "low-sodium" from the recipes/custom items).
    *   `ShoppingItemNote` holds `ingredientNotes: IngredientNote[]`, `sizeNote?: string`, and `optionalNote?: string`.

### Q9. Shopping Item Fields Cleanup
*   **Question:** Can we clean up the other fields in the `ShoppingItem` interface to keep it lean?
*   **Decision:** Yes. We will combine the staple booleans into a single optional state `staple?: 'in-pantry' | 'depleted'`. We will rename `section` to `category` (so the UI does the section lookup dynamically based on the active layout, making layout switching instant). Finally, we will remove the redundant `rest` field and use `item` directly as the display name.
*   **Details:**
    *   The final simplified `ShoppingItem` model:
      ```typescript
      export interface ShoppingItem {
        qty: number | null;
        unit: string;
        item: string;                      // E.g. "roasted red pepper"
        category: string;                  // E.g. "fresh-produce"
        staple?: 'in-pantry' | 'depleted'; // Combined staple state
        optional?: boolean;
        note?: ShoppingItemNote;           // Unified structured notes
      }
      ```

## Open Questions

*All questions have been closed!*
