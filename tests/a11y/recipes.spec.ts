import { test } from '@playwright/test';
import {
  createAxeBuilder,
  formatViolations,
  getRecipes,
  getRecipeUrl,
  setTheme,
} from './axe-helper';

test.describe('Recipe Content Accessibility Scans', () => {
  const recipes = getRecipes();

  for (const recipe of recipes) {
    // Skip Cozy Chickpea Curry since it is thoroughly tested in the core template matrix
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
