import { test, expect } from '@playwright/test';
import { createAxeBuilder, formatViolations, setTheme } from './axe-helper';

test.describe('Interactive States and Focus Transitions', () => {
  test('Recipe page - Active Timers Overlay', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/chickpea-curry/');

    // Ensure we are in a default state
    await setTheme(page, 'light');

    // Click to start a timer (which opens/shows the active timers overlay/section)
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
