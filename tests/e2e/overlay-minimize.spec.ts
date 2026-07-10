import { test, expect } from '@playwright/test';

const testPages = ['/timers/', '/lemon-blueberry-bread/'];

for (const targetPage of testPages) {
  test.describe(`Overlay Minimize E2E on ${targetPage}`, () => {
    test.beforeEach(async ({ page }) => {
      // Install clock before loading the page so timers tick predictably
      await page.clock.install({ time: new Date('2026-07-10T12:00:00Z') });
    });

    test('should minimize and restore the cooking dashboard', async ({
      page,
    }) => {
      // Seed a running timer from another recipe
      await page.addInitScript(() => {
        const timer = {
          recipeUrl: '/recipe-abc/',
          recipeTitle: 'Recipe ABC',
          timerIndex: 0,
          durationLabel: '5 seconds',
          minSeconds: 5,
          maxSeconds: 5,
          status: 'running',
          startedAt: Date.now(),
          pausedDuration: 0,
          elapsedBeforeStart: 0,
          lowerChimePlayed: false,
          upperChimePlayed: false,
          updatedAt: Date.now(),
        };
        localStorage.setItem('noonarby-casa-timers', JSON.stringify([timer]));
      });

      await page.goto(targetPage);

      const dashboard = page.locator('#cooking-dashboard');
      const toggleBtn = page.locator('.overlay-toggle-btn');
      const fab = page.locator('.fab-dashboard');

      // Expanded by default
      await expect(dashboard).toBeVisible();
      await expect(toggleBtn).toBeVisible();
      await expect(fab).toBeHidden();

      // Click toggle to minimize
      await toggleBtn.click();
      await expect(dashboard).toBeHidden();
      await expect(fab).toBeVisible();
      await expect(fab).toBeFocused();

      // Click FAB to restore
      await fab.click();
      await expect(dashboard).toBeVisible();
      await expect(fab).toBeHidden();
    });

    test('should respect minimized state from localStorage on load', async ({
      page,
    }) => {
      // Seed running timer and set minimized to true
      await page.addInitScript(() => {
        const timer = {
          recipeUrl: '/recipe-abc/',
          recipeTitle: 'Recipe ABC',
          timerIndex: 0,
          durationLabel: '5 seconds',
          minSeconds: 5,
          maxSeconds: 5,
          status: 'running',
          startedAt: Date.now(),
          pausedDuration: 0,
          elapsedBeforeStart: 0,
          lowerChimePlayed: false,
          upperChimePlayed: false,
          updatedAt: Date.now(),
        };
        localStorage.setItem('noonarby-casa-timers', JSON.stringify([timer]));
        localStorage.setItem('cooking-dashboard-minimized', 'true');
      });

      await page.goto(targetPage);

      const dashboard = page.locator('#cooking-dashboard');
      const fab = page.locator('.fab-dashboard');

      // Start minimized
      await expect(dashboard).toBeHidden();
      await expect(fab).toBeVisible();
    });

    test('should minimize when Escape key is pressed', async ({ page }) => {
      await page.addInitScript(() => {
        const timer = {
          recipeUrl: '/recipe-abc/',
          recipeTitle: 'Recipe ABC',
          timerIndex: 0,
          durationLabel: '5 seconds',
          minSeconds: 5,
          maxSeconds: 5,
          status: 'running',
          startedAt: Date.now(),
          pausedDuration: 0,
          elapsedBeforeStart: 0,
          lowerChimePlayed: false,
          upperChimePlayed: false,
          updatedAt: Date.now(),
        };
        localStorage.setItem('noonarby-casa-timers', JSON.stringify([timer]));
      });

      await page.goto(targetPage);

      const dashboard = page.locator('#cooking-dashboard');
      const fab = page.locator('.fab-dashboard');

      await expect(dashboard).toBeVisible();
      await page.keyboard.press('Escape');

      await expect(dashboard).toBeHidden();
      await expect(fab).toBeVisible();
    });

    test('should dynamically color the dashboard FAB based on active timer states', async ({
      page,
    }) => {
      // 1. Expired state -> Orange
      await page.addInitScript(() => {
        const timer = {
          recipeUrl: '/recipe-abc/',
          recipeTitle: 'Recipe ABC',
          timerIndex: 0,
          durationLabel: '5 seconds',
          minSeconds: 5,
          maxSeconds: 5,
          status: 'running',
          startedAt: Date.now() - 10000, // started 10s ago, expired
          pausedDuration: 0,
          elapsedBeforeStart: 0,
          lowerChimePlayed: false,
          upperChimePlayed: true,
          updatedAt: Date.now(),
        };
        localStorage.setItem('noonarby-casa-timers', JSON.stringify([timer]));
        localStorage.setItem('cooking-dashboard-minimized', 'true');
      });

      await page.goto(targetPage);
      const fab = page.locator('.fab-dashboard');
      await expect(fab).toHaveClass(/is-expired/);

      // 2. In-range state -> Green
      await page.evaluate(() => {
        const timer = {
          recipeUrl: '/recipe-abc/',
          recipeTitle: 'Recipe ABC',
          timerIndex: 0,
          durationLabel: '5-10 seconds',
          minSeconds: 5,
          maxSeconds: 10,
          status: 'running',
          startedAt: Date.now() - 7000, // started 7s ago, in range [5, 10]
          pausedDuration: 0,
          elapsedBeforeStart: 0,
          lowerChimePlayed: true,
          upperChimePlayed: false,
          updatedAt: Date.now(),
        };
        localStorage.setItem('noonarby-casa-timers', JSON.stringify([timer]));
      });
      // Wait for the UI to tick and apply class
      await page.clock.fastForward(100);
      await expect(fab).toHaveClass(/is-in-range/);

      // 3. Normal running state -> Blue
      await page.evaluate(() => {
        const timer = {
          recipeUrl: '/recipe-abc/',
          recipeTitle: 'Recipe ABC',
          timerIndex: 0,
          durationLabel: '10 seconds',
          minSeconds: 10,
          maxSeconds: 10,
          status: 'running',
          startedAt: Date.now() - 1000, // started 1s ago
          pausedDuration: 0,
          elapsedBeforeStart: 0,
          lowerChimePlayed: false,
          upperChimePlayed: false,
          updatedAt: Date.now(),
        };
        localStorage.setItem('noonarby-casa-timers', JSON.stringify([timer]));
      });
      await page.clock.fastForward(100);
      await expect(fab).toHaveClass(/is-running/);
    });

    test('should automatically expand/unminimize the overlay when a timer expires', async ({
      page,
    }) => {
      await page.addInitScript(() => {
        const timer = {
          recipeUrl: '/recipe-abc/',
          recipeTitle: 'Recipe ABC',
          timerIndex: 0,
          durationLabel: '5 seconds',
          minSeconds: 5,
          maxSeconds: 5,
          status: 'running',
          startedAt: Date.now(), // just started
          pausedDuration: 0,
          elapsedBeforeStart: 0,
          lowerChimePlayed: false,
          upperChimePlayed: false,
          updatedAt: Date.now(),
        };
        localStorage.setItem('noonarby-casa-timers', JSON.stringify([timer]));
        localStorage.setItem('cooking-dashboard-minimized', 'true');
      });

      await page.goto(targetPage);

      const dashboard = page.locator('#cooking-dashboard');
      const fab = page.locator('.fab-dashboard');

      await expect(dashboard).toBeHidden();
      await expect(fab).toBeVisible();

      // Fast-forward 6 seconds so it expires
      await page.clock.fastForward(6000);

      // Should have automatically expanded
      await expect(dashboard).toBeVisible();
      await expect(fab).toBeHidden();
    });

    test('should ensure toggle button is always visible and clickable under all combinations of active elements', async ({
      page,
    }) => {
      const toggleBtn = page.locator('.overlay-toggle-btn');

      // Scenario 1: Only cooking dashboard is active
      await page.addInitScript(() => {
        const timer = {
          recipeUrl: '/recipe-abc/',
          recipeTitle: 'Recipe ABC',
          timerIndex: 0,
          durationLabel: '5 seconds',
          minSeconds: 5,
          maxSeconds: 5,
          status: 'running',
          startedAt: Date.now(),
          pausedDuration: 0,
          elapsedBeforeStart: 0,
          lowerChimePlayed: false,
          upperChimePlayed: false,
          updatedAt: Date.now(),
        };
        localStorage.setItem('noonarby-casa-timers', JSON.stringify([timer]));
      });
      await page.goto(targetPage);
      await expect(toggleBtn).toBeVisible();
      await toggleBtn.click(); // minimized
      await expect(toggleBtn).toBeVisible();
      await toggleBtn.click(); // restored

      // Scenario 2: Only back to meal plan button is active (clear timers first)
      await page.evaluate(() => {
        localStorage.removeItem('noonarby-casa-timers');
      });
      // Navigate to a recipe page with plan parameters
      await page.goto(
        '/lemon-blueberry-bread/?from=plan&instanceId=test-instance',
      );
      await expect(toggleBtn).toBeVisible();
      await toggleBtn.click(); // minimized
      await expect(toggleBtn).toBeVisible();
      await toggleBtn.click(); // restored

      // Scenario 3: Both elements are active
      await page.evaluate(() => {
        const timer = {
          recipeUrl: '/recipe-abc/',
          recipeTitle: 'Recipe ABC',
          timerIndex: 0,
          durationLabel: '5 seconds',
          minSeconds: 5,
          maxSeconds: 5,
          status: 'running',
          startedAt: Date.now(),
          pausedDuration: 0,
          elapsedBeforeStart: 0,
          lowerChimePlayed: false,
          upperChimePlayed: false,
          updatedAt: Date.now(),
        };
        localStorage.setItem('noonarby-casa-timers', JSON.stringify([timer]));
      });
      await page.goto(
        '/lemon-blueberry-bread/?from=plan&instanceId=test-instance',
      );
      await expect(toggleBtn).toBeVisible();
      await toggleBtn.click(); // minimized
      await expect(toggleBtn).toBeVisible();
      await toggleBtn.click(); // restored
    });
  });
}
