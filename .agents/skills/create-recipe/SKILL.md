---
name: create-recipe
description: Step-by-step instructions for creating a new recipe in Noonarby Casa Recipes, including leaf bundle setup, front matter schema, shortcodes, and verification.
---

# Creating a New Recipe in Noonarby Casa Recipes

This skill guides you through adding a new recipe leaf bundle to the Hugo website.

## 📁 1. Leaf Bundle Structure

Each recipe is stored inside `content/` as a Hugo leaf bundle:

- **Directory Path:** `content/<recipe-slug>/`
- **File Name:** `index.md` (e.g. `content/burst-cherry-tomato-orzotto/index.md`)
- **Featured Image:** If a recipe cover image is provided or generated, save it as `featured-image.webp`. Do NOT create `.jpg` files or dummy/broken placeholder image files.

## 📝 2. TOML Front Matter Schema

Every recipe must start with a TOML block. Refer to [archetypes/default.md](../../../themes/cookpot/archetypes/default.md) for the base schema.

```toml
+++
title = "Recipe Title in Title Case"
date = YYYY-MM-DDTHH:MM:SS-04:00 # Current local timestamp with timezone offset
slug = "recipe-slug-in-lowercase"
shortId = "clc" # Unique 2-6 letter lowercase alphabetic ID
servings = 4
times = [
  { time = "15 min", step = "prep" },
  { time = "30 min", step = "cook" }
]
recipeSource = "Noonarbys" # Default: "Noonarbys"
tags = ["chicken", "grill", "dinner"]

ingredients = [
  { category = "Main Section", items = [
    { qty = 2.25, unit = "pound", item = "chicken thigh", desc = "skin-on", prep = "deboned" }
  ] },
  { category = "Marinade", items = [
    { qty = 0.5, unit = "cup", item = "lime juice", desc = "fresh" },
    { qty = 4, unit = "clove", item = "garlic", prep = "finely chopped" },
    { item = "cilantro", desc = "fresh", prep = "chopped", optional = true }
  ] }
]
+++
```

### Property Rules & Guidelines:

1. **`shortId`:** Must be **2 to 6 lowercase letters only**. Verify uniqueness across [content/](../../../content/) using: `grep -RE "shortId =" content/`
2. **`tags`:** Include at least one primary category (`"breakfast"`, `"lunch"`, `"dinner"`, `"dessert"`, `"vegetarian"`, `"vegan"`) plus specific descriptive tags.
3. **`ingredients`:** Mapped to `IngredientInput` in [types.ts](../../../themes/cookpot/assets/js/types.ts).
   - `qty`: Numerical amount or tuple range `[min, max]` (e.g. `qty = [2, 3]`). Range bounds must be positive numbers with `min < max`.
   - `unit`: Standard unit from `UNIT_DEFINITIONS` in [constants.ts](../../../themes/cookpot/assets/js/constants.ts) (`"pound"`, `"cup"`, `"clove"`, `"can"`, etc.). Must be **entirely lowercase** and in **singular form** (e.g., `"cup"` not `"cups"`).
   - `item`: Use standard names in **singular form** (e.g. `"garlic"`, `"egg"`, `"grape tomato"`). The client engine handles pluralization dynamically on display.
     - **Constraint:** `item` names must NOT contain `"or"` or parentheses `()` (use `alt` for substitutes or secondary measurements).
   - `desc` / `prep`:
     - `desc`: Descriptive adjectives (e.g. `"fresh"`, `"skin-on"`, `"low-sodium"`).
     - `prep`: Preparation actions (e.g. `"finely chopped"`, `"minced"`).
     - **Constraint:** The term `"divided"` is a preparation term and must be placed in `prep`, never `desc`.
     - **Constraint:** Do not use the word `"about"` in string fields; use `alt` with `qty`/`unit` or ranges instead.
   - `optional`: (Optional) Set to `true` for optional garnishes, toppings, or seasonings (e.g. `optional = true`).
   - `alt`: (Optional) Alternative item or measurement mapped to `IngredientInputAlt` in [types.ts](../../../themes/cookpot/assets/js/types.ts):
     - Alternative item: `alt = { item = "chicken broth" }`
     - Secondary measurement: `alt = { qty = 1, unit = "tablespoon" }`
     - Per-package size: `alt = { qty = 3, unit = "ounce", each = true }`
     - **Constraints:** Cannot be empty; `alt.item` cannot resolve to the same canonical item as `item`; `alt.unit` cannot match the main `unit` (use range `qty = [min, max]` instead).
   - **No Duplicate Items:** Do not include duplicate items within the same category section (combine quantities instead).

## ✍️ 3. Instructions & Shortcodes

Under the TOML block, add a `## Instructions` section using custom shortcodes:

- **MANDATORY Ingredient References:** Every ingredient `item` (or its `alt.item`) in the front matter **must be referenced by name in `## Instructions`**. The pipeline linter checks this and will fail if an ingredient is omitted.
- **Ingredient Quantities:** `{{< qty "1/2 cup" >}}` or `{{< qty "2" >}} lemons` (wrap only the number for unsupported units).
- **Interactive Timers:** `{{< timer "5-7 minutes" >}}` or `{{< timer "30 seconds" >}}`.

## 🧪 4. Verification Checklist

Before completing recipe creation, perform the following verification steps:

1. **Ingredient Classification & Rules:**
   - Every ingredient must be classified by an item rule in [item-rules.json](../../../themes/cookpot/assets/data/item-rules.json).
   - If introducing a new ingredient, add an entry to [item-rules.json](../../../themes/cookpot/assets/data/item-rules.json) with `canonicalName`, `category`, and `items` (singular, plural, and aliases).
   - If adding new category keywords, update [category-keywords.json](../../../themes/cookpot/assets/data/category-keywords.json) ensuring no duplicate keywords across categories.
2. **Unit Tests:**
   - Add test cases for any new ingredients to `INGREDIENT_TEST_CASES` in [conversions.test.ts](../../../themes/cookpot/assets/js/pipelines/conversions.test.ts).
   - Ensure every recipe ingredient is covered by at least one test case.
   - Ensure every rule in `ITEM_RULES` is exercised by at least one test case.
   - Ensure all units are registered in `UNIT_DEFINITIONS` in [constants.ts](../../../themes/cookpot/assets/js/constants.ts).
3. **Fast Pipeline Check:** Run targeted unit tests to verify ingredient validation, store layout sizing, and conversions:
   ```bash
   pnpm exec vitest run themes/cookpot/assets/js/pipelines/rules.test.ts themes/cookpot/assets/js/pipelines/conversions.test.ts
   ```
4. **CI Pipeline:** Run `pnpm run ci` to check types, linting, formatting, CSS selector uniqueness, and unit tests (use `pnpm fix` if needed).
5. **Hugo Build:** Run `hugo --minify` to verify index generation and build success.

## 🔱 5. Version Control Protocol (`jj`)

Refer to the global `jj` skill. Always describe the target commit and squash changes:
`jj describe -m "Add recipe: <Recipe Name>"` -> `jj new` -> edit/test -> `jj squash --use-destination-message`.
