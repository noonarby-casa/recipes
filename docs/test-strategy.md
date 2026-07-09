# Grill Session: Adding Unit and Headless Browser Tests

## Closed Decisions

### Q1. Unit Testing Framework Choice

- **Question:** Which JS/TS unit testing runner/framework should we use for the site's TypeScript code?
- **Decision:** Vitest
- **Details:**
  - Use Vitest for quick local execution, native TypeScript support, and Jest-compatible assertion syntax.
  - Will be installed via pnpm.

### Q2. Headless Browser Testing Framework Choice

- **Question:** Which headless browser/E2E testing framework should we use to run integration tests against the rendered Hugo site?
- **Decision:** Playwright
- **Details:**
  - Use Playwright for multi-browser support (Chromium, Firefox, WebKit), fast E2E validation, and powerful debug tools like codegen and UI mode.
  - Will be installed via pnpm.

### Q3. Test Directory Structure Choice

- **Question:** Where should we organize our unit test files and browser/E2E test files?
- **Decision:** Co-located Unit Tests + Separate E2E Tests
- **Details:**
  - Unit tests: `themes/cookpot/assets/js/**/*.test.ts` (adjacent to source).
  - E2E/Browser tests: `tests/e2e/**/*.spec.ts` (top-level directory).

### Q4. Unit Test DOM Emulation Choice

- **Question:** Should we run our unit tests in a pure JS/TS environment, or do we need a simulated browser environment (DOM emulation)?
- **Decision:** No DOM Emulation (Pure Logic)
- **Details:**
  - Unit tests will target pure logic (math, parsing, string/formatting utilities) extracted from the UI components.
  - Vitest will run in a pure Node environment.
  - We will not use JSDOM or Happy-DOM, ensuring high execution speed and zero mocking of browser APIs.
  - DOM selection and updates are left to E2E browser tests in Playwright.

### Q5. E2E Testing Local Server Choice

- **Question:** How should we build and serve the Hugo site for Playwright to run tests against it locally and in CI?
- **Decision:** Playwright WebServer with `sirv-cli` and `hugo --minify`
- **Details:**
  - Tests run against a production-like static build of the site to ensure parity.
  - Playwright's config will use a background `webServer` command: `pnpm hugo --minify && pnpm exec sirv public --port 4321`.
  - `sirv-cli` chosen for its speed, minimal size/dependencies, and clean logging.

### Q6. CI/CD Integration Choice

- **Question:** How should we structure our scripts in package.json and configure our GitHub Actions to run these tests?
- **Decision:** Parallel Unit Tests in `pnpm ci` + E2E (Chromium-only) in GitHub Action before deployment
- **Details:**
  - `package.json` scripts: `pnpm test` (vitest run), `pnpm test:watch` (vitest), `pnpm test:e2e` (playwright test).
  - `pnpm ci` runs unit tests in parallel with lint, format, typecheck.
  - GitHub Actions workflow installs Chromium browser (`npx playwright install --with-deps chromium`) and runs `pnpm test:e2e` before the Firebase deploy step.

### Q7. Test Coverage Priorities Choice

- **Question:** What should be our initial roadmap and priority list for adding unit tests and E2E browser tests?
- **Decision:** Phased implementation: Unit testing core modules first, followed by Playwright E2E for scaling/layout/timers, and ending with planner/search.
- **Details:**
  - Phase 1 (Unit): `simple-parser.ts`, `units.ts`, core refactored scaling math, and `shopping-list/pipeline.ts`.
  - Phase 2 (E2E): Recipe scaling clicks, Cooking Mode layout split & scrolling, Timer overlay activation & completion.
  - Phase 3 (E2E/Integration): Meal planner shopping lists and Search filtering.

## Open Questions

_(All questions are resolved! The design session is complete.)_
