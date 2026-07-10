# Grill Session: Accessibility Testing with axe-core

This session explores how to integrate accessibility (a11y) testing using axe-core into the Noonarby Casa Recipes website.

## Closed Decisions

### Q1. Integration Strategy

- **Question:** Which testing environment(s) should we integrate axe-core with?
- **Decision:** Integrate `@axe-core/playwright` into the existing Playwright E2E suite.
- **Details:**
  - Use `@axe-core/playwright` to run accessibility scans against fully rendered pages in a real browser.
  - Implement scans in a dedicated spec, e.g., `tests/e2e/accessibility.spec.ts`.

### Q2. Target Pages & States

- **Question:** Which pages, viewports, and application states should we scan?
- **Decision:** Implement the Hybrid Approach:
  - **Layout Matrix:** Scan the 4 core template types (Home, a representative recipe, Plan, Timers) across all dimensions (2 viewports × 2 themes × 2 states).
  - **Content Scan:** Programmatically discover and scan all other recipes in a single viewport/theme combination.
- **Details:**
  - Dynamic recipe discovery will read the `content/` directory or output from the filesystem inside the Playwright test file, ensuring new recipes are automatically tested.

### Q3. WCAG Standards & Rule Customization

- **Question:** Which WCAG compliance level and rules should be enforced, and are there exceptions/rules we should ignore?
- **Decision:** Target **WCAG 2.2 AA** as the baseline, with selective **WCAG AAA** rules enabled.
- **Details:**
  - **Baseline tags:** `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22a`, `wcag22aa`, and `best-practice`.
  - **Selective AAA Rules:**
    - `target-size` (AAA - 2.5.5): Ensures touch targets (buttons, checklist boxes, links) are at least $44 \times 44$ CSS pixels, vital for messy or distant kitchen use.
    - `contrast-enhanced` (AAA - 1.4.6): Enforces a strict 7:1 contrast ratio for normal text, ensuring legibility under bright kitchen lights or screen glare.
    - `line-spacing` (AAA - 1.4.8): Verifies text block presentation (at least 1.5x line height and left/right alignment) to prevent losing one's place when reading recipe instructions.
    - `link-in-text-block` (AAA - 2.4.9): Ensures links in recipe text are descriptive on their own (no "click here").
    - `focus-appearance` (AAA - 2.4.13): Validates that keyboard focus indicators are thick, high-contrast, and clearly visible.
    - `meta-viewport` (AAA - 1.4.4): Ensures that pinch-to-zoom is not disabled on mobile viewports.

### Q4. CI/CD Enforcement

- **Question:** Should accessibility failures fail the CI pipeline immediately, or should we use a warning/reporting phase first?
- **Decision:** Fail the build immediately in CI (`pnpm test:e2e`).
- **Details:**
  - Since known exceptions will be handled in configuration, any new accessibility issue should block pull request merging and hosting deployment.

### Q5. HTML Report Generation

- **Question:** Should we generate standalone HTML accessibility reports for manual review (e.g., during local development or in CI artifacts)?
- **Decision:** Use Playwright's built-in HTML report with custom formatted console logs.
- **Details:**
  - Implement a custom formatting helper in the E2E test file to pretty-print axe-core violations (CSS selector, HTML snippet, impact, and remediation link) directly in the test output, which Playwright automatically captures.

### Q6. Interactive States & Keyboard Focus

- **Question:** How should we test dynamic changes (e.g., opening the timers panel, clicking buttons) and validate that keyboard focus is properly managed and does not get trapped?
- **Decision:** Separate accessibility/focus checks into a dedicated `accessibility.spec.ts` file, keeping them distinct from functional tests.
- **Details:**
  - Dynamic states (like open drawers) will be scanned by triggering the interaction and then running an axe scan.
  - Focus state transitions (like focus shifting to a drawer on open, and returning to the trigger on close) will be verified with explicit Playwright focus assertions.

### Q7. Brand Color Contrast Exceptions

- **Question:** How should we handle contrast failures from our primary brand color `--noonblue` (`#0080d8`), which has a contrast ratio of ~4.2:1 against both light and dark backgrounds (failing the 4.5:1 AA target and the 7:1 AAA target)?
- **Decision:** Fail immediately on contrast violations and adjust `--noonblue` or related CSS variables as needed to comply.
- **Details:**
  - No exclusions will be made for brand colors.
  - We will ensure the contrast checks run fully, and if we encounter failures, we will resolve them by refining the theme colors to meet WCAG 2.2 AA.

## Open Questions

_(All questions have been resolved!)_
