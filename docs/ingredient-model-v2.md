# Ingredient Data Model V2: Final Architecture

> **Status:** Finalized (incorporating all feedback)
> **Scope:** Recipe front matter, ingredient parsing, scaling, shopping list conversion, rule system

---

## 1. Flat Schema with `alt` Structure

To avoid nested arrays and handle both secondary measurements and alternate ingredient choices elegantly, the schema uses flat `qty` and `unit` fields, along with an optional `alt` structure.

### TypeScript Interface

```typescript
/** A quantity value: either a scalar or a [min, max] range tuple. */
type QtyValue = number | [number, number];

/** Fully structured recipe ingredient — no runtime parsing needed. */
interface IngredientInput {
  /** Primary quantity. Omit for unquantified items. */
  qty?: QtyValue;
  /** Primary unit (e.g. "cup", "large head"). Omit for count-based items. */
  unit?: string;
  /** Canonical base item name for merging/matching (e.g. "olive oil", "garlic"). */
  item: string;
  /** Prefix descriptor (modifiers before the item name). */
  desc?: string;
  /** Suffix (prep instructions, serving context — appears after item). */
  prep?: string;
  /** Whether this ingredient is optional. */
  optional?: boolean;

  /** Alternate structure: handles secondary measurements AND alternative ingredients. */
  alt?: {
    qty?: QtyValue;
    unit?: string;
    /** If true, appends "each" to the alternate unit. */
    each?: boolean;
    item?: string;
    desc?: string;
    prep?: string;
  };
}
```

### TOML Authoring Examples

```toml
# 1. Simple quantified
qty = 0.25
unit = "cup"
item = "olive oil"
desc = "extra-virgin"
# → "1/4 cup extra-virgin olive oil"

# 2. Unitless count
qty = 2
item = "garlic clove"
prep = "finely grated"
# → "2 garlic cloves, finely grated"

# 3. Alternate measurement (replaces sizeNote)
qty = 1
unit = "package"
item = "potato gnocchi"
desc = "shelf-stable"
[alt]
qty = [12, 18]
unit = "ounce"
# → "1 package (12-18 ounces) shelf-stable potato gnocchi"

# 4. Alternate item ("or...")
qty = 1
unit = "tablespoon"
item = "coconut oil"
[alt]
item = "olive oil"
# → "1 tablespoon coconut oil (or olive oil)"

# 5. Alternate state/prep
qty = 2.5
unit = "cup"
item = "raspberry"
desc = "fresh"
[alt]
desc = "frozen"
prep = "do not thaw"
# → "2 1/2 cups fresh raspberries (or frozen, do not thaw)"

# 6. Secondary amount with "each"
qty = 4
item = "summer squash"
[alt]
qty = [7, 8]
unit = "ounce"
each = true
# → "4 summer squash (7-8 ounces each)"
```

---

## 2. Display Text Reassembly Rules

The template or frontend code assembles the display string deterministically:

### Formatting Utilities

- **`format(qty)`**: Formats numeric fraction/range (e.g., `0.25` → `"1/4"`, `[12, 18]` → `"12-18"`).
- **`pluralize(word, qty)`**: Strips size prefixes from multi-word units to pluralize the base word (e.g., `"large head"` → `"large heads"`, `"medium clove"` → `"medium cloves"`). Pluralizes `item` if `unit` is omitted.

### Primary Assembly

`[qty + pluralize(unit)] + desc + item`

### Alt Assembly (Appended in parentheses)

If `alt` is present, it is formatted as:
`" (or " + [alt.qty + pluralize(alt.unit) + (alt.each ? " each" : "")] + alt.desc + alt.item + alt.prep + ")"`
_(Note: "or" is omitted if the `alt` structure only contains `qty`/`unit`/`each` and no descriptive/item fields, as it acts purely as a secondary measurement)._

### Suffix

`, + prep` (Primary prep is appended at the very end).

---

## 3. Data Hygiene and Edge Cases

- **Split Multi-Item Ingredients**: `item = "salt and pepper"` must be split into two separate ingredients. The same applies to compound garnishes (`"yogurt, avocado, cheese, for serving"`).
- **"About" is Dropped**: Approximate modifiers like "about 1 pound" are unnecessary; secondary measurements are understood to be approximate context.
- **Merge Keys**: The shopping list compiler only considers the primary `item`. The `alt.item` (if present) is attached as a note on the final shopping item.

---

## 4. Simplified Merging via `unitEquivalences`

Disparate units (e.g., cans and cups) can merge **if and only if** the item's rule defines an equivalence bridging them.

```typescript
// Universal table defines strict within-system conversions
const UNIT_CONVERSIONS = {
  cup: { system: 'volume', base: 'teaspoon', factor: 48 },
  ounce: { system: 'weight', base: 'ounce', factor: 1 },
};

// Item rules bridge systems and handle non-standard units (e.g., "can")
const ITEM_RULES: ItemRule[] = [
  {
    items: ['chickpea'],
    itemSizes: [[1, 'can (15 oz)']],
    unitEquivalences: {
      can: { base: 'ounce', factor: 15 }, // 1 can = 15 oz
      cup: { base: 'ounce', factor: 8.5 }, // 1 cup of chickpeas ≈ 8.5 oz
    },
  },
];
```

**Merge Algorithm:**

1. Group all "chickpea" ingredients.
2. `1 can` translates to `15 oz`.
3. `1 cup` translates to `8.5 oz`.
4. Total = `23.5 oz`.
5. Match to `itemSizes`: `23.5 oz` requires `2 cans (15 oz)`.
   _(This replaces the complex `partName` and fuzzy substring matching)._

---

## 5. Simplified `ItemRule` and `ShoppingItem` Notes

### Dropping Part-Tracking

Items like `lemon juice` and `lemon zest` will remain distinct on the shopping list instead of merging into whole lemons. This eliminates the need for `groupKey` and complex part-tracking logic in the compiler.

### ShoppingItem Simplification

Because we no longer track conversion parts or generate explanatory package math (e.g., "1 stick = 8 tbsp"), the `NoteItem` structure on `ShoppingItem` is dramatically simplified:

```typescript
// Before
interface ShoppingItem {
  notes: Record<string, NoteItem[]>; // { "lemon": [{ recipe: "X", part: "juice", ... }] }
}

// After
interface ShoppingItem {
  // Simple list of recipe attributions and alternate item choices
  notes: { recipe: string; altItem?: string }[];
}
```

### The `ItemRule` Interface

```typescript
interface ItemRule {
  items: string[];
  /** Store package sizes, ordered small → large */
  itemSizes?: [number, string][];
  /** Item-specific unit conversions */
  unitEquivalences?: Record<string, { base: string; factor: number }>;
}
```

Staples are resolved using a flat `Set<string>`. If a recipe calls for an item that could be a pantry staple (e.g., bottled lemon juice) or fresh, the standard merge rules apply, and the user can decide whether to mark it as fulfilled.

---

## 6. Migration Plan

- **No Backward Compatibility:** The legacy string-parsing codebase (`parseIngredientSegments`, `MODIFIERS`, fuzzy rules) will be entirely deleted (~1,200 lines removed).
- **Migration:** A script will convert existing recipe front matter to the new `qty`/`unit`/`alt` schema.
- **Shortcodes:** Existing `{{< qty >}}` shortcodes inside markdown bodies are unaffected, though they could optionally be updated to match the new schema arguments.
