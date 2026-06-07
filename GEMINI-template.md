# GEMINI.md - [Project Name]

<!--
This GEMINI.md template provides a high-level context, environment instructions, 
and technical guardrails for Gemini-based AI coding assistants (like Antigravity). 
Keep this file up-to-date in your repository to enable seamless pair programming.
-->

## 📖 Project Overview

Provide a 2-3 sentence high-level overview of the project, its core purpose, target audience, and business goals.

* **Repository:** `[Link to repository, e.g., https://github.com/username/repo]`
* **Production URL:** `[Link to production, e.g., https://example.com]`
* **Staging/Preview URL:** `[Link to staging, e.g., https://staging.example.com]`
* **Primary Contacts / Owners:** `[Author Name / Email]`

---

## 🛠️ Technology Stack & Environment

A quick reference breakdown of the core technologies, libraries, and frameworks powering this codebase.

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | `[e.g., Hugo / Next.js]` | `[e.g., 0.125.0]` | Core framework / Static site generator |
| **Styling** | `[e.g., Vanilla CSS / Tailwind]` | `[e.g., v4.0]` | Design system and layouts |
| **Runtime** | `[e.g., Node.js / Go]` | `[e.g., v20.x]` | Build environment / package runner |
| **Hosting** | `[e.g., Firebase Hosting]` | N/A | Cloud hosting and SSL management |
| **CI/CD** | `[e.g., GitHub Actions]` | N/A | Automated builds and deployments |

---

## 📂 Codebase Architecture & Directory Map

A structural tree mapping key directories and configuration files to help the assistant locate files and assets instantly.

```text
├── .github/workflows/    # CI/CD deployment pipelines
├── archetypes/           # Content template archetypes for new files
├── assets/               # Raw stylesheet inputs, JS, and graphics (processed by asset pipelines)
├── content/              # Raw site content (usually Markdown files)
│   ├── _index.md         # Main entry point (homepage)
│   └── [subfolders]/     # Feature or content-specific subdirectories
├── static/               # Assets copied directly to the output root (images, robots.txt, icons)
├── themes/               # Layout themes and visual presentation submodules
│   └── [theme-name]/     # Theme directory (layouts, partials, theme-specific assets)
├── [config.toml/hugo.toml]# Central site configuration file
├── package.json          # Node dependencies and build scripts
└── firebase.json         # Hosting provider configurations (if applicable)
```

---

## 🎨 Design System & Styling Guidelines

Instructions for the assistant on how UI and layout elements should be styled to maintain aesthetic integrity.

> [!IMPORTANT]
> **Aesthetic Priority:** Always prioritize a modern, highly premium look and feel. Avoid generic colors; use harmonic, tailored palettes, elegant dark modes, modern typography (e.g., Google Fonts like *Inter*, *Outfit*, or *Playfair Display*), and micro-animations for interactive elements.

* **Styling Paradigm:** `[Clearly define whether you use Tailwind, Vanilla CSS, Sass, or CSS Modules.]`
* **Layout Principles:** `[Explain standard layout constraints, e.g., max-width of 768px, mobile-first, grid or flexbox strategies.]`
* **Custom Overrides:** `[Detail the process for modifying styles, e.g., editing root assets vs creating theme overrides.]`

---

## ✍️ Content & Schema Definitions

Specific conventions for writing content, front matter fields, data structures, or database schemas.

### Content Front Matter Schema

Each content markdown file must adhere to the following front matter structure:

```toml
+++
title = "Descriptive Title"
date = YYYY-MM-DDTHH:MM:SS-TZ
slug = "url-safe-slug"
draft = true
# [Add project-specific fields here, e.g., ingredients, tags, categories]
+++
```

* **Schema Conventions:**
  * `[Convention 1, e.g., Keep all list items as lowercase strings.]`
  * `[Convention 2, e.g., Ensure the slug is URL-safe and matches the directory structure.]`
  * `[Convention 3, e.g., Instructions must use an ordered list under an '## Instructions' heading.]`

---

## 🚀 Local Development & Building

Commands and procedures for running, building, and testing the project locally.

### Command Reference

| Action | Command | Purpose |
| :--- | :--- | :--- |
| **Install Dependencies** | `npm install` | Restores local node packages |
| **Run Dev Server** | `[e.g., hugo server]` | Starts local development server with hot-reload |
| **Build for Production** | `[e.g., hugo --minify]` | Generates minified production bundle to disk |
| **Run Linter / Formatter**| `[e.g., npm run lint]` | Checks codebase syntax and style rules |
| **Run Unit Tests** | `[e.g., npm test]` | Validates application correctness |

### Local Dev Best Practices
* **Hot Reloading:** `[List any quirks, e.g., '--disableFastRender' may be required when changing layouts.]`
* **Clean Builds:** `[List clean commands, e.g., how to purge build locks or temporary output folders.]`

---

## 🔄 Deployment & CI/CD Pipeline

Details on how code is integrated, tested, and deployed to production.

* **Branching Strategy:** `[e.g., Code merged into 'main' is automatically built and deployed to production.]`
* **Preview Channel Deployments:** `[e.g., Pull Requests automatically trigger preview deploys for sandbox testing.]`
* **CI/CD Config Locations:**
  * Production Deployment: `[e.g., .github/workflows/deploy-prod.yml]`
  * Preview Deployment: `[e.g., .github/workflows/deploy-preview.yml]`

---

## 🤖 AI Assistant Workflows & Rules

Behavioral rules and workflow steps tailored for agentic AI coding assistants to maintain codebase cleanliness.

> [!TIP]
> **Documentation Integrity:** Maintain and preserve all existing comments, docstrings, formatting, and file headers unless explicitly asked to modify them.

### 1. Research & Code Inspection
* Always inspect parent layouts or themes before creating new custom layout templates.
* Use `grep_search` to find duplicate class structures or existing utility styles before adding new styles.

### 2. Execution Guidelines
* **No Placeholders:** Never use mock images or placeholder text. Always generate high-fidelity assets or realistic mock data.
* **Semantic HTML:** Always use semantic elements (`<main>`, `<article>`, `<time>`, `<header>`, `<footer>`) to maximize accessibility and SEO.

### 3. Verification & Testing
* Always execute the production build command locally to verify zero compiler warnings or errors before marking a task as complete.
* Verify responsiveness across standard layouts and check that markdown outputs render perfectly.
