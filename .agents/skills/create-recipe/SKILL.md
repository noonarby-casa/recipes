---
name: create-recipe
description: Step-by-step instructions for creating a new recipe in Noonarby Casa Recipes, including leaf bundle setup, front matter schema, shortcodes, and verification.
---

# Creating a New Recipe in Noonarby Casa Recipes

This skill guides you through adding a new recipe leaf bundle to the Hugo website.

## 📁 1. Leaf Bundle Structure

Each recipe is stored inside `content/` as a Hugo leaf bundle:

- **Directory Path:** `content/<recipe-slug>/`
- **File Name:** `index.md` (e.g. `content/chili-lime-grilled-chicken/index.md`)
- **Note:** Do NOT create `featured-image.jpg` or any featured image files.

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
recipeSource = "Noonarbys" # Default: "Noonarby"
tags = ["chicken", "grill", "dinner"]

ingredients = [
  { category = "Main Section", items = [
    { qty = 2.25, unit = "pound", item = "chicken thigh", desc = "skin-on", prep = "deboned" }
  ] },
  { category = "Marinade", items = [
    { qty = 0.5, unit = "cup", item = "lime juice", desc = "fresh" },
    { qty = 4, unit = "clove", item = "garlic", prep = "finely chopped" }
  ] }
]
+++
```

### Property Rules & Guidelines:

1. **`shortId`:** Must be **2 to 6 lowercase letters only**. Verify uniqueness across [content/](../../../content/) using: `grep -RE "shortId =" content/`
2. **`tags`:** Include at least one primary category (`"breakfast"`, `"lunch"`, `"dinner"`, `"dessert"`, `"vegetarian"`, `"vegan"`) plus specific descriptive tags.
3. **`ingredients`:** Mapped to `IngredientInput` in [types.ts](../../../themes/cookpot/assets/js/types.ts).
   - `qty`: Numerical amount or tuple range `[min, max]` (e.g. `qty = [2, 3]`).
   - `unit`: Standard unit from UNIT_DEFINITIONS in [constants.ts](../../../themes/cookpot/assets/js/constants.ts) (`"pound"`, `"cup"`, `"clove"`, `"can"`, etc.).
   - `item`: Use standard names in **singular form** (e.g. `"garlic"`, `"egg"`, `"grape tomato"`). The client engine handles pluralization dynamically on display.
   - `desc` / `prep`: Optional descriptors (e.g. `"fresh"`, `"minced"`).
   - `alt`: (Optional) Alternative item or measurement (e.g. `alt = { item = "soy sauce" }`).

## ✍️ 3. Instructions & Shortcodes

Under the TOML block, add a `## Instructions` section using custom shortcodes:

- **Ingredient Quantities:** `{{< qty "1/2 cup" >}}` or `{{< qty "2" >}} lemons` (wrap only the number for unsupported units).
- **Interactive Timers:** `{{< timer "5-7 minutes" >}}` or `{{< timer "30 seconds" >}}`.

## 🧪 4. Verification Checklist

Before completing recipe creation:

1. **Unit Tests:** Add test cases for any new ingredients to `INGREDIENT_TEST_CASES` in [conversions.test.ts](../../../themes/cookpot/assets/js/pipelines/conversions.test.ts).
2. **Store Sections:** Check section mapping in [category-keywords.json](../../../themes/cookpot/assets/data/category-keywords.json) so new items don't fall back to `"Other"`.
3. **CI Pipeline:** Run `pnpm run ci` to check types, linting, formatting, and unit tests (use `pnpm fix` if needed).
4. **Hugo Build:** Run `hugo --minify` to verify index generation and build success.

## 🔱 5. Version Control Protocol (`jj`)

Refer to the global `jj` skill. Always describe the target commit and squash changes:
`jj describe -m "Add recipe: <Recipe Name>"` -> `jj new` -> edit/test -> `jj squash -u`.
