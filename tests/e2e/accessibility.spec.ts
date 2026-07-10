import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

// Helper to format Axe violations for clean console/report output
function formatViolations(violations: any[]): string {
  return violations
    .map((v, i) => {
      const nodes = v.nodes
        .map(
          (n: any) =>
            `    Selector: ${n.target.join(', ')}\n    HTML: ${n.html}`,
        )
        .join('\n\n');
      return `${i + 1}. [${v.impact ? v.impact.toUpperCase() : 'UNKNOWN'}] Rule: ${v.id}\n   Help: ${v.help} (${v.helpUrl})\n\n${nodes}`;
    })
    .join('\n\n' + '='.repeat(40) + '\n\n');
}

// Factory to create configured AxeBuilder instance
function createAxeBuilder(page: Page): AxeBuilder {
  return new AxeBuilder({ page })
    .exclude('.planner-clear-btn')
    .withTags([
      'wcag2a',
      'wcag2aa',
      'wcag21a',
      'wcag21aa',
      'wcag22a',
      'wcag22aa',
      'best-practice',
    ])
    .options({
      rules: {
        'color-contrast-enhanced': {
          enabled: true,
          selector:
            ':not(.toggle-btn):not(.scale-btn):not(.planner-btn-primary):not(.planner-btn-secondary):not(.planner-clear-btn):not(.scale-display):not(.plan-back-btn):not(.recipe-timer):not(.recipe-timer-btn):not(.store-layout-option-btn):not(.banner-tab):not(.banner-btn):not(.recipe-meta li a)',
        },
        'identical-links-same-purpose': { enabled: true },
        'link-in-text-block': { enabled: true },
      },
    });
}

// Helper to set light/dark theme
async function setTheme(page: Page, theme: 'light' | 'dark'): Promise<void> {
  const targetDark = theme === 'dark';
  const isDarkCurrently = await page.evaluate(() =>
    document.documentElement.classList.contains('dark-mode'),
  );

  if (isDarkCurrently !== targetDark) {
    const toggleBtn = page.locator('#header-theme-toggle');
    if ((await toggleBtn.count()) > 0) {
      await toggleBtn.click();
    } else {
      await page.evaluate((dark) => {
        if (dark) {
          document.documentElement.classList.add('dark-mode');
        } else {
          document.documentElement.classList.remove('dark-mode');
        }
      }, targetDark);
    }
  }

  // Double check and wait a moment for transitions/rendering
  await page.waitForTimeout(100);
}

// Discover recipes dynamically from content directory
function getRecipes(): string[] {
  const contentDir = path.join(__dirname, '../../content');
  if (!fs.existsSync(contentDir)) {
    return [];
  }
  return fs
    .readdirSync(contentDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .filter((name) => !['plan', 'sitemap', 'timers'].includes(name));
}

// Get the actual URL path of a recipe, parsing the front matter 'slug' if present
function getRecipeUrl(recipeDir: string): string {
  const contentDir = path.join(__dirname, '../../content');
  const indexMdPath = path.join(contentDir, recipeDir, 'index.md');
  if (fs.existsSync(indexMdPath)) {
    const fileContent = fs.readFileSync(indexMdPath, 'utf8');
    const slugMatch = fileContent.match(/slug\s*=\s*["']([^"']+)["']/);
    if (slugMatch) {
      return `/${slugMatch[1]}/`;
    }
  }
  return `/${recipeDir}/`;
}

test.describe('Accessibility Scans (Axe-Core)', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 812 },
    { name: 'Desktop', width: 1280, height: 800 },
  ];
  const themes: ('light' | 'dark')[] = ['light', 'dark'];

  // 1. Layout Matrix (Core Templates)
  const coreTemplates = [
    { name: 'Home Page', path: '/' },
    { name: 'Recipe Detail (Cozy Chickpea Curry)', path: '/chickpea-curry/' },
    { name: 'Meal Planner', path: '/plan/' },
    { name: 'Active Timers', path: '/timers/' },
  ];

  for (const template of coreTemplates) {
    for (const viewport of viewports) {
      for (const theme of themes) {
        test(`Core Template: ${template.name} (${viewport.name} - ${theme} Mode)`, async ({
          page,
        }) => {
          await page.setViewportSize({
            width: viewport.width,
            height: viewport.height,
          });
          await page.goto(template.path);
          await setTheme(page, theme);

          const builder = createAxeBuilder(page);
          const results = await builder.analyze();

          if (results.violations.length > 0) {
            throw new Error(
              `Accessibility violations found on ${template.name} (${viewport.name} - ${theme} Mode):\n\n${formatViolations(results.violations)}`,
            );
          }
        });
      }
    }
  }

  // 2. Interactive States & Keyboard Focus
  test.describe('Interactive States and Focus Transitions', () => {
    test('Recipe page - Active Timers Overlay', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/chickpea-curry/');

      // Ensure we are in a default state
      await setTheme(page, 'light');

      // Click to start a timer (which opens/shows the active timers overlay/section)
      // Let's find a timer button. Cozy Chickpea Curry has a timer shortcode button
      const timerBtn = page
        .locator('.recipe-timer-btn, [data-timer-duration]')
        .first();
      await expect(timerBtn).toBeVisible();

      // Trigger the timer
      await timerBtn.click();

      // Verify accessibility of the page with active timers
      const builder = createAxeBuilder(page);
      const results = await builder.analyze();

      if (results.violations.length > 0) {
        throw new Error(
          `Accessibility violations with Active Timer Overlay open:\n\n${formatViolations(results.violations)}`,
        );
      }
    });

    test('Meal Planner - Mode Switcher View Scans', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/plan/');
      await setTheme(page, 'light');

      // 1. Scan View Mode (default)
      let builder = createAxeBuilder(page);
      let results = await builder.analyze();
      if (results.violations.length > 0) {
        throw new Error(
          `Meal Planner View Mode violations:\n\n${formatViolations(results.violations)}`,
        );
      }

      // 2. Switch to Edit Mode
      const editBtn = page.locator('#mode-edit-btn');
      await editBtn.click();
      await page.waitForTimeout(100);
      builder = createAxeBuilder(page);
      results = await builder.analyze();
      if (results.violations.length > 0) {
        throw new Error(
          `Meal Planner Edit Mode violations:\n\n${formatViolations(results.violations)}`,
        );
      }

      // 3. Switch to Shopping List Mode
      const shopBtn = page.locator('#mode-shop-btn');
      await shopBtn.click();
      await page.waitForTimeout(100);
      builder = createAxeBuilder(page);
      results = await builder.analyze();
      if (results.violations.length > 0) {
        throw new Error(
          `Meal Planner Shopping Mode violations:\n\n${formatViolations(results.violations)}`,
        );
      }
    });
  });

  // 3. Dynamic Recipes Discovery & Fast Content Scan
  const recipes = getRecipes();
  for (const recipe of recipes) {
    // Skip Cozy Chickpea Curry since it is thoroughly tested in the matrix
    if (recipe === 'chickpea-curry') {
      continue;
    }

    const recipePath = getRecipeUrl(recipe);

    test(`Recipe Content Scan: ${recipePath}`, async ({ page }) => {
      // Use Desktop + Light Mode + Initial State for single-run content scans
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(recipePath);
      await setTheme(page, 'light');

      const builder = createAxeBuilder(page);
      const results = await builder.analyze();

      if (results.violations.length > 0) {
        throw new Error(
          `Accessibility violations on recipe page ${recipePath}:\n\n${formatViolations(results.violations)}`,
        );
      }
    });
  }
});
