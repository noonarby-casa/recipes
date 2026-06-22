# 🍳 Noonarby Casa Recipes

This is a **Hugo-based static website** dedicated to displaying recipes for the **Noonarby Casa**. It features a custom recipe-focused Hugo theme named `cookpot` and is deployed to **Firebase Hosting**.

* **Live Production Website:** [recipes.noonarby.casa](https://recipes.noonarby.casa/)

---

## 🛠️ Technology Stack & Architecture

- **Static Site Generator:** [Hugo (Extended)](https://gohugo.io/)
- **Theme:** `cookpot` (a custom theme tailored for recipe rendering, timers, and scaling)
- **Version Control:** [Jujutsu (jj)](https://github.com/martinvonz/jj)
- **Hosting:** Firebase Hosting (Project ID: `noonarby-casa-recipes`)
- **CI/CD:** GitHub Actions for automated pull request previews and production deployment.

For a detailed map of the codebase directory structure and layouts, please refer to [GEMINI.md](file:///home/nicholasnooney/projects/noonarby-casa/recipes/GEMINI.md).

---

## 🚀 Local Development

### Prerequisites

You must have **Hugo Extended** installed on your machine. You can verify your installation with:

```bash
hugo version
```
*(Ensure the output contains `extended`. The extended version is required to compile modular CSS and assets handled by the theme.)*

### Commands

| Command | Action |
| :--- | :--- |
| `hugo server` | Starts a local development server at `http://localhost:1313/recipes/` with live reloading. |
| `hugo --minify` | Compiles the site into the `public/` directory, minifying assets to verify production build viability. |
| `hugo serve --renderToDisk --disableFastRender` | Renders the production-ready site to the `public/` directory and serves it locally. |

---

## ✍️ Recipe Content Authoring

All recipe articles are stored under [content/](file:///home/nicholasnooney/projects/noonarby-casa/recipes/content/) as Hugo **leaf bundles** (a folder named with the recipe's slug containing an `index.md` and optional media assets).

### 1. Creating a New Recipe

To generate a new recipe using the default archetype template, run:

```bash
hugo new content content/<recipe-slug>/index.md
```

### 2. Front Matter Schema

The recipe's `index.md` file must contain front matter configured using TOML:

```toml
+++
title = 'Recipe Title'
date = YYYY-MM-DDTHH:MM:SS-TZ
slug = 'url-safe-slug'
prepTime = 'Duration (e.g., "10 minutes")'
cookTime = 'Duration (e.g., "20 minutes")'
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

### 3. Step Quantities & Unit Scaling

Inside the `## Instructions` section, wrap any ingredient quantities in step descriptions with the `{{< qty "amount unit" >}}` shortcode to enable interactive scaling:

* **Supported Units:** The scaling engine in [main.js](file:///home/nicholasnooney/projects/noonarby-casa/recipes/themes/cookpot/assets/js/main.js) supports: `ounces`, `ounce`, `pounds`, `pound`, `cups`, `cup`, `teaspoons`, `teaspoon`, `tablespoons`, `tablespoon`, `cloves`, `clove`, `cans`, `can`, `grams`, `gram`, `g`, `ml`, `small`, `large`, `medium`.
* **Usage Rules:**
  - **Supported units:** Wrap both the amount and unit inside the shortcode.
    * Example: `{{< qty "16 ounces" >}}` or `{{< qty "1/2 pound" >}}`.
  - **Unsupported units** (e.g., `lemon`, `onion`, `squash`): Wrap *only* the numeric amount, leaving the unit outside.
    * Example: `{{< qty "1" >}} lemon` or `{{< qty "4" >}} summer squash`.
  - **Avoid ranges:** The parser matches the first numeric quantity. For ranges, write:
    * Example: `{{< qty "2 tablespoons" >}} (or up to 3)`.

### 4. Interactive Timers

Wrap time durations or ranges inside step descriptions with the `{{< timer "duration" >}}` shortcode. This generates an interactive client-side countdown timer:

* Example: `Cook for {{< timer "5-7 minutes" >}}.`
* Example: `Simmer for {{< timer "10 minutes" >}}.`

---

## 🔀 Version Control with Jujutsu (`jj`)

This repository uses **Jujutsu (jj)** as its primary version control system. It does not use standard Git commands directly (there is no active `.git` directory in the workspace).

### Key Workflow Commands

* **Check status:** `jj status`
* **Show diff:** `jj diff`
* **View commit log:** `jj log -n 5`
* **Set commit message:** `jj describe -m "Your commit message"`
* **Create a new working copy commit:** `jj new`

> [!IMPORTANT]
> Since Jujutsu uses a pager by default for commands like `status`, `diff`, and `log`, when calling these commands from non-interactive shells or automated scripts, you **must** pass the `--no-pager` global flag (e.g., `jj --no-pager status`).

---

## 🚀 Deployment

Deployment is fully automated through **GitHub Actions** and connected to the GitHub repository:

- **Pull Request Preview:** Every PR automatically compiles using `hugo --minify` and deploys a preview version of the site to a Firebase Hosting preview channel.
- **Production Release:** Merges or direct pushes to the `main` branch trigger a production build and deploy immediately to [recipes.noonarby.casa](https://recipes.noonarby.casa/).
