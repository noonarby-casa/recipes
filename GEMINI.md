# GEMINI.md - Noonarby Casa Recipes

<!--
This is the GEMINI.md project rule file. It provides high-level context, environment instructions, 
and technical guardrails for Gemini-powered agentic coding assistants (like Antigravity). 
Keep this file up-to-date to enable highly accurate pair programming.
-->

## 📖 Project Overview

This is a **Hugo-based static website** dedicated to displaying recipes for the **Noonarby Casa**. It uses a custom recipe-focused Hugo theme named `cookpot` and is deployed to **Firebase Hosting**.

* **Live Production URL:** [recipes.noonarby.casa](https://recipes.noonarby.casa/)
* **Primary Author:** Nicholas Noonarby
* **Content Path:** Recipe markdown files are placed under the `content/` directory as Hugo leaf bundles.

---

## 🛠️ Technology Stack & Environment

A quick reference of the core technologies, libraries, and hosting parameters powering the site.

| Layer | Technology | Version / Details | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | [Hugo (Extended)](https://gohugo.io/) | `latest` / Extended version required | Static Site Generator (SSG) |
| **Styling** | Vanilla CSS | Defined in `themes/cookpot/assets/css/main.css` | Minimal, responsive layout |
| **Development** | [Tailwind CSS](https://tailwindcss.com/) | `^4.1.18` (in `package.json` devDependencies) | Available but currently not compiled/active |
| **Hosting** | Firebase Hosting | Project ID: `noonarby-casa-recipes` | Static hosting and SSL management |
| **CI/CD** | GitHub Actions | Merge on `main` & PR previews | Automated building & cloud deployment |

---

## 📂 Codebase Architecture & Directory Map

A tree-map of the project directories to help locate layouts, stylesheets, and pages quickly.

```text
├── .github/workflows/                    # CI/CD workflows
│   ├── firebase-hosting-merge.yml        # Deploy to production on merge to main
│   └── firebase-hosting-pull-request.yml # Deploy to Firebase preview channel on PR
├── archetypes/
│   └── default.md                        # Default Hugo archetype template for new content
├── content/                              # Site content (markdown pages)
│   ├── _index.md                         # Homepage content ("Here you will find recipes...")
│   └── chorizo-roasted-red-pepper-spinach-gnocchi/
│       └── index.md                      # Example recipe leaf bundle
├── themes/
│   └── cookpot/                          # Custom recipe theme folder
│       ├── assets/
│       │   ├── css/main.css              # Main site stylesheet (Vanilla CSS)
│       │   └── js/main.js                # Core JS file
│       ├── layouts/
│       │   ├── _partials/                # Sub-templates (head.html, menu.html, terms.html)
│       │   ├── baseof.html               # Main boilerplate layout shell
│       │   ├── home.html                 # Homepage layout template
│       │   ├── list.html                 # List/taxonomies layout template
│       │   └── single.html               # Recipe detail layout (grid of Ingredients / Instructions)
│       └── theme.toml                    # Theme metadata and taxonomies config
├── .firebaserc                           # Firebase project configuration mapping
├── firebase.json                         # Firebase hosting redirect and ignore rules
├── hugo.toml                             # Global Hugo configuration (baseURL, theme='cookpot', etc.)
└── package.json                          # Node dependencies for CSS processors (Tailwind v4)
```

---

## 🎨 Design System & Styling Guidelines

> [!NOTE]
> **Active Design Pattern:** The project currently uses a pure **Vanilla CSS** design system located in `themes/cookpot/assets/css/main.css`. It features clean sans-serif typography, a minimal black/grey/white color scheme, and a grid-based responsive layout for recipe pages.

### Responsive Breakpoints & Cooking Mode
* **Mobile-First Layout:** The single recipe view displays ingredients and instructions in a stacked, vertically flowing layout by default.
* **Standard Tablet/Desktop Portrait:** At `min-width: 768px` in portrait mode, the `.recipe-container` uses a `1fr 2fr` grid template to split ingredients (left) and instructions (right) into side-by-side columns while allowing standard page scrolling.
* **Horizontal Tablet & Landscape Cooking Dashboard:** At `min-width: 768px` in landscape orientation (or `min-width: 1024px` general desktop), the page locks into a **Viewport-Locked Cooking Dashboard** (`100vh` height):
  - **Single Screen Constraint:** The outer body frame matches the viewport height, preventing outer page scrolling.
  - **Compact Horizontal Top Bar:** The recipe title bar (`.recipe-title-bar`) and scaling panel (`.recipe-scale-panel`) sit side-by-side in a streamlined row layout to maximize vertical space.
  - **Independent Scroll Columns:** The ingredients column (`1fr`) and instructions column (`1.6fr`) scroll vertically independently of each other. Thin, premium custom scrollbars are styled for touch screens, keeping key content immediately in view.
  - **Integrated Metadata:** Date and tags are placed elegantly at the bottom of the grid.

### Style Overrides & Tailwind Transition
* The devDependencies include Tailwind CSS and `@tailwindcss/cli`. If Tailwind is activated in the future:
  1. Tailwind CSS commands must be set up to compile into `themes/cookpot/assets/css/main.css` or a compiled stylesheet directory.
  2. The custom partial `themes/cookpot/layouts/_partials/head/css.html` must correctly locate and reference the compiled asset.
* For now, make style modifications directly in `themes/cookpot/assets/css/main.css` to respect the existing layout styling.

---

## ✍️ Recipe Content Structure & Schema

All recipe articles are created as Hugo leaf bundles (a folder containing an `index.md` file). They must strict-match the following schema definition.

### Recipe Markdown Schema (`index.md`)

```toml
+++
title = 'Descriptive Title'
date = YYYY-MM-DDTHH:MM:SS-TZ
slug = 'url-safe-slug'
ingredients = [
  "Quantity unit ingredient name (e.g., '16 ounces potato gnocchi')",
  "Ingredient item 2",
  "..."
]
+++

## Instructions

1. Step 1 description with quantity: Add gnocchi ({{< qty "16 ounces" >}}).
2. Step 2 description: Brown chorizo ({{< qty "1/2 pound" >}}).
3. Keep instructions clear, ordered, and formatted as a numbered list.
```

* **Title:** Capitalized like standard titles.
* **Slug:** URL-friendly lowercase string used to define the address.
* **Ingredients:** A TOML list of strings. Each entry represents a single line containing quantity, unit, and item name.
* **Instructions & Step Quantities:** Placed directly in the body of the markdown file beneath a `## Instructions` header. Wrap any ingredient quantities inside step descriptions with the `{{< qty "amount unit" >}}` shortcode (e.g. `{{< qty "16 ounces" >}}` or `{{< qty "1/2 pound" >}}`). This registers them with the client-side JavaScript engine, enabling them to scale dynamically alongside the main ingredients list when users adjust the scaling slider.

---

## 🚀 Local Development & Commands

Ensure you have [Hugo](https://gohugo.io/) (Extended edition) installed locally on your machine.

### Command Reference

| Action | Command | Purpose |
| :--- | :--- | :--- |
| **Install Packages** | `npm install` | Restores Tailwind CLI and styling packages |
| **Run Dev Server** | `hugo server` | Starts local development server on `http://localhost:1313/recipes/` |
| **Verify Production Build** | `hugo --minify` | Runs a production build to check for Hugo template or compilation issues |
| **Serve Rendered Disk Output**| `hugo serve --renderToDisk --disableFastRender` | Renders fully compiled production-ready output to the `public/` directory and serves it |

---

## 🔄 Deployment & CI/CD Pipelines

All deployments are managed automatically via GitHub Actions pipelines connected to the GitHub repository:

* **Production Deployment:** Runs automatically on every push/merge to the `main` branch.
  * **Workflow File:** [`.github/workflows/firebase-hosting-merge.yml`](file:///.github/workflows/firebase-hosting-merge.yml)
  * **Steps:** Sets up Hugo (`latest`, extended edition), compiles using `hugo --minify`, and deploys directly to the `live` Firebase Hosting channel.
* **Pull Request Preview Deployment:** Runs automatically on every pull request.
  * **Workflow File:** [`.github/workflows/firebase-hosting-pull-request.yml`](file:///.github/workflows/firebase-hosting-pull-request.yml)
  * **Steps:** Compiles and deploys a preview version of the site to a sandbox channel to test changes in isolation.

---

## 🤖 AI Assistant Workflows & Rules

Behavioral rules and workflow steps tailored for agentic AI coding assistants (like Antigravity) to maintain codebase cleanliness.

> [!TIP]
> **Minimal Disturbance:** Preserve all existing codebase comments, formatting, and file structures unless explicitly asked to modify them.

### 1. Research & Analysis
* Before creating any layout files, check the theme layouts directory at `themes/cookpot/layouts/` to see if partials or templates already exist.
* Verify the page parameters referenced by the layouts (e.g. `.Params.ingredients` in `single.html`) when suggesting updates to the schema.

### 2. Execution Guidelines
* **No Placeholders:** Never use mock images or placeholder text. Always generate high-fidelity assets or realistic mock data.
* **Semantic HTML:** Always use semantic elements (`<main>`, `<article>`, `<time>`, `<header>`, `<footer>`) to maximize accessibility and SEO.

### 3. Verification & Testing
* Always execute the production build command locally to verify zero compiler warnings or errors before marking a task as complete.
* Verify responsiveness across standard layouts and check that markdown outputs render perfectly.
