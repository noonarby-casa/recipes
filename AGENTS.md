# AGENTS.md - Noonarby Casa Recipes

<!--
This is the AGENTS.md project rule file. It provides high-level context, environment instructions,
and technical guardrails for agentic coding assistants. Keep this file up-to-date.
-->

## 📖 Project Overview

This is a **Hugo-based static website** for displaying recipes for the **Noonarby Casa**. It uses the recipe-focused Hugo theme `cookpot` and is deployed to **Firebase Hosting**.

- **Live Production URL:** [recipes.noonarby.casa](https://recipes.noonarby.casa/)
- **Primary Author:** Nicholas Noonarby
- **Content Path:** Recipe markdown files are placed under `content/` as Hugo leaf bundles.
- **Primary Stack:** Hugo (Extended), Version Control: Jujutsu (jj), Scripting: TypeScript, Styling: Vanilla CSS.

---

## 🎨 Design System & Styling Guidelines

The project uses a pure **Vanilla CSS** modular design system located under [assets/css/](themes/cookpot/assets/css/).

### Breakpoints & Cooking Mode

- **Standard Tablet/Desktop Portrait (min-width: 768px):** The `.recipe-container` uses a `1fr 2fr` split grid (ingredients on left, instructions on right) with standard page scrolling.
- **Landscape Cooking Dashboard (min-width: 768px in landscape or 1024px desktop):** Page locks into a **Viewport-Locked Cooking Dashboard** (`100vh` height):
  - No outer page scrolling.
  - Ingredients column (`1fr`) and instructions column (`1.6fr`) scroll independently.
  - The recipe title bar (`.recipe-title-bar`) and scaling panel (`.recipe-scale-panel`) sit side-by-side.

### Core styling variables & theme

- Primary color variables are defined in [variables.css](themes/cookpot/assets/css/variables.css) (`--noonblue`, `--noonblue-hover`, etc.).
- Prevent layout shift with `scrollbar-gutter: stable` on `html` in [global.css](themes/cookpot/assets/css/global.css).
- Theme-wide dark mode applies `.dark-mode` to `<html>` via inline script in [head.html](themes/cookpot/layouts/_partials/head.html) and toggle button in [darkmode.ts](themes/cookpot/assets/js/darkmode.ts).

---

## ⌨️ Implementation & Major Features

The project uses pure **Typescript** located under [assets/js](themes/cookpot/assets/js/).

### Timers & Audio

Cooking timers are implemented in [timers.ts](themes/cookpot/assets/js/timers.ts). When a timer expires, it plays a sound implemented in [audio.ts](themes/cookpot/assets/js/audio.ts).

Timers can either specify a range or a single time. Separate sounds are played for the lower and upper bounds of a range timer. For a single timer, only the upper bound is played.

### Parsing Ingredients & Scaling

Ingredients get automatically parsed for scaling in [scaler.ts](themes/cookpot/assets/js/scaler.ts). UI controls on the recipe page allow a recipe to be scaled.

### Shopping List

Code to automatically convert a list of parsed ingredients into a shopping list is implemented in [shopping-list.ts](themes/cookpot/assets/js/shopping-list.ts), with supporting logic in the [shopping-list](themes/cookpot/assets/js/shopping-list/) folder.

All of the conversions are defined by configuration rules in [rules.ts](themes/cookpot/assets/js/shopping-list/rules.ts).

### Meal Planning

A meal planning feature is implemented in [meal-plan.ts](themes/cookpot/assets/js/meal-plan.ts). It handles selecting several recipes and generates a combined shopping list.

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

- Before committing any changes, AI assistants **MUST** execute `pnpm ci` to verify that all code compiles, linting succeeds, and formatting rules are met. Use `pnpm fix` to resolve linting or formatting violations automatically.
- Refer to `package.json` or `README.md` for standard local development commands (e.g., `hugo server`, `hugo --minify`).
