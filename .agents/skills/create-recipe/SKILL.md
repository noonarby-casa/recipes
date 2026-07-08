---
name: create-recipe
description: Documents the step-by-step instructions for creating a new recipe in the Noonarby Casa Recipes website, including front matter schema, formatting quantity and timer shortcodes, and running verification checks.
---

# Creating a New Recipe in Noonarby Casa Recipes

This skill guides you through adding a new recipe leaf bundle to the Hugo website.

## 📁 1. Leaf Bundle Structure

Each recipe is created as a Hugo leaf bundle inside `content/`:

- **Directory Path:** `content/<recipe-slug>/`
- **File Name:** `index.md` (e.g. `content/chili-lime-grilled-chicken/index.md`)
- **Important:** Do NOT create `featured-image.jpg` or any featured image files when creating new recipes.

## 📝 2. TOML Front Matter Schema

Every recipe must start with a TOML block. Refer to [archetypes/default.md](file:///home/nicholasnooney/projects/noonarby-casa/recipes/archetypes/default.md) for the base schema.

Here is the format:

```toml
+++
title = "Recipe Title in Title Case"
date = YYYY-MM-DDTHH:MM:SS-04:00 # Current local date/time
slug = "recipe-slug-in-lowercase"
shortId = "xxx" # Unique 3-letter lowercase alphabetic ID. Search existing recipes first to avoid duplication!
servings = 4
times = [
  { time = "15 min", step = "prep" },
  { time = "2 hours", step = "marinate" }, # (optional)
  { time = "30 min", step = "cook" }
]
recipeSource = "Noonarbys" # Or "Rickarbys", etc.
tags = [
  "chicken",
  "grill",
  "summer",
  "easy",
  "dinner"
]

ingredients = [
  { category = "Chicken", items = [
    { qty = 2.25, unit = "pound", item = "chicken thighs", desc = "skin-on", prep = "deboned" }
  ] },
  { category = "Marinade", items = [
    { qty = 0.5, unit = "cup", item = "lime juice", desc = "fresh" },
    { qty = 3, unit = "teaspoon", item = "lime zest", desc = "fresh" },
    { qty = 4, unit = "clove", item = "garlic", prep = "finely chopped" }
  ] }
]
+++
```

### TOML Ingredient Object Properties:

In the TypeScript codebase, a recipe ingredient is represented by the `IngredientInput` type (defined in [types.ts](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/shopping-list/types.ts)):

- `qty`: Numerical value (e.g., `2.25` instead of `"2 1/4"`). Mapped to `QtyValue`.
- `unit`: Supported unit name from [config.ts](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/shopping-list/config.ts) (e.g., `"pound"`, `"ounce"`, `"cup"`, `"tablespoon"`, `"teaspoon"`, `"clove"`, `"can"`, etc.).
- `item`: Name of the ingredient.
- `desc`: (Optional) Descriptors such as `"fresh"`, `"skin-on"`.
- `prep`: (Optional) Preparation steps like `"finely chopped"`, `"minced"`.
- `optional`: (Optional) Set to `true` if the ingredient is optional.
- `alt`: (Optional) Alternative ingredient or secondary measurement option, mapped to the `IngredientInputAlt` type:
  ```toml
  # Example alternative ingredient
  alt = { item = "regular soy sauce" }
  # Example secondary measurement
  alt = { qty = 1, unit = "tablespoon", item = "hot chilli sauce" }
  ```

## ✍️ 3. Instructions & Shortcodes

Under the TOML block, add a `## Instructions` section. You must format ingredient quantities and step durations using the custom Hugo shortcodes:

### 🥄 Ingredient Quantities

Wrap ingredient quantities in step descriptions with the `qty` shortcode:

- **Standard Unit:** `{{< qty "amount unit" >}}` (e.g., `{{< qty "1/2 cup" >}}` or `{{< qty "2 1/4 pounds" >}}`).
- **Unsupported/Non-standard Unit:** Wrap _only_ the numeric amount (e.g., `{{< qty "1" >}} lemon` or `{{< qty "2" >}} jalapeños`).
- Refer to [config.ts](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/shopping-list/config.ts) for standard units.

### ⏱️ Timers

Wrap all step durations in the `timer` shortcode to enable interactive cooking timers:

- **Format:** `{{< timer "duration" >}}` (e.g., `{{< timer "5-7 minutes" >}}`, `{{< timer "2 hours" >}}`, or `{{< timer "30 seconds" >}}`).

## 🧪 4. Verification & Testing

Before squashing or committing any changes:

1. **Lint and Format:** Execute `pnpm run ci` to run typechecking, linting (`eslint`), and code formatting checks (`prettier`).
2. **Auto-Fix:** Use `pnpm run fix` to automatically correct linting or formatting issues if any are found.
3. **Hugo Build:** Run `hugo --minify` in the repository root to verify that the static site builds successfully and the new recipe is indexed properly.

## 🔱 5. Version Control Protocol (Jujutsu)

Always use the standard Jujutsu workflow when implementing changes:

1. Create a scratch commit: `jj new`
2. Describe your work: `jj describe -m "Add recipe: <Recipe Name>"`
3. Implement files and perform testing.
4. Squash changes into the described commit: `jj squash`

## 6. Continuous Improvement

After adding a recipe, continuously improve this skill with learnings.
