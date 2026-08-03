# AGENTS.md - Noonarby Casa Recipes

This file defines high-level context, architecture mapping, and technical guardrails for agentic coding assistants.

## 📖 Project Overview

- **Site Type:** Hugo (Extended) static site with custom theme `cookpot` and interactive Svelte 5 components.
- **Live Production URL:** [recipes.noonarby.casa](https://recipes.noonarby.casa/)
- **Primary Stack:** Hugo Extended, Svelte 5, Vite, TypeScript, Vanilla CSS, Version Control: Jujutsu (`jj`).
- **Content Path:** [content/](content/) (Hugo leaf bundles).

---

## 🎨 Styling & Design System Rules

The project uses a pure **Vanilla CSS** design system under [themes/cookpot/assets/css/](themes/cookpot/assets/css/).

1. **Design Tokens:** Theme properties live as CSS variables in [variables.css](themes/cookpot/assets/css/variables.css).
2. **Single Rule Definition:** Each CSS selector combination must exist in only one location project-wide (enforced via `pnpm run check:styles` / [scripts/check-style-rules.js](scripts/check-style-rules.js)).
3. **Scoping Rules:** Svelte-only styles belong inside Svelte `<style>` blocks. Shared or Hugo-rendered styles live under [assets/css/](themes/cookpot/assets/css/).
4. **No Unused Styles:** Selectors not present in site templates or Svelte components must be removed.

---

## 📂 Key Architecture & Code Index

For detailed architectural patterns, see [docs/architecture.md](docs/architecture.md).

| Feature Domain         | Key Logic & State                                                                                                                                                                          | UI Components                                                                                                                                                                          |
| :--------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Timers & Audio**     | [timers.ts](themes/cookpot/assets/js/stores/timers.ts), [audio.ts](themes/cookpot/assets/js/audio.ts)                                                                                      | [InlineTimer.svelte](themes/cookpot/assets/js/components/InlineTimer.svelte), [TimersManager.svelte](themes/cookpot/assets/js/components/TimersManager.svelte)                         |
| **Parsing & Scaling**  | [simple-parser.ts](themes/cookpot/assets/js/simple-parser.ts), [units.ts](themes/cookpot/assets/js/units.ts)                                                                               | [SingleRecipeScaler.svelte](themes/cookpot/assets/js/components/SingleRecipeScaler.svelte)                                                                                             |
| **Shopping List**      | [pipeline.ts](themes/cookpot/assets/js/shopping-list/pipeline.ts), [rules.ts](themes/cookpot/assets/js/shopping-list/rules.ts), [shopping.ts](themes/cookpot/assets/js/stores/shopping.ts) | [RecipeShoppingList.svelte](themes/cookpot/assets/js/components/RecipeShoppingList.svelte), [ShoppingListColumn.svelte](themes/cookpot/assets/js/components/ShoppingListColumn.svelte) |
| **Meal Planner**       | [planner.ts](themes/cookpot/assets/js/stores/planner.ts), [planUrlSync.ts](themes/cookpot/assets/js/stores/planUrlSync.ts)                                                                 | [MealPlannerApp.svelte](themes/cookpot/assets/js/components/MealPlannerApp.svelte)                                                                                                     |
| **Search & Favorites** | [filters.ts](themes/cookpot/assets/js/stores/filters.ts), [favorites.ts](themes/cookpot/assets/js/stores/favorites.ts)                                                                     | [HomepageSearchApp.svelte](themes/cookpot/assets/js/components/HomepageSearchApp.svelte), [FavoriteButton.svelte](themes/cookpot/assets/js/components/FavoriteButton.svelte)           |

---

## ✍️ Recipe Creation

To add or modify recipes, follow the workspace skill instructions in **[.agents/skills/create-recipe/SKILL.md](.agents/skills/create-recipe/SKILL.md)**.

---

## 🤖 AI Assistant Workflows & Rules

1. **Version Control Protocol (`jj`):** Always consult and adhere to the global `jj` skill before running any `jj` command. Always use `--no-pager --color=never` for read-only commands and `jj describe -m "description"` to log work descriptions inline. Do not use git.
2. **TypeScript & Code Quality:**
   - Avoid non-null assertions (`!`) or type assertions (`as Type`) when narrowing via runtime checks (`if (!x) return;`) is possible.
   - Use `CONSTANT_CASE` for deeply immutable exported constants and `camelCase` for local variables and mutable state.
   - Always format file paths and symbols as clickable Markdown links using `file://` scheme.
3. **Verification Before Task Completion:**
   - AI assistants **MUST** execute `pnpm run ci` before completing tasks to verify typechecking, linting, Prettier formatting, CSS selector uniqueness, and unit tests.
   - Use `pnpm fix` to resolve linting or formatting violations automatically.
