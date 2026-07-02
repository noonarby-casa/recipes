# 🍳 Noonarby Casa Recipes

This is a **Hugo-based static website** dedicated to displaying recipes for the **Noonarby Casa**. It features a custom recipe-focused Hugo theme named `cookpot` and is deployed to **Firebase Hosting**.

- **Live Production Website:** [recipes.noonarby.casa](https://recipes.noonarby.casa/)

---

## 🛠️ Technology Stack & Architecture

- **Static Site Generator:** [Hugo (Extended)](https://gohugo.io/)
- **Theme:** `cookpot` (a custom theme tailored for recipe rendering, timers, and scaling)
- **Scripting Language:** [TypeScript](https://www.typescriptlang.org/) (transpiled natively by Hugo's built-in ESBuild pipeline)
- **Web APIs:** Native browser Screen Wake Lock and Local Storage APIs for persistent options, theme choice, and screen wake control.
- **Theme-wide Dark Mode:** Integrated CSS variable styling under `html.dark-mode` with localStorage persistence and native system preference matching.
- **Package Manager:** [pnpm](https://pnpm.io/) (for managing development tools like TypeScript linting/checking)
- **Code Linters & Formatters:** [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) (configured to enforce Google TypeScript Style Guide compliance)
- **Hosting:** Firebase Hosting (Project ID: `noonarby-casa-recipes`)
- **CI/CD:** GitHub Actions for automated pull request previews and production deployment.

For a detailed map of the codebase directory structure and layouts, please refer to [AGENTS.md](AGENTS.md).

---

## 🚀 Local Development

### Prerequisites

You must have the following tools installed on your machine:

1. **Hugo Extended** (Ensure the output of `hugo version` contains `extended`. The extended version is required to compile modular CSS/JS and assets handled by the theme.)
2. **Node.js** and **pnpm** (used for TypeScript static type-checking).

Run the following command at the root to initialize package dependencies:

```bash
pnpm install
```

### Commands

| Command                                         | Action                                                                                                 |
| :---------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| `hugo server`                                   | Starts a local development server at `http://localhost:1313/recipes/` with live reloading.             |
| `hugo --minify`                                 | Compiles the site into the `public/` directory, minifying assets to verify production build viability. |
| `hugo serve --renderToDisk --disableFastRender` | Renders the production-ready site to the `public/` directory and serves it locally.                    |
| `pnpm typecheck`                                | Runs the TypeScript compiler (`tsc`) with the `--noEmit` flag to perform static checks on all scripts. |
| `pnpm lint`                                     | Runs ESLint to check for code style issues and static analysis warnings/errors.                        |
| `pnpm format`                                   | Formats all code files using Prettier to maintain project styling guidelines.                          |

---

## ✍️ Recipe Content Authoring

All recipe articles are stored under [content/](content/) as Hugo **leaf bundles** (a folder named with the recipe's slug containing an `index.md` and optional media assets).

### 1. Creating a New Recipe

To generate a new recipe using the default archetype template, run:

```bash
hugo new content content/<recipe-slug>/index.md
```

After authoring, always check that the site builds successfully and that formatting is clean:

```bash
pnpm format
hugo
```

### 2. Front Matter Schema

The recipe's `index.md` file must contain front matter configured using TOML. The `shortId` must be a unique 3-4 character code; the build pipeline (specifically `index.json`) will throw a build error and halt if it detects a missing or duplicate `shortId`.

You can structure ingredients either as a flat list or grouped by category:

**Option A: Flat list of ingredients**

```toml
+++
title = 'Recipe Title'
date = YYYY-MM-DDTHH:MM:SS-TZ
slug = 'url-safe-slug'
shortId = 'unique-short-code'
servings = 4
times = [
  { step = 'prep', time = 'Duration (e.g., "10 min")' },
  { step = 'cook', time = 'Duration (e.g., "20 min")' }
]
ingredients = [
  "Quantity unit ingredient (e.g., '16 ounces potato gnocchi')",
  "Ingredient item 2",
  "..."
]
tags = [
  "Tag1",
  "Tag2"
]
+++
```

**Option B: Category-grouped ingredients**

```toml
+++
title = 'Recipe Title'
date = YYYY-MM-DDTHH:MM:SS-TZ
slug = 'url-safe-slug'
shortId = 'unique-short-code'
servings = 4
times = [
  { step = 'prep', time = 'Duration (e.g., "10 min")' },
  { step = 'cook', time = 'Duration (e.g., "20 min")' }
]
ingredients = [
  { category = "Main Section", items = [
    "Quantity unit ingredient",
    "..."
  ] },
  { category = "Second Section", items = [
    "Quantity unit ingredient",
    "..."
  ] }
]
tags = [
  "Tag1",
  "Tag2"
]
+++
```

### 3. Step Quantities & Unit Scaling

Inside the `## Instructions` section, wrap any ingredient quantities in step descriptions with the `{{< qty "amount unit" >}}` shortcode to enable interactive scaling:

- **Supported Units:** The scaling engine in [scaler.ts](themes/cookpot/assets/js/scaler.ts) parses units dynamically imported from [config.ts](themes/cookpot/assets/js/shopping-list/config.ts). Supported units and standard abbreviations include: `ounces` (`ounces`, `ounce`, `oz`), `pounds` (`pounds`, `pound`, `lb`, `lbs`), `cups` (`cups`, `cup`), `teaspoons` (`teaspoons`, `teaspoon`, `tsp`), `tablespoons` (`tablespoons`, `tablespoon`, `tbsp`), `cloves` (`cloves`, `clove`), `cans` (`cans`, `can`), `grams` (`grams`, `gram`, `g`), `ml`, `small`, `large`, `medium`, `heads` (`heads`, `head`), and `bulbs` (`bulbs`, `bulb`).
- **Usage Rules:**
  - **Supported units:** Wrap both the amount and unit inside the shortcode.
    - Example: `{{< qty "16 ounces" >}}` or `{{< qty "1/2 pound" >}}`.
  - **Unsupported units** (e.g., `lemon`, `onion`, `squash`): Wrap _only_ the numeric amount, leaving the unit outside.
    - Example: `{{< qty "1" >}} lemon` or `{{< qty "4" >}} summer squash`.
  - **Avoid ranges:** The parser matches the first numeric quantity. For ranges, write:
    - Example: `{{< qty "2 tablespoons" >}} (or up to 3)`.

### 4. Interactive Timers

Wrap time durations or ranges inside step descriptions with the `{{< timer "duration" >}}` shortcode. This generates an interactive client-side countdown timer:

- Example: `Cook for {{< timer "5-7 minutes" >}}.`
- Example: `Simmer for {{< timer "10 minutes" >}}.`

---

## 🛒 Shopping List Feature

The recipe details view includes a **Shopping List** view. Users can toggle between the standard recipe presentation and a dynamically compiled list of items grouped for commercial grocery purchases.

### Dynamic Packing & Conversion Engine

The shopping list logic in [shopping-list.ts](themes/cookpot/assets/js/shopping-list.ts) processes raw ingredients and scales them using a series of specialized converter pipelines:

- **Garlic:** Converts individual cloves to whole heads (assumes ~10 cloves/head).
- **Ginger:** Suggests buying a whole root while displaying the exact required amount.
- **Lemons & Limes:** Compares juice and zest volumes to recommend the precise quantity of whole citrus fruits.
- **Butter:** Standardizes cups, tablespoons, or ounces into commercial sticks (1 stick = 1/2 cup) with conversions.
- **Onions:** Converts recipe cup measurements to whole onion counts (1 onion = ~1 cup).
- **Dairy & Liquids:** Translates cups of ricotta or sour cream to standard half-pints, pints, or quarts. Broths, milks, and heavy creams are grouped to minimum pints or quarts.
- **Dry Pasta:** Groups pasta weights into standard boxes (1 lb or 454g).
- **Egg Yolks:** Recommends purchasing whole eggs based on yolk count.
- **Pantry Staples Section:** Items like oil, vinegar, spices, water, and baking goods (including small quantities of butter) are isolated into a separate "Pantry Staples" subsection.
- **Note Aggregation & Abbreviations:** Groups duplicated ingredients, adds up notes to the smallest units, and prints concise instructions (abbreviating `tablespoons` to `tbsp`, `ounces` to `oz`, etc.).
- **Clipboard copy:** Features a copy button that outputs a clean, Markdown-formatted checklist to easily paste into shopping apps.
- **Meal Planner Integration:** The combined shopping list tab compiles scaled ingredients from all scheduled days in the calendar, aggregates duplicates, converts packing sizes, and outputs a single checklist for the entire week's grocery run.

---

## 📅 Interactive Meal Planner

The site features a full-featured weekly calendar-based planner accessible at `/plan/`. It allows users to design weekly dinner schedules and organize groceries:

- **Weekly Calendar Grid:** Schedule recipes on a Sunday-to-Saturday layout. A fast toggle switches between a full **7-Day Week** and a **5-Day Work Week** (Monday-Friday) view.
- **Adding Recipes:** Assign recipes to days via a Search Overlay Modal or drag-and-drop mechanics. Includes a **Drag-to-Delete Trash Zone** at the bottom of the grid.
- **Global Servings Adjuster:** Adjust portion sizes globally, automatically scaling all scheduled recipe ingredients across the entire plan.
- **Category Balance Analytics:** Displays tag-based menu metrics (e.g. counts for pasta, chicken, soup, vegetarian) to help visualizers balance their protein and starch choices.
- **URL Plan Sharing:** The entire weekly plan serializes automatically into URL query parameters.
- **Compare/Draft Banner (Option C):** Opening a shared plan URL shows a top resolution banner allowing users to compare the shared menu with their local draft. Users can toggle views and choose to "Load Shared Plan", "Keep My Draft", or "Merge Both".
- **Contextual "Back to Plan" Flow:** Individual recipe pages detect if they were visited from the planner (via `?from=plan`) and overlay a floating button to easily return the user back to the View UX at `/plan/?view=1`.

---

## ⏱️ Screen Wake Lock & Cooking Timers

The client-side timer engine has been enhanced to support hands-free, accurate cooking:

- **Screen Wake Lock Integration:** Requests a native screen wake lock (`navigator.wakeLock`) when active countdown timers are running, ensuring the device screen does not dim or sleep during prep.
- **Reference Count Control:** Automatically obtains the lock when the first timer begins (`activeTimersCount` goes to 1) and releases it only when all countdowns are paused or completed.
- **Tab Visibility Recovery:** Listens to browser page visibility changes to re-acquire the wake lock if the tab is minimized and brought back to the foreground.
- **Timer Drift Correction:** Computes elapsed time using timestamp deltas (`Date.now() - startTime`) instead of count-based intervals, maintaining accuracy even if the browser pauses the script in background tabs.
- **Acoustic Warning & Alarms:** Plays an ascending major triad warning chime at the lower bounds, and a loud, crescendo-volume swing pattern jingle repeating 4 times (~5s) for final upper-bound alarms.
- **Isolated Test Bed:** A private playground page is available at `/timers/` to test single/range countdowns, wake lock counting, decimal parsing, and sound patterns in isolation.

---

## 🚀 Deployment

Deployment is fully automated through **GitHub Actions** and connected to the GitHub repository:

- **Pull Request Preview:** Every PR automatically compiles using `hugo --minify` and deploys a preview version of the site to a Firebase Hosting preview channel.
- **Production Release:** Merges or direct pushes to the `main` branch trigger a production build and deploy immediately to [recipes.noonarby.casa](https://recipes.noonarby.casa/).
