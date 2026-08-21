# Grill Session: Splitting Accessibility Tests from E2E Tests

## Closed Decisions

### Q1. Playwright Execution Strategy

- **Question:** How should we configure Playwright to isolate accessibility testing from functional E2E testing?
- **Decision:** Single [`playwright.config.ts`](file:///home/nicholasnooney/projects/noonarby-casa/recipes/playwright.config.ts) configured with Playwright Projects.
- **Details:**
  - Define separate projects (e.g., `e2e` and `a11y`) inside [`playwright.config.ts`](file:///home/nicholasnooney/projects/noonarby-casa/recipes/playwright.config.ts).
  - Preserves a single unified configuration and shared web server lifecycle while enabling isolated execution via `--project` flags.

### Q2. Test Directory Structure & File Naming Conventions

- **Question:** How should we organize the test files on disk?
- **Decision:** Dedicated sibling directory [`tests/a11y/`](file:///home/nicholasnooney/projects/noonarby-casa/recipes/tests/a11y/) alongside [`tests/e2e/`](file:///home/nicholasnooney/projects/noonarby-casa/recipes/tests/e2e/).
- **Details:**
  - Set `testDir: './tests/e2e'` for the `e2e` project and `testDir: './tests/a11y'` for the `a11y` project.
  - Avoids regex-based test matching and keeps directory boundaries clean.

### Q3. Breakdown & Spec Granularity in `tests/a11y/`

- **Question:** How should we split the monolithic accessibility tests across files in [`tests/a11y/`](file:///home/nicholasnooney/projects/noonarby-casa/recipes/tests/a11y/)?
- **Decision:** 3 Spec Files + 1 Shared Helper Module.
- **Details:**
  - [`tests/a11y/axe-helper.ts`](file:///home/nicholasnooney/projects/noonarby-casa/recipes/tests/a11y/axe-helper.ts): Reusable Axe builder factory, theme toggle helper, violation formatter, and recipe discovery logic.
  - [`tests/a11y/templates.spec.ts`](file:///home/nicholasnooney/projects/noonarby-casa/recipes/tests/a11y/templates.spec.ts): Core layout matrix (Home, Recipe, Planner, Timers × 2 Viewports × 2 Themes).
  - [`tests/a11y/interactive.spec.ts`](file:///home/nicholasnooney/projects/noonarby-casa/recipes/tests/a11y/interactive.spec.ts): Dynamic states (Timer overlay open, Planner View/Edit/Shop mode switches, keyboard focus checks).
  - [`tests/a11y/recipes.spec.ts`](file:///home/nicholasnooney/projects/noonarby-casa/recipes/tests/a11y/recipes.spec.ts): Dynamic scan across all individual recipe content bundles.

### Q4. `package.json` Script Catalog & Namespace

- **Question:** How should test scripts in [`package.json`](file:///home/nicholasnooney/projects/noonarby-casa/recipes/package.json) be named and scoped?
- **Decision:** Explicit namespaced script suite with no bare `test` command.
- **Details:**
  - `"test:unit"`: `vitest run`
  - `"test:unit:watch"`: `vitest`
  - `"test:e2e"`: `playwright test --project=e2e`
  - `"test:e2e:ui"`: `playwright test --project=e2e --ui`
  - `"test:a11y"`: `playwright test --project=a11y`
  - `"test:a11y:ui"`: `playwright test --project=a11y --ui`
  - `"test:browser"`: `playwright test` (executes all Playwright projects: e2e + a11y)
  - `"test:all"`: `pnpm run test:unit && pnpm run test:browser`
  - Remove bare `"test"` script. Update `"ci"` script to reference `"test:unit"`.

### Q5. CI Workflow Pipeline Execution

- **Question:** How should CI orchestrate browser testing in GitHub Actions?
- **Decision:** Sequential dedicated steps (`Run E2E Tests` & `Run Accessibility Tests`).
- **Details:**
  - Execute `pnpm test:e2e` followed by `pnpm test:a11y` within the PR and merge deployment workflows.
  - Gives isolated status indicators and log groups in GitHub Actions without runner spin-up overhead.

### Q6. Boundary Guidelines: Functional Testing vs Accessibility Audits

- **Question:** What is the explicit boundary and division of responsibilities between [`tests/e2e/`](file:///home/nicholasnooney/projects/noonarby-casa/recipes/tests/e2e/) and [`tests/a11y/`](file:///home/nicholasnooney/projects/noonarby-casa/recipes/tests/a11y/)?
- **Decision:** Strict separation by purpose.
- **Details:**
  - `tests/e2e/`: User workflow logic, DOM state transitions, persistence, and interactive business logic without `@axe-core/playwright` overhead.
  - `tests/a11y/`: Automated WCAG audits via Axe-core, contrast rules, ARIA semantic compliance, and focus management validation.

### Q7. Test Reporting, Traces, & Output Artifacts

- **Question:** How should we manage test reporting, traces, and failure output across the split suites?
- **Decision:** Shared standard output directories (`playwright-report/` and `test-results/`) with rich console violation formatting.
- **Details:**
  - Keep standard reporter configuration (`list` + `html`).
  - Rely on formatted assertion error strings in console/CI logs for rapid violation triage without needing multiple report directories.

## Open Questions

_(All core design branches resolved!)_
