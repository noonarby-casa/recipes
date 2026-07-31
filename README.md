# 🍳 Noonarby Casa Recipes

This is a **Hugo-based static website** dedicated to displaying recipes for the **Noonarby Casa**. It features a custom recipe-focused Hugo theme named `cookpot` with interactive Svelte 5 components and is deployed to **Firebase Hosting**.

- **Live Production Website:** [recipes.noonarby.casa](https://recipes.noonarby.casa/)

---

## 🛠️ Technology Stack & Architecture

- **Static Site Generator:** [Hugo (Extended)](https://gohugo.io/)
- **UI & Scripting:** [Svelte 5](https://svelte.dev/) components & [TypeScript](https://www.typescriptlang.org/) (bundled via Vite / Hugo ESBuild)
- **Styling:** Modular Vanilla CSS with CSS variable dark mode
- **Tooling:** [pnpm](https://pnpm.io/), [ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [Vitest](https://vitest.dev/)
- **Hosting & CI/CD:** Firebase Hosting via GitHub Actions

For detailed structural and architectural documentation, see:

- [Directory Structure](docs/directory_structure.md)
- [Architecture Overview](docs/architecture.md)

---

## 🚀 Local Development

### Prerequisites

- **Hugo Extended** (`hugo version` must indicate `extended`)
- **Node.js** and **pnpm**

```bash
pnpm install
```

### Development Commands

| Command          | Action                                                     |
| :--------------- | :--------------------------------------------------------- |
| `hugo server`    | Start local dev server at `http://localhost:1313/recipes/` |
| `hugo --minify`  | Run production static build verification                   |
| `pnpm run ci`    | Run full CI suite (`typecheck`, `lint`, `format`, `test`)  |
| `pnpm fix`       | Run automatic fixers (`lint:fix` + `format:fix`)           |
| `pnpm typecheck` | Run TypeScript compiler check                              |
| `pnpm lint`      | Run ESLint syntax check                                    |
| `pnpm format`    | Run Prettier format check                                  |

---

## ✍️ Recipe Content Authoring

Recipes are stored under [content/](content/) as Hugo leaf bundles (`content/<recipe-slug>/index.md`).

To quickly create a new recipe leaf bundle:

```bash
hugo new content content/<recipe-slug>/index.md
```

For complete step-by-step instructions on recipe front matter schema (TOML), interactive quantity (`{{< qty >}}`) and timer (`{{< timer >}}`) shortcodes, and required unit testing verification, refer to the **[Recipe Creation Guide](.agents/skills/create-recipe/SKILL.md)**.

---

## ✨ Features Overview

- **Dynamic Ingredient Scaling:** Interactive portion multiplier automatically scales quantities and adjusts singular/plural item names.
- **Shopping List & Unit Conversion:** Grouping and converting recipe items into commercial grocery quantities (e.g., garlic cloves to heads, butter ounces to sticks, pantry staples filtering).
- **Weekly Meal Planner:** Full interactive calendar (`/plan/`) for scheduling meals, global serving scaling, category balance analytics, and URL plan sharing.
- **Interactive Timers & Wake Lock:** Step timers with Screen Wake Lock integration (`navigator.wakeLock`) to prevent screen dimming during cooking.

For complete feature architectures, refer to [docs/architecture.md](docs/architecture.md).

---

## 🚀 Deployment

- **Pull Request Previews:** Automatic preview builds deployed to Firebase Hosting on open PRs.
- **Production Release:** Pushing to `main` automatically triggers a production build deployed to [recipes.noonarby.casa](https://recipes.noonarby.casa/).
