# AGENTS.md - Noonarby Casa Recipes

<!--
This is the AGENTS.md project rule file. It provides high-level context, environment instructions,
and technical guardrails for agent-powered agentic coding assistants (like Antigravity).
Keep this file up-to-date to enable highly accurate pair programming.
-->

## 📖 Project Overview

This is a **Hugo-based static website** dedicated to displaying recipes for the **Noonarby Casa**. It uses a custom recipe-focused Hugo theme named `cookpot` and is deployed to **Firebase Hosting**.

- **Live Production URL:** [recipes.noonarby.casa](https://recipes.noonarby.casa/)
- **Primary Author:** Nicholas Noonarby
- **Content Path:** Recipe markdown files are placed under the `content/` directory as Hugo leaf bundles.

---

## 🛠️ Technology Stack & Environment

A quick reference of the core technologies, libraries, and hosting parameters powering the site.

| Layer               | Technology                                       | Version / Details                                   | Purpose                                                           |
| :------------------ | :----------------------------------------------- | :-------------------------------------------------- | :---------------------------------------------------------------- |
| **Framework**       | [Hugo (Extended)](https://gohugo.io/)            | `latest` / Extended version required                | Static Site Generator (SSG)                                       |
| **Version Control** | [Jujutsu (jj)](https://github.com/martinvonz/jj) | Git-compatible                                      | Primary VCS; tracks changes automatically in working copy (`@`)   |
| **Scripting**       | [TypeScript](https://www.typescriptlang.org/)    | Type-annotated modules, compiled using Hugo ESBuild | Frontend business logic and DOM interactions                      |
| **Web APIs**        | Screen Wake Lock & Local Storage                 | Native Browser APIs                                 | Keeping screen active during timers, persisting themes/plans      |
| **Package Manager** | [pnpm](https://pnpm.io/)                         | Managed via `package.json`                          | Running local static type-checking (`pnpm typecheck`)             |
| **Styling**         | Vanilla CSS                                      | Modular files in `themes/cookpot/assets/css/`       | Minimal, responsive layout, bundled dynamically using Hugo Concat |
| **Hosting**         | Firebase Hosting                                 | Project ID: `noonarby-casa-recipes`                 | Static hosting and SSL management                                 |
| **CI/CD**           | GitHub Actions                                   | Merge on `main` & PR previews                       | Automated building & cloud deployment                             |

---

## 📂 Codebase Architecture & Directory Map

A tree-map of the project directories to help locate layouts, stylesheets, and pages quickly.

```text
├── .github/workflows/                    # CI/CD workflows
│   ├── firebase-hosting-merge.yml        # Deploy to production on merge to main
│   └── firebase-hosting-pull-request.yml # Deploy to Firebase preview channel on PR
├── archetypes/
│   └── default.md                        # Default Hugo archetype template for new content
├── assets/
│   └── tsconfig.json                     # TypeScript compiler path mapping configuration
├── content/                              # Site content (markdown pages)
│   ├── _index.md                         # Homepage content ("Here you will find recipes...")
│   ├── chorizo-roasted-red-pepper-spinach-gnocchi/
│   │   └── index.md                      # Example recipe leaf bundle
│   ├── plan/
│   │   └── index.md                      # Meal planner landing page leaf bundle
│   └── timers/
│       └── index.md                      # Private timers/alarm test bed page leaf bundle
├── themes/
│   └── cookpot/                          # Custom recipe theme folder
│       ├── assets/
│       │   ├── css/                      # Modular style sheets
│       │   │   ├── variables.css         # Theme-wide design variables/colors
│       │   │   ├── global.css            # Base resets and element rules
│       │   │   ├── recipe-list.css       # Recipe card/listing styles
│       │   │   ├── recipe-single.css     # Recipe single details and landscape layouts
│       │   │   ├── timers.css            # Pulse timers style rules
│       │   │   ├── meal-plan.css         # Calendar UI and planner styling
│       │   │   └── shopping-list.css     # Checkout-style shopping list styles
│       │   └── js/                       # Modular TypeScript (bundled by Hugo esbuild)
│       │       ├── main.ts               # Entry point and initializer
│       │       ├── constants.ts          # Global shared maps and constants
│       │       ├── audio.ts              # Sound alarms logic
│       │       ├── scaler.ts             # Scaling calculation logic
│       │       ├── timers.ts             # Countdowns logic & wake lock requests
│       │       ├── fontsize.ts           # Custom instructions text-scaler logic
│       │       ├── search.ts             # Lazy-loaded recipe search logic
│       │       ├── random.ts             # Client-side random recipe selector logic
│       │       ├── darkmode.ts           # Client theme switching controls
│       │       ├── meal-plan.ts          # Meal planner logic, drag-and-drop, and conflict resolution
│       │       ├── units.ts              # Ingredient quantity parser & fraction standardizer
│       │       └── shopping-list/        # Shopping list logic core modules
│       │           ├── config.ts         # Cooking units and pantry staples catalog
│       │           ├── converters.ts     # Registry of custom packaging strategy converters
│       │           ├── pipeline.ts       # Raw ingredient aggregation & processing pipeline
│       │           ├── rules.ts          # Declarative ingredient grouping & staple rules config
│       │           ├── types.ts          # TypeScript type definitions for the shopping list pipeline
│       │           └── utils.ts          # Normalization and string parsers helpers
│       ├── layouts/
│       │   ├── _partials/                # Sub-templates directory
│       │   │   ├── head/                 # Scripts and style bundlers
│       │   │   │   ├── css.html          # Bundled stylesheet inline loader
│       │   │   │   └── js.html           # ESBuild script bundler and injection loader
│       │   │   ├── head.html                 # Page metadata layout shell (with dark mode inline script)
│       │   │   ├── header.html               # Site title banner and navigation layout
│       │   │   ├── footer.html               # Site copyright and footer links layout
│       │   │   ├── menu.html                 # Navigation menu structure
│       │   │   ├── terms.html                # Taxonomies terms layout template
│       │   │   ├── pagination.html           # Pagination buttons structure
│       │   │   ├── recipe-list-item.html     # Recipe card layout in lists
│       │   │   └── search.html               # Search input area structure
│       │   ├── baseof.html               # Main boilerplate layout shell
│       │   ├── home.html                 # Homepage layout template
│       │   ├── index.json                # JSON recipe search index template
│       │   ├── list.html                 # List/taxonomies layout template
│       │   ├── single.html               # Recipe detail layout (grid of Ingredients / Instructions)
│       │   ├── plan.html                 # Edit/View planner layout
│       │   └── timers.html               # Countdowns test suite layout
│       └── theme.toml                    # Theme metadata and taxonomies config
├── .firebaserc                           # Firebase project configuration mapping
├── firebase.json                         # Firebase hosting redirect and ignore rules
├── hugo.toml                             # Global Hugo configuration (baseURL, theme='cookpot', etc.)
├── package.json                          # PNPM project scripts and compiler tools dependencies
└── pnpm-lock.yaml                        # Locked dependency graph for deterministic installs
```

---

## 🔀 Version Control with Jujutsu (jj)

This project uses **Jujutsu (jj)** for version control. It does not use standard Git commands directly (there is no active `.git` directory in the workspace). Guidelines and commands are documented in the global `jj` skill.

---

## 🎨 Design System & Styling Guidelines

> [!NOTE]
> **Active Design Pattern:** The project uses a pure **Vanilla CSS** modular design system located under `themes/cookpot/assets/css/` (`variables.css`, `global.css`, `recipe-list.css`, `recipe-single.css`, `timers.css`). These are dynamically bundled on build by Hugo Pipes and inlined directly in the document `<head>` to avoid critical request chains and render-blocking HTTP requests. It features clean sans-serif typography, a minimal black/grey/white color scheme, and a grid-based responsive layout for recipe pages.

### Responsive Breakpoints & Cooking Mode

- **Mobile-First Layout:** The single recipe view displays ingredients and instructions in a stacked, vertically flowing layout by default.
- **Standard Tablet/Desktop Portrait:** At `min-width: 768px` in portrait mode, the `.recipe-container` uses a `1fr 2fr` grid template to split ingredients (left) and instructions (right) into side-by-side columns while allowing standard page scrolling.
- **Horizontal Tablet & Landscape Cooking Dashboard:** At `min-width: 768px` in landscape orientation (or `min-width: 1024px` general desktop), the page locks into a **Viewport-Locked Cooking Dashboard** (`100vh` height):
  - **Single Screen Constraint:** The outer body frame matches the viewport height, preventing outer page scrolling.
  - **Compact Horizontal Top Bar:** The recipe title bar (`.recipe-title-bar`) and scaling panel (`.recipe-scale-panel`) sit side-by-side in a streamlined row layout to maximize vertical space.
  - **Independent Scroll Columns:** The ingredients column (`1fr`) and instructions column (`1.6fr`) scroll vertically independently of each other. Thin, premium custom scrollbars are styled for touch screens, keeping key content immediately in view.
  - **Integrated Metadata:** Date and tags are placed elegantly at the bottom of the grid.

### Style Overrides & Core Variables

- Modify styles within their respective module files (e.g., [timers.css](themes/cookpot/assets/css/timers.css) for interactive countdowns, [recipe-single.css](themes/cookpot/assets/css/recipe-single.css) for single page layout details).
- Use the primary color system defined in [variables.css](themes/cookpot/assets/css/variables.css):
  - `--noonblue` (`#0080D8`)
  - `--noonblue-hover` (`#006cb7`)
  - `--noonblue-light` (`#3fb0ff`)
- **Preventing Layout Shifts:** The `html` element uses `scrollbar-gutter: stable` to ensure a consistent page width and eliminate content shifting as users navigate between shorter/longer pages (defined in [global.css](themes/cookpot/assets/css/global.css)).
- **Inline Metadata Display:** To optimize vertical spacing on small and large screens, metadata elements (date, times, source) on recipe list items are displayed in a single horizontal row using CSS flexbox rules in [recipe-list.css](themes/cookpot/assets/css/recipe-list.css).

### Theme-wide Dark Mode

The project implements a selective dark mode utilizing CSS variables scoped under `html.dark-mode` in [variables.css](themes/cookpot/assets/css/variables.css).

- **FOUC Prevention:** To prevent flash of unstyled content, an inline blocking script in the document `<head>` (defined in [head.html](themes/cookpot/layouts/_partials/head.html)) queries `localStorage` for `"theme"` and checks the user's system preferences (`prefers-color-scheme: dark`) before the browser renders the layout. If preferred, it immediately applies the `.dark-mode` class to the root `<html>` element.
- **Client controls:** A theme toggle button resides in the header (bound by `initDarkMode` in [darkmode.ts](themes/cookpot/assets/js/darkmode.ts)), swapping the `dark-mode` class on the `<html>` root and saving the state dynamically.

---

## ✍️ Recipe Content Structure & Schema

> [!WARNING]
> **No Featured Image Creation:** When adding or creating a new recipe, a `featured-image` file (e.g. `featured-image.jpg`, `featured-image.png`, `featured-image.webp`) **should NOT** be created by the AI assistant. These will be added via a different process.

All recipe articles are created as Hugo leaf bundles (a folder containing an `index.md` file). They must strict-match the following schema definition.

### Recipe Front Matter Schema

The recipe's `index.md` file must contain front matter configured using TOML.

**Option A: Flat list of ingredients**

```toml
+++
title = 'Descriptive Title'
date = YYYY-MM-DDTHH:MM:SS-TZ
slug = 'url-safe-slug'
shortId = 'unique-short-code'
servings = 4
times = [
  { step = 'prep', time = 'Prep time duration (e.g., "10 min")' },
  { step = 'cook', time = 'Cook time duration (e.g., "20 min")' }
]
recipeSource = 'Recipe source/author (e.g., "Rickarbys")'
ingredients = [
  "Quantity unit ingredient name (e.g., '16 ounces potato gnocchi')",
  "Ingredient item 2",
  "..."
]
tags = [
  "tag1",
  "tag2"
]
+++
```

**Option B: Category-grouped ingredients**

```toml
+++
title = 'Descriptive Title'
date = YYYY-MM-DDTHH:MM:SS-TZ
slug = 'url-safe-slug'
shortId = 'unique-short-code'
servings = 4
times = [
  { step = 'prep', time = 'Prep time duration (e.g., "10 min")' },
  { step = 'cook', time = 'Cook time duration (e.g., "20 min")' }
]
recipeSource = 'Recipe source/author (e.g., "Rickarbys")'
ingredients = [
  { category = "Category A", items = [
    "Quantity unit ingredient name",
    "..."
  ] },
  { category = "Category B", items = [
    "Quantity unit ingredient name",
    "..."
  ] }
]
tags = [
  "tag1",
  "tag2"
]
+++
```

- **Title:** Capitalized like standard titles.
- **Slug:** URL-friendly lowercase string used to define the address.
- **ShortId:** Required string parameter containing a unique 3-4 character lowercase code (e.g., `'crg'`) for identifying the recipe dynamically in the search index and planner calendar. Note that `index.json` runs a build-time validation checking that every recipe has a unique `shortId`; if missing or duplicate, Hugo will throw an error and fail the build.
- **Servings:** Optional integer parameter specifying the default portion count (defaults to `4` if omitted), used for scaling calculations.
- **Times:** An array of maps specifying recipe timing steps (e.g., prep, cook). Each item requires a `step` name and a `time` duration string (e.g., `'10 min'`). These render inline, separated by `+` with a single clock SVG icon (e.g., `Prep 10 min + Cook 20 min`), across all content, layouts, list pages, and search index templates to minimize vertical space.
- **RecipeSource:** Optional string parameter specifying the recipe's origin (e.g., `'Rickarbys'`), defaulting to `'Noonarby'` if omitted. Renders under the header title on recipe detail views and in search results.
- **Ingredients:** A TOML list of strings (Option A) or list of maps containing `category` and `items` lists of strings (Option B).
- **Tags:** Optional string list for categorization (renders in recipe metadata).

### Instructions, Step Quantities & Timers

Instructions are placed directly in the body of the markdown file beneath a `## Instructions` header.

- **Scaling Quantities:** Wrap any ingredient quantities inside step descriptions with the `{{< qty "amount unit" >}}` shortcode.
  > [!IMPORTANT]
  > **Supported Units & Formatting Rules:**
  > The scaling engine in [scaler.ts](themes/cookpot/assets/js/scaler.ts) parses units dynamically imported from [config.ts](themes/cookpot/assets/js/shopping-list/config.ts). Supported units and standard abbreviations include: `ounces` (`ounces`, `ounce`, `oz`), `pounds` (`pounds`, `pound`, `lb`, `lbs`), `cups` (`cups`, `cup`), `teaspoons` (`teaspoons`, `teaspoon`, `tsp`), `tablespoons` (`tablespoons`, `tablespoon`, `tbsp`), `cloves` (`cloves`, `clove`), `cans` (`cans`, `can`), `grams` (`grams`, `gram`, `g`), `ml`, `small`, `large`, `medium`, `heads` (`heads`, `head`), and `bulbs` (`bulbs`, `bulb`).
  >
  > 1. **If the unit is supported:** Wrap both amount and unit in the shortcode. Example: `{{< qty "16 ounces" >}}` or `{{< qty "1/2 pound" >}}`.
  > 2. **If the unit is NOT supported** (e.g., `lemon`, `squash`, `onion`): Wrap _only_ the numeric amount in the shortcode, leaving the unit word outside. Example: `{{< qty "1" >}} lemon` or `{{< qty "4" >}} summer squash`. Wrapping unsupported unit names inside the shortcode will cause them to be discarded when scaling changes.
  > 3. **Avoid ranges inside the shortcode:** The parser matches the first numeric quantity in a string. For ranges (e.g., `2-3 tablespoons`), write `{{< qty "2 tablespoons" >}} (or up to 3)` or specify a single base quantity like `{{< qty "2 tablespoons" >}}` to prevent scaling output formatting bugs.
- **Timers:** Wrap any time durations or ranges inside step descriptions with the `{{< timer "duration" >}}` shortcode (e.g. `{{< timer "5-7 minutes" >}}` or `{{< timer "10 minutes" >}}`). This renders an interactive, color-coded client-side countdown timer powered by CSS-toggled SVG icons for play, pause, and reset functions (styled in [timers.css](themes/cookpot/assets/css/timers.css) and driven by [timers.ts](themes/cookpot/assets/js/timers.ts)).

Example Markdown Body:

```markdown
## Instructions

1. Step 1 description with quantity: Add gnocchi ({{< qty "16 ounces" >}}).
2. Step 2 description: Brown chorizo ({{< qty "1/2 pound" >}}).
3. Step 3 description with timer: Cook for {{< timer "5-7 minutes" >}}.
4. Keep instructions clear, ordered, and formatted as a numbered list.
```

---

## 🔍 Recipe Search, Navigation & Tags

The project includes custom built-in search, pagination, dynamic tag cloud, and random recipe routing features to improve navigation and accessibility.

### 1. Recipe Search Engine

The site features a client-side search engine for filtering recipes dynamically.

- **Search Index Generation:** Hugo generates a search index at `index.json` (using the template at [index.json](themes/cookpot/layouts/index.json)) compiled from all pages. This index contains all recipe metadata (including `title`, `permalink`, `date`, `times`, `recipeSource`, `tags`, `ingredients`, `summary`, and responsive image WebP crops).
- **Lazy Loading Data:** The search module in [search.ts](themes/cookpot/assets/js/search.ts) lazily fetches `index.json` only when the user hovers over or focuses on the search input box.
- **Client-Side Filtering:** Searching matches search queries case-insensitively against titles, tags, ingredients, and summaries.
- **Header Toggle:** Clicking the global search icon in the header dynamically scrolls to and focuses the search input.

### 2. Pagination

Recipe lists (on the homepage and category/tag list pages) are paginated to prevent performance issues.

- **Configuration:** Pager size is set via `pagerSize = 10` inside [hugo.toml](hugo.toml).
- **Markup & Partial:** Handled in [pagination.html](themes/cookpot/layouts/_partials/pagination.html) and styled inside [recipe-list.css](themes/cookpot/assets/css/recipe-list.css).
- **Template Integration:** Paginated lists in [home.html](themes/cookpot/layouts/home.html) and [list.html](themes/cookpot/layouts/list.html) iterate over the page items using `.Paginate` and render the pagination navigation buttons at the bottom.

### 3. Random Recipe Selector

A client-side random recipe selector is integrated into the site header to encourage user discovery.

- **Markup & Entry Point:** A button with a crossing shuffle arrows SVG icon is rendered in [header.html](themes/cookpot/layouts/_partials/header.html). It embeds all regular page permalinks serialized as a JSON string under the `data-recipes` attribute.
- **Routing Logic:** The script in [random.ts](themes/cookpot/assets/js/random.ts) handles click events, parses the JSON array, filters out the currently viewed recipe page (if there are multiple recipes), picks a random path, and redirects the user.

### 4. Homepage Tag Cloud & Categorization

An alphabetized tag cloud is displayed on the homepage beneath the search bar, allowing users to browse recipes by category.

- **Listing & Count:** Rendered using `site.Taxonomies.tags.Alphabetical` inside [home.html](themes/cookpot/layouts/home.html) to display each tag alongside its recipe count.
- **Layout & Style:** Styled using hoverable pills that shift and highlight on focus/hover (defined in [recipe-list.css](themes/cookpot/assets/css/recipe-list.css)).

### 5. Shopping List Feature

A custom client-side shopping list toggle aggregates scaled ingredients, converts them to commercial packaging formats, and isolates staples:

- **Orchestrator:** [shopping-list.ts](themes/cookpot/assets/js/shopping-list.ts) toggles view tabs and handles UI rendering.
- **Conversion Rules Registry:** [converters.ts](themes/cookpot/assets/js/shopping-list/converters.ts) contains rules matching specific ingredients (e.g. converting 10 garlic cloves to 1 head, volume butter to sticks, weight dry pasta to boxes, egg yolks to whole eggs).
- **Aggregating Pipeline:** [pipeline.ts](themes/cookpot/assets/js/shopping-list/pipeline.ts) combines quantities, merges note segments, groups duplicated ingredients, and splits outputs into target Buy/Staples lists.
- **Pantry Staples Filtering:** Common spices, oils, small butter portions (<4 sticks), and water are dynamically filtered into a separate collapsible staples list.
- **Clean & Copy:** Cleaned of prep words (chopped, minced) and features standard abbreviation logic. A button copies the entire checklist as markdown to clipboard.
- **Meal Plan Integration:** The meal planner's View UX incorporates a combined shopping list tab. It aggregates ingredients across all days/recipes in the schedule, scales them by the globally selected portions, and runs them through the pipeline to output a single consolidated checklist. It allows omitting completed items from clipboard output and checking/unchecking items.

### 6. Interactive Meal Planner

Accessible at `/plan/` (using [plan.html](themes/cookpot/layouts/plan.html) layout and [plan/index.md](content/plan/index.md) content), styled in [meal-plan.css](themes/cookpot/assets/css/meal-plan.css) and driven by [meal-plan.ts](themes/cookpot/assets/js/meal-plan.ts), the weekly calendar-based planner aggregates recipes and scales portions:

- **Interactive Calendar Assignments:** Allows users to schedule recipes to specific days of the week (Sunday through Saturday). Offers a quick toggle between a full **7-Day Week** and a **5-Day Work Week** layout.
- **Recipe Adding UX:** Includes a Search Overlay Modal for searching and selecting recipes to schedule, alongside drag-and-drop mechanics to assign recipes to days. Includes a **Drag-to-Delete Trash Zone** that reveals itself only when an item is dragged.
- **Servings Scaler:** Global portions controls scale all planned recipes by standard portion ratios.
- **Plan Category Balance Stats:** Displays real-time category/tag balance distributions (like pasta, chicken, soup) for recipes currently in the plan, aiding in menu planning.
- **Undo / Recovery:** Incorporates a toast notification for undoing deleted plans or recipe removals.
- **Shared Plans & Conflict Resolution:** Serializes the scheduled state to URL query parameters for sharing. Opening a shared plan displays a **Compare-Draft Conflict Resolution Banner** (Option C), allowing users to compare the shared layout with their local draft, keep their local draft, load the shared plan, or merge both.

### 7. Screen Wake Lock & Drifting Mitigation

To support distraction-free cooking, the timer engine in [timers.ts](themes/cookpot/assets/js/timers.ts) incorporates modern browser power-management and precise delta checking:

- **Screen Wake Lock API:** Automatically requests a wake lock (`navigator.wakeLock.request("screen")`) when cooking timers are started. It keeps the device screen active to prevent dimming or sleeping.
- **Reference Counting:** The lock is requested when `activeTimersCount` increases to 1, and released when all running timers are paused or reset (`activeTimersCount === 0`).
- **Visibility Re-acquisition:** Listens for `visibilitychange` events to automatically re-request the wake lock when the page returns to the foreground.
- **Timer Drift Prevention:** Computes elapsed time using timestamp deltas (`Date.now() - startTime`) rather than depending on strict `setInterval` counts, ensuring countdown accuracy when the browser tab goes into background sleep mode.
- **Audio Alarm Enhancements:** Sound alerts (written in [audio.ts](themes/cookpot/assets/js/audio.ts)) include a bright ascending major triad pattern played twice for lower-bound warnings, and a double-volume crescendo swing pattern repeating 4 times (~5 seconds) for upper-bound alerts.

### 8. Private Timer Test Suite

A private, dedicated page at `/timers/` (using [timers.html](themes/cookpot/layouts/timers.html) layout and [timers/index.md](content/timers/index.md) content) serves as an isolated playground to verify:

- Single-value countdowns and warnings.
- Decimal parser formats and shorthands (e.g. `10s`, `10 sec`, `0.1 minutes`).
- Multi-timer Wake Lock reference counting (running multiple timers and checking release conditions).
- Alarm chimes and visual countdown color states.

### 9. Contextual "Back to Meal Plan" Navigation

When a user visits a recipe page directly from the Meal Planner view, the app appends `?from=plan` to the URL. The script [meal-plan.ts](themes/cookpot/assets/js/meal-plan.ts) detects this query parameter and dynamically appends a fixed/floating "Back to Meal Plan" button in the viewport, which safely redirects back to `/plan/?view=1`.

---

## 🚀 Local Development & Commands

Ensure you have [Hugo](https://gohugo.io/) (Extended edition) and **Node.js/pnpm** installed locally.

First install compilation dependencies:

```bash
pnpm install
```

### Command Reference

| Action                         | Command                                           | Purpose                                                                                         |
| :----------------------------- | :------------------------------------------------ | :---------------------------------------------------------------------------------------------- |
| **Run Dev Server**             | `hugo server`                                     | Starts local development server on `http://localhost:1313/recipes/`                             |
| **Verify Production Build**    | `hugo --minify`                                   | Runs a production build to check for Hugo template or compilation issues                        |
| **Serve Rendered Disk Output** | `hugo serve --renderToDisk --disableFastRender`   | Renders fully compiled production-ready output to the `public/` directory and serves it         |
| **Create New Recipe**          | `hugo new content content/<recipe-slug>/index.md` | Generates a new recipe leaf bundle content file                                                 |
| **Type-Check TS Files**        | `pnpm typecheck`                                  | Runs `tsc --noEmit` locally using the configured `tsconfig.json` to verify zero compiler errors |

---

## 🔄 Deployment & CI/CD Pipelines

All deployments are managed automatically via GitHub Actions pipelines connected to the GitHub repository:

- **Production Deployment:** Runs automatically on every push/merge to the `main` branch.
  - **Workflow File:** [`.github/workflows/firebase-hosting-merge.yml`](.github/workflows/firebase-hosting-merge.yml)
  - **Steps:** Sets up Hugo (`latest`, extended edition), compiles using `hugo --minify`, and deploys directly to the `live` Firebase Hosting channel.
- **Pull Request Preview Deployment:** Runs automatically on every pull request.
  - **Workflow File:** [`.github/workflows/firebase-hosting-pull-request.yml`](.github/workflows/firebase-hosting-pull-request.yml)
  - **Steps:** Compiles and deploys a preview version of the site to a sandbox channel to test changes in isolation.

---

## 🤖 AI Assistant Workflows & Rules

Behavioral rules and workflow steps tailored for agentic AI coding assistants (like Antigravity) to maintain codebase cleanliness.

> [!TIP]
> **Minimal Disturbance:** Preserve all existing codebase comments, formatting, and file structures unless explicitly asked to modify them.

### 1. Research & Analysis

- Before creating any layout files, check the theme layouts directory at `themes/cookpot/layouts/` to see if partials or templates already exist.
- Verify the page parameters referenced by the layouts (e.g. `.Params.ingredients` in `single.html`) when suggesting updates to the schema.

### 2. Execution Guidelines

- **No Placeholders:** Never use mock images or placeholder text. Always generate high-fidelity assets or realistic mock data.
- **Semantic HTML:** Always use semantic elements (`<main>`, `<article>`, `<time>`, `<header>`, `<footer>`) to maximize accessibility and SEO.
- **VCS Commits:** Use `jj describe -m "description"` to log work descriptions when tasks are finished. Do not use git.

### 3. Verification & Testing

- Always execute the production build command locally to verify zero compiler warnings or errors before marking a task as complete.
- Verify responsiveness across standard layouts and check that markdown outputs render perfectly.

### 4. TypeScript Style Guide Compliance

- **No Redundant Type/Non-Null Assertions:** Avoid using non-null assertions (`!`) or unnecessary type assertions (`as Type`) where TypeScript is already capable of narrowing types (e.g., after early returns or runtime null checks). Prefer explicit control-flow checks (`if (!x) return;`) to narrow types instead of using non-null assertions.
- **Casing for Constants:**
  - Exported global/module-level constants that are deeply immutable must be named in `CONSTANT_CASE`.
  - Local/file-scoped variables (even if declared with `const` because they are not reassigned) and mutable/non-deeply-immutable exported constants (e.g., arrays that are populated dynamically via `.push()`) must be named in `camelCase`.
