# Grill Session: Combining Recipe Ingredients in Meal Plan Shopping List

## Context & Root Cause Findings

1. **Case 1 (3 Onions):**
   - _Indian Butter Chickpeas_ specifies `1.5 cups onion` (with `alt: 1 large`).
   - _Spicy Creamy Weeknight Bolognese_ specifies `1 large onion`.
   - The shopping list rule for onion maps `1 cup = 1 onion`.
   - The pipeline ignores `alt` for primary quantification, converting `1.5 cups` -> `1.5 onions`.
   - Combined total: `1.5 + 1 = 2.5 onions`.
   - Countable item logic applies `Math.ceil(2.5)`, rounding up to **3 onions**.

2. **Case 2 (2 x 28 oz Cans of Tomato Sauce):**
   - _Indian Butter Chickpeas_ specifies `1 can (15-ounce) tomato sauce` (15 oz).
   - _Spicy Creamy Weeknight Bolognese_ specifies `1 can (15 ounces) tomato sauce` (15 oz).
   - Combined total needed: **30 oz**.
   - `tomato sauce` matches Rule 15, inheriting size lookup for `"fire roasted tomato"` with sizes `[15 oz, 28 oz]` from `us-grocery.json`.
   - Because 30 oz exceeds the largest package (28 oz), the current matching logic defaults to buying multiples of the largest package: `Math.ceil(30 / 28) = 2` cans of 28 oz (56 oz total, 26 oz over-purchase).

## Closed Decisions

### Q1. Alternate Unit (`alt`) Preference for Countable Ingredients

- **Question:** How should the shopping list pipeline determine the canonical quantity when an ingredient specifies both volume and an alternate count (`alt`)?
- **Decision:** Option A — If an ingredient includes an `alt` structure whose unit matches the target item unit or count-based unit (e.g. `"large"`), prefer `ing.alt.qty` over converting `ing.qty` via `unitEquivalences`.
- **Details:**
  - For Butter Chickpeas (`1.5 cups onion`, `alt: 1 large`), `ing.alt.qty` (1) is used instead of converting 1.5 cups via 1 cup = 1 onion.
  - Combined result: 1 large (from alt) + 1 large (Bolognese) = **2 large onions**.

### Q2. Direct Package Unit Arithmetic for Identical Container Units

- **Question:** How should the shopping list pipeline aggregate items when all recipes specify the same explicit package unit (e.g. `can (15-ounce)` and `can (15 ounces)`)?
- **Decision:** Option A — Direct Package Addition when Normalized Units Match.
- **Details:**
  - Normalize units using `getSingularUnit()` (`can (15-ounce)` and `can (15 ounces)` both become `can (15 oz)`).
  - If all ingredients for an item share the same normalized container unit, retain that unit as `targetUnit`, bypass base unit conversion to `ounce`, and directly sum quantities ($1 + 1 = 2$).
  - Bypass store package size lookup/matching for matched container units.
  - Result for Case 2: **2 cans (15 oz) of tomato sauce**.

### Q3. Minimal-Waste Package Matcher Algorithm for Heterogeneous Units

- **Question:** How should the pipeline evaluate package sizes when converting ingredients with different units (e.g. `15 oz` + `8 oz` = `23 oz`) to base units?
- **Decision:** Option A — 3-Tier Minimal-Waste Candidate Scorer.
- **Details:**
  - **Tier 1:** Minimize waste ($\text{purchased} - \text{needed}$).
  - **Tier 2:** Minimize container count.
  - **Tier 3:** Prefer uniform single-size package multiples over mixed packages when waste difference is zero.

### Q4. Rule Data Quality & Rule Splitting

- **Question:** How should multi-item rules (like Rule 15 grouping `fire roasted tomato`, `tomato sauce`, and `tomato paste`) handle distinct store package sizes?
- **Decision:** Split generic rules into specific rules with explicit `canonicalName` values and corresponding entries in `us-grocery.json`.
- **Details:**
  - Split Rule 15 into separate rules for `tomato sauce`, `tomato paste`, and `canned tomatoes`.
  - Add explicit package size entries in `us-grocery.json` for `tomato sauce` (`[8 oz, 15 oz, 28 oz]`) and `tomato paste` (`[6 oz]`).

### Q5. Onion Volume-to-Count Fallback (without `alt`)

- **Question:** Is `1 cup = 1 onion` acceptable as a rule fallback when an ingredient does not supply an `alt` field?
- **Decision:** Option A — Keep `1 cup = 1 onion` as fallback rule equivalence.

### Q6 & Q7. Single-Source `UnitDefinition` Registry with Derived Index Maps

- **Question:** How should `singular`, `plural`, `aliases`, and `category` be structured, and how should index maps (`SINGULAR_TO_PLURAL`, `PLURAL_TO_SINGULAR`) be maintained?
- **Decision:** Define a master `UNIT_DEFINITIONS: UnitDefinition[]` list in `constants.ts` and auto-derive index maps (`SINGULAR_TO_PLURAL`, `PLURAL_TO_SINGULAR`, `UNIT_LOOKUP`) at module load time.
- **Details:**
  - `UnitDefinition` contains `{ singular, plural, category, base?, factor?, aliases? }`.
  - `SINGULAR_TO_PLURAL` and `PLURAL_TO_SINGULAR` are automatically built from `UNIT_DEFINITIONS`, maintaining 100% backwards compatibility with existing UI formatting code.
  - `UNIT_LOOKUP` indexes definitions by singular, plural, and alias keys for $O(1)$ unit category checks (`UNIT_LOOKUP[unit].category`).

### Q8. Item-Level `pluralByDefault` in `ItemRule`

- **Question:** Where should `pluralByDefault` be configured for collection items (like `chickpeas`, `black beans`, `olives`)?
- **Decision:** Add `pluralByDefault?: boolean` directly to the `ItemRule` interface in `types.ts` and configure it per item rule in `rules.ts`.

### Q9. Pantry Staples in `ItemRule` (`staple?: boolean`)

- **Question:** Should `isStaple` also be consolidated onto `ItemRule`?
- **Decision:** Yes — Add `staple?: boolean` to `ItemRule` interface in `types.ts` and configure it on item rules in `rules.ts`.
- **Details:**
  - Replaces fragile string parsing in `isStaple()` (`lower.endsWith(' salt')`, `lower.includes('pepper')`) with `rule?.staple === true`.
  - `STAPLE_ITEMS` set in `rules.ts` remains as a secondary fallback for un-ruled items.

## Open Questions

_(All decision branches resolved)_
