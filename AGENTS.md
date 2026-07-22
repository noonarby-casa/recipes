# AGENTS.md - Noonarby Casa Recipes

<!--
This is the AGENTS.md project rule file. It provides high-level context, environment instructions,
and technical guardrails for agentic coding assistants. Keep this file up-to-date.
-->

## 📖 Project Overview

This is a **Hugo-based static website** for displaying recipes for the **Noonarby Casa**. It uses the recipe-focused Hugo theme `cookpot` with interactive Svelte 5 components and is deployed to **Firebase Hosting**.

- **Live Production URL:** [recipes.noonarby.casa](https://recipes.noonarby.casa/)
- **Primary Author:** Nicholas Noonarby
- **Content Path:** Recipe markdown files are placed under `content/` as Hugo leaf bundles.
- **Primary Stack:** Hugo (Extended), Svelte 5, Vite, TypeScript, Vanilla CSS, Version Control: Jujutsu (jj).

---

## 🎨 Design System & Styling Guidelines

The project uses a pure **Vanilla CSS** modular design system located under [assets/css/](themes/cookpot/assets/css/).

### Breakpoints & Cooking Mode

- **Standard Tablet/Desktop Portrait (min-width: 768px):** The `.recipe-container` uses a `1fr 2fr` split grid (ingredients on left, instructions on right) with standard page scrolling.
- **Landscape Cooking Dashboard (min-width: 768px in landscape or 1024px desktop):** Page locks into a **Viewport-Locked Cooking Dashboard** (`100vh` height):
  - No outer page scrolling (`body.recipe-single-layout` locks viewport overflow).
  - Ingredients column (`1fr`) and instructions column (`1.6fr`) scroll independently.
  - The recipe title bar (`.recipe-title-bar`) and scaling panel (`.recipe-scale-panel`) sit side-by-side.

### Core styling variables & theme

- Primary color variables are defined in [variables.css](themes/cookpot/assets/css/variables.css) (`--noonblue`, `--noonblue-hover`, etc.).
- Prevent layout shift with `scrollbar-gutter: stable` on `html` in [global.css](themes/cookpot/assets/css/global.css).
- Theme-wide dark mode applies `.dark-mode` to `<html>` via inline script in [head.html](themes/cookpot/layouts/_partials/head.html) and toggle button in [darkmode.ts](themes/cookpot/assets/js/darkmode.ts).

### Hybrid CSS Sharing Guidelines

When building or modifying components in the hybrid Hugo + Svelte architecture, keep styling clean and unified:

- **Design Tokens:** Always define theme properties (colors, borders, shadows, spacing) as CSS variables inside [variables.css](themes/cookpot/assets/css/variables.css). Both Hugo CSS files and Svelte `<style>` blocks should consume these variables directly to ensure changes propagate.
- **Semantic Components & Utility Classes:** Define global styling rules and components (located under [themes/cookpot/assets/css/components/](themes/cookpot/assets/css/components/), e.g. [compound-list.css](themes/cookpot/assets/css/components/compound-list.css)) inside Hugo's stylesheet bundle. Output identical class names (e.g., `compound-list`) in Svelte templates to inherit layout/style features without duplication.
- **Selective Scoping:** Use Svelte's `:global()` modifier to style or react to Hugo-rendered parent states (e.g., `:global(html.dark-mode) .your-svelte-class`).

### Style Organization & Scoping Rules

All stylesheets and component styles in the project MUST adhere strictly to the following 4 scoping & uniqueness rules:

1. **No Unused Styles:** No styles exist for selectors which are not present in the site (e.g. if a class name or id doesn't exist in both Hugo templates and Svelte components). Those unused selectors must be removed.
2. **Svelte Component Scoping:** If a style selector only applies to a Svelte component, then the style must exist within the Svelte component's `<style>` block.
3. **Shared & Hugo Layout CSS:** If a style exists in a Hugo template, or is shared between a Hugo template and a Svelte component, then the style lives in an appropriately scoped CSS file under [assets/css/](themes/cookpot/assets/css/).
4. **Single Selector Rule Definition:** There must be only one CSS rule for a particular selector combination across CSS and Svelte components (verified via `pnpm run check:styles` using [scripts/check-style-rules.js](scripts/check-style-rules.js)).

---

## ⌨️ Implementation & Major Features

The project uses **TypeScript** and **Svelte 5** components located under [themes/cookpot/assets/js/](themes/cookpot/assets/js/), mounted to target containers rendered by Hugo templates via [svelte-main.ts](themes/cookpot/assets/js/svelte-main.ts).

### Timers & Audio

Cooking timers logic and state are managed in [timers.ts](themes/cookpot/assets/js/stores/timers.ts) and rendered via [InlineTimer.svelte](themes/cookpot/assets/js/components/InlineTimer.svelte) and [TimersManager.svelte](themes/cookpot/assets/js/components/TimersManager.svelte). When a timer expires, audio alert feedback is played via [audio.ts](themes/cookpot/assets/js/audio.ts).

Timers can either specify a range or a single time. Separate sounds are played for the lower and upper bounds of a range timer. For a single timer, only the upper bound is played.

### Parsing Ingredients & Scaling

Ingredients get automatically parsed for scaling in [simple-parser.ts](themes/cookpot/assets/js/simple-parser.ts) and formatted/scaled by UI component [SingleRecipeScaler.svelte](themes/cookpot/assets/js/components/SingleRecipeScaler.svelte) and unit helper [units.ts](themes/cookpot/assets/js/units.ts):

- **Countable Items:** Items with no unit or size-only units (e.g. `large`, `medium`, `small`) are scaled and pluralized/singularized based on quantity (e.g., `1 banana`, `2 bananas`, `3 large eggs`).
- **Collection Items:** Items measured by container/weight/volume units that are in `PLURAL_BY_DEFAULT_ITEMS` (defined in [constants.ts](themes/cookpot/assets/js/constants.ts)) are forced to stay plural (e.g., `1 can black beans`, `1/2 cup pitted Kalamata olives`).
- **Mass Nouns:** Other items measured by container/weight/volume units are treated as uncountable mass nouns and are never pluralized or singularized (e.g., `1 cup flour`, `2 cups milk`).

### Shopping List

Code to automatically convert a list of parsed ingredients into a shopping list is processed in [pipeline.ts](themes/cookpot/assets/js/shopping-list/pipeline.ts), with supporting logic in the [shopping-list](themes/cookpot/assets/js/shopping-list/) folder and state management in [shopping.ts](themes/cookpot/assets/js/stores/shopping.ts). UI components include [RecipeShoppingList.svelte](themes/cookpot/assets/js/components/RecipeShoppingList.svelte) and [ShoppingListColumn.svelte](themes/cookpot/assets/js/components/ShoppingListColumn.svelte).

Unit conversions and formatting rules are defined in [rules.ts](themes/cookpot/assets/js/shopping-list/rules.ts), and store category mapping is defined in [store-sections.ts](themes/cookpot/assets/js/shopping-list/store-sections.ts).

### Meal Planning

A meal planning feature is managed by [planner.ts](themes/cookpot/assets/js/stores/planner.ts) with URL synchronization in [planUrlSync.ts](themes/cookpot/assets/js/stores/planUrlSync.ts) and rendered via [MealPlannerApp.svelte](themes/cookpot/assets/js/components/MealPlannerApp.svelte). It handles selecting several recipes, scheduling meal slots, and generating a combined shopping list.

### Search, Filtering & Favorites

- **Search & Tag Filtering:** Interactive homepage and tag search is driven by [HomepageSearchApp.svelte](themes/cookpot/assets/js/components/HomepageSearchApp.svelte) and filter store [filters.ts](themes/cookpot/assets/js/stores/filters.ts).
- **Favorites:** Recipe bookmarking state is maintained in [favorites.ts](themes/cookpot/assets/js/stores/favorites.ts) and toggled via [FavoriteButton.svelte](themes/cookpot/assets/js/components/FavoriteButton.svelte).

---

## ✍️ Recipe Creation

To add or modify recipes, you **MUST** refer to and follow the instructions in the workspace-local skill:

- **Recipe Creation Skill:** [.agents/skills/create-recipe/SKILL.md](.agents/skills/create-recipe/SKILL.md)

---

## 🤖 AI Assistant Workflows & Rules

### 1. Version Control Protocol (Jujutsu)

- Refer to the global `jj` skill for detailed guidelines, constraints, and non-interactive command execution protocols before running any `jj` operations.
- Always use `jj describe -m "description"` to log work descriptions when tasks are finished. Do not use git.

### 2. Implementation Guidelines

- **No Placeholders:** Never use mock images or placeholder text. Always generate high-fidelity assets or realistic mock data.
- **Semantic HTML:** Always use semantic elements to maximize accessibility and SEO.
- **TypeScript Style Guide:**
  - **No Redundant Type/Non-Null Assertions:** Avoid using non-null assertions (`!`) or type assertions (`as Type`) where TypeScript is already capable of narrowing types (e.g., after early returns or runtime null checks). Prefer explicit control-flow checks (`if (!x) return;`).
  - **Casing for Constants:** Use `CONSTANT_CASE` for deeply immutable exported constants. Use `camelCase` for local variables and mutable/non-deeply-immutable exported constants.

### 3. Verification & Testing

- Before committing any changes, AI assistants **MUST** execute `pnpm run ci` to verify that all code compiles, linting succeeds, formatting rules pass, CSS selector uniqueness passes, and unit tests pass. Use `pnpm fix` to resolve linting or formatting violations automatically.
- Refer to `package.json` or `README.md` for standard local development commands (e.g., `hugo server`, `pnpm run dev`, `hugo --minify`).
