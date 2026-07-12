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

Every recipe must start with a TOML block. Refer to [archetypes/default.md](../../../archetypes/default.md) for the base schema.

Here is the recommended format:

```toml
+++
title = "Recipe Title in Title Case"
date = YYYY-MM-DDTHH:MM:SS-04:00 # Current local date/time (use local offset)
slug = "recipe-slug-in-lowercase"
shortId = "clc" # Unique 2-6 letter lowercase alphabetic ID. Search existing recipes first to avoid duplication!
servings = 4
times = [
  { time = "15 min", step = "prep" },
  { time = "2 hours", step = "marinate" }, # (optional)
  { time = "30 min", step = "cook" }
]
recipeSource = "Noonarbys" # Or "Rickarbys", etc. (defaults to "Noonarby")
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

### TOML Properties & Guidelines:

1. **`shortId` Validation:**
   - Must be **2 to 6 lowercase letters only** (no numbers, hyphens, or uppercase letters).
   - Must be **globally unique** across all recipes.
   - The build pipeline template [index.json](../../../themes/cookpot/layouts/index.json) validates this. If `shortId` is missing, duplicate, or invalid, the Hugo build will throw a build error and fail.

2. **`tags` Categories:**
   - Always include at least one of the primary tags from [constants.ts](../../../themes/cookpot/assets/js/constants.ts): `"breakfast"`, `"lunch"`, `"dinner"`, `"dessert"`, `"vegetarian"`, or `"vegan"`.
   - Add other specific tags (e.g. `"chicken"`, `"baking"`, `"pasta"`, `"soup"`, `"salad"`, `"easy"`, `"summer"`) as appropriate.

3. **`ingredients` Structure:**
   - Mapped to the `IngredientInput` type in [types.ts](../../../themes/cookpot/assets/js/shopping-list/types.ts).
   - `qty`: Numerical value (e.g., `2.25` or `0.333` instead of `"2 1/4"` or `"1/3"`).
     - **Range Support:** Can be a tuple range `[min, max]` (e.g., `qty = [2, 3]` for 2 to 3 garlic cloves).
   - `unit`: Supported unit name from [rules.ts](../../../themes/cookpot/assets/js/shopping-list/rules.ts). Prefer standard singular forms: `"pound"`, `"ounce"`, `"cup"`, `"tablespoon"`, `"teaspoon"`, `"clove"`, `"can"`, `"package"`, `"bag"`, `"box"`, `"jar"`, `"root"`, `"head"`, `"bundle"`, etc.
   - `item`: Name of the ingredient. Use standard names where possible to match shopping list rules (e.g., `"garlic"`, `"butter"`, `"egg"`, `"lemon"`, `"lime"`, `"ginger"`, `"onion"`, `"coconut milk"`, `"cabbage"`, `"scallion"`, `"potato gnocchi"`, `"baby spinach"`, or canned/pasta names).
   - `desc`: (Optional) Descriptors like `"fresh"`, `"skin-on"`.
   - `prep`: (Optional) Preparation steps like `"finely chopped"`, `"minced"`, `"diced"`.
   - `optional`: (Optional) Set to `true` if the ingredient is optional.
   - `alt`: (Optional) Alternative measurement or substitution, mapped to the `IngredientInputAlt` type:
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
- Refer to [rules.ts](../../../themes/cookpot/assets/js/shopping-list/rules.ts) for standard units.

### ⏱️ Timers

Wrap all step durations in the `timer` shortcode to enable interactive cooking timers:

- **Format:** `{{< timer "duration" >}}` (e.g., `{{< timer "30 seconds" >}}`, `{{< timer "5-7 minutes" >}}`, or `{{< timer "2 hours" >}}`).
- **Timer Range Support:** Durations can specify a range (e.g., `"5-7 minutes"`). The unit (minutes, seconds, hours, etc.) must be specified at the very end of the range.
- Separate audio bounds will play at the lower and upper bounds of a range timer, whereas a single timer only plays at the upper bound.

## 🧪 4. Verification & Testing

Before squashing or committing any changes:

1. **Lint and Format:** Execute `pnpm ci` to run typechecking (`tsc`), linting (`eslint`), formatting (`prettier`), and unit tests (`vitest`).
2. **Auto-Fix:** Use `pnpm fix` to automatically correct linting or formatting issues if any are found.
3. **Hugo Build:** Run `hugo --minify` in the repository root to verify that the static site builds successfully and index validation succeeds.

## 🔱 5. Version Control Protocol (Jujutsu)

Always use the standard Jujutsu workflow when implementing changes:

1. Describe the target (parent) commit: `jj describe -m "Add recipe: <Recipe Name>"`
2. Create a scratch commit: `jj new`
3. Implement files and perform testing.
4. Squash changes into the described commit: `jj squash`
