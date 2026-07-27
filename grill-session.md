# Grill Session: Removing Fallbacks & Ensuring Definition Completeness

## Closed Decisions

### Q1. Fallback Removal Policy in `units.ts`

- **Question:** Should `pluralizeWord` and `singularizeWord` strictly rely on explicit lookup entries from `UNIT_DEFINITIONS` and `ITEM_RULES`, completely eliminating generic English regex/heuristic rules (such as `+ 's'`, `endsWith('y') -> 'ies'`), and returning the original word untouched if unmapped?
- **Decision:** Strict Registry Lookup with Passthrough.
- **Details:**
  - Remove English heuristic rules (`+ 's'`, `ies`, `es`) from `units.ts`.
  - If a word is not in `SINGULAR_TO_PLURAL` or `PLURAL_TO_SINGULAR` (derived from `UNIT_DEFINITIONS` and `ITEM_RULES`), return the input string untouched without guessing.

### Q2. Store Categorization Single Source of Truth & Category Enum

- **Question:** Should store category assignment (`fresh-produce`, `dairy`, `spices-seasonings`, etc.) be consolidated directly onto `ItemRule` as an explicit enum property, replacing the fuzzy `CATEGORY_KEYWORDS` array and regex loops?
- **Decision:** Consolidate `category` onto `ItemRule` using an `ItemCategory` Enum.
- **Details:**
  - Define `ItemCategory` as a TypeScript `enum` (or `const` array/union) representing all valid item categories.
  - Add `category: ItemCategory` as a required field on `ItemRule`, removing `CATEGORY_KEYWORDS` and dynamic regex matching from `store-sections.ts`.
  - Add automated test assertions verifying:
    1. Every item rule in `ITEM_RULES` specifies a valid `ItemCategory`.
    2. Every `StoreLayout` section configuration defines a mapping location for 100% of defined `ItemCategory` values.

### Q3. Automated Completeness Verification in `conversions.test.ts`

- **Question:** How should automated completeness verification be implemented to ensure that every `item` and `unit` referenced across all recipe files in `content/` is defined in `UNIT_DEFINITIONS` and `ITEM_RULES`?
- **Decision:** Extend existing static coverage assertions in `conversions.test.ts`.
- **Details:**
  - `conversions.test.ts` already contains tests asserting 100% recipe ingredient coverage and 100% `ITEM_RULES` coverage against `INGREDIENT_TEST_CASES`.
  - Update `INGREDIENT_TEST_CASES` to validate that `category` matches `ItemRule.category` using the `ItemCategory` enum.
  - Add a test assertion in `conversions.test.ts` verifying that 100% of units referenced in recipes and test cases exist in `UNIT_DEFINITIONS` / `UNIT_LOOKUP`.

### Q4. Production vs. Development Runtime Handling & Compiler-Stripped Dev Badges

- **Question:** How should production vs development handle unregistered items & units at runtime?
- **Decision:** Compiler-Stripped Dev-Mode Visual Warning Badges with Safe String Passthrough.
- **Details:**
  - In local development (`import.meta.env.DEV`), render inline visual badges (`⚠️ Unruled item`) on affected ingredients in `SingleRecipeScaler.svelte` and `ShoppingListColumn.svelte`.
  - In production builds (`import.meta.env.PROD`), Vite's tree-shaker evaluates `import.meta.env.DEV` as `false` and performs dead-code elimination, completely stripping warning logic and templates from `meal-planner.js`.
  - CI (`pnpm run ci` / `conversions.test.ts`) blocks any deployment containing un-ruled ingredients or un-registered units.

### Q5. Scope Separation & Structured `ItemForm[]` Alias Schema

- **Question:** How should `UNIT_DEFINITIONS` and `ITEM_RULES` be scoped, structured, and how should aliases be handled?
- **Decision:** Strict Separation of Concerns with Structured `ItemForm[]` Nesting.
- **Details:**
  - `UNIT_DEFINITIONS`: Scoped strictly to measurement units (`volume`, `weight`), package/container units (`can`, `box`, `jar`), counting terms (`clove`, `head`, `bunch`), and size modifiers (`large`, `medium`). Unit abbreviations (`tbsp`, `oz`, `g`) are registered in unit `aliases`.
  - `ITEM_RULES`: Scoped strictly to food ingredients. `items` uses a structured `ItemForm[]` array where each element specifies `{ singular, plural, aliases? }` (e.g. `{ singular: 'yellow onion', plural: 'yellow onions' }`).
  - `canonicalName` defines the merged display name on shopping lists.
  - No automatic cross-synthesis between units and items. Unit normalization occurs first via `UNIT_DEFINITIONS`, followed by item matching via `ITEM_RULES`.
  - `SINGULAR_TO_PLURAL` and `PLURAL_TO_SINGULAR` index maps are auto-populated at module load time by combining both registries.

### Q6. Integration of `simple-parser.ts` with Central Registries

- **Question:** How should `simple-parser.ts` integrate with `ITEM_RULES` and `UNIT_DEFINITIONS`?
- **Decision:** Eliminate hardcoded `unitList` and drive parsing directly from `UNIT_LOOKUP` and `ITEM_RULES`.
- **Details:**
  - Delete hardcoded `unitList` string array in `parseRawUserInput()`.
  - Use `UNIT_LOOKUP` (derived from `UNIT_DEFINITIONS`) to identify valid units from raw text input.
  - Match remaining item text against `ITEM_RULES` (checking `singular`, `plural`, and `aliases` across `ItemForm[]`).

### Q7. Elimination of Substring Heuristics in `isStaple()`

- **Question:** How should pantry staple detection in `pipeline.ts` be simplified?
- **Decision:** Replace heuristic fallback chain with explicit `rule.staple === true` on `ItemRule`.
- **Details:**
  - Delete `STAPLE_ITEMS` set and all string substring checks (`endsWith(' salt')`, `includes('pepper')`, `nonStapleSalts`, `staplePeppers`).
  - `isStaple(itemName, rule)` evaluates strictly to `rule?.staple === true`.

### Q8. Direct Canonical Key Lookup for Package Sizes (`us-grocery.json`)

- **Question:** How should package size lookup in `pipeline.ts` locate store sizes without searching multiple key variations?
- **Decision:** Index `us-grocery.json` strictly by `ItemRule.canonicalName`.
- **Details:**
  - Eliminate 3-step fallback search (`group.name` -> `group.key` -> `rule.items.map(...)`).
  - Lookup retrieves sizes via single direct fetch: `layout.itemSizes[rule.canonicalName]`.

### Q9. Elimination of Silent Category Fallback to `'other'`

- **Question:** Should items be allowed to silently fall back to category `'other'`?
- **Decision:** Eliminate silent fallback to `'other'` for all recipe ingredients.
- **Details:**
  - With `category: ItemCategory` required on every `ItemRule` (Q2) and 100% CI recipe item coverage enforced in `conversions.test.ts` (Q3), every ingredient in existing recipes resolves to a valid `ItemCategory`.

## Open Questions

_(All design decisions resolved!)_
