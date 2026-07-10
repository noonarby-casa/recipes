import { test, expect } from '@playwright/test';

test.describe('Recipe Timers E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Install clock before loading the page so that Date.now() / setInterval are intercepted from the start
    await page.clock.install({ time: new Date('2026-07-10T12:00:00Z') });
    await page.goto('/timers/');
  });

  test('should verify the idle state of the 5 Seconds timer', async ({
    page,
  }) => {
    // Select the 5 Seconds timer container
    const timerContainer = page
      .locator('.recipe-timer[data-duration="5 seconds"]')
      .first();

    // Default label check
    const label = timerContainer.locator('.timer-label');
    await expect(label).toHaveText('5 seconds');

    // Verify background is blue (brand color: --noonblue is #00518c / rgb(0, 81, 140))
    await expect(timerContainer).toHaveCSS(
      'background-color',
      'rgb(0, 81, 140)',
    );

    // Play icon should be visible
    const playIcon = timerContainer.locator('.timer-play-icon');
    await expect(playIcon).toBeVisible();

    // Pause icon should be hidden
    const pauseIcon = timerContainer.locator('.timer-pause-icon');
    await expect(pauseIcon).toBeHidden();

    // Reset button should be hidden
    const resetBtn = timerContainer.locator('.recipe-timer-reset');
    await expect(resetBtn).toBeHidden();
  });

  test('should handle running and pausing states', async ({ page }) => {
    const timerContainer = page
      .locator('.recipe-timer[data-duration="5 seconds"]')
      .first();
    const btn = timerContainer.locator('.recipe-timer-btn');
    const label = timerContainer.locator('.timer-label');
    const resetBtn = timerContainer.locator('.recipe-timer-reset');
    const playIcon = timerContainer.locator('.timer-play-icon');
    const pauseIcon = timerContainer.locator('.timer-pause-icon');

    // Click to start
    await btn.click();

    // Verify running classes and icons
    await expect(timerContainer).toHaveClass(/has-started/);
    await expect(timerContainer).toHaveClass(/is-running/);
    await expect(resetBtn).toBeVisible();
    await expect(pauseIcon).toBeVisible();
    await expect(playIcon).toBeHidden();

    // Tick the clock forward 1 second
    await page.clock.fastForward(1000);
    // 5s -> 0:04
    await expect(label).toHaveText('0:04');

    // Click to pause
    await btn.click();

    // Verify paused classes
    await expect(timerContainer).toHaveClass(/has-started/);
    await expect(timerContainer).not.toHaveClass(/is-running/);
    // Pause state styling check: check computed style for background color (should be paused bg)
    // In light mode, --timer-paused-bg is #e2e8f0 (rgb(226, 232, 240))
    await expect(timerContainer).toHaveCSS(
      'background-color',
      'rgb(226, 232, 240)',
    );

    // Tick the clock forward 2 seconds while paused
    await page.clock.fastForward(2000);
    // Countdown should not have ticked down further (still 0:04)
    await expect(label).toHaveText('0:04');
  });

  test('should handle in-range and beyond-range states', async ({ page }) => {
    // Let's use the "3-6 seconds" range timer
    const timerContainer = page
      .locator('.recipe-timer[data-duration="3-6 seconds"]')
      .first();
    const btn = timerContainer.locator('.recipe-timer-btn');
    const label = timerContainer.locator('.timer-label');

    // Start timer
    await btn.click();

    // Tick to 2 seconds (not yet in range)
    await page.clock.fastForward(2000);
    await expect(label).toHaveText('0:04'); // remaining: 6s - 2s = 4s
    await expect(timerContainer).not.toHaveClass(/is-in-range/);
    await expect(timerContainer).not.toHaveClass(/is-beyond-range/);

    // Tick 1 more second to 3s (reaches minSeconds = 3s)
    await page.clock.fastForward(1000);
    await expect(label).toHaveText('0:03'); // remaining: 6s - 3s = 3s
    await expect(timerContainer).toHaveClass(/is-in-range/);
    await expect(timerContainer).not.toHaveClass(/is-beyond-range/);
    // Verify background color is green (rgb(16, 185, 129))
    await expect(timerContainer).toHaveCSS(
      'background-color',
      'rgb(16, 185, 129)',
    );

    // Pause while in-range to verify it gets unified paused background
    await btn.click();
    await expect(timerContainer).toHaveCSS(
      'background-color',
      'rgb(226, 232, 240)',
    );

    // Resume
    await btn.click();
    await expect(timerContainer).toHaveClass(/is-in-range/);
    await expect(timerContainer).toHaveClass(/is-running/);
    await expect(timerContainer).toHaveCSS(
      'background-color',
      'rgb(16, 185, 129)',
    );

    // Tick 3 more seconds to 6s (crosses maxSeconds = 6s)
    await page.clock.fastForward(3000);
    // At exactly 6s it goes beyond range (so 6.1s is beyond)
    await page.clock.fastForward(100);
    await expect(timerContainer).toHaveClass(/is-beyond-range/);
    // Verify background color is orange (rgb(249, 115, 22))
    await expect(timerContainer).toHaveCSS(
      'background-color',
      'rgb(249, 115, 22)',
    );

    // Pause while beyond-range to verify it also gets unified paused background
    await btn.click();
    await expect(timerContainer).toHaveCSS(
      'background-color',
      'rgb(226, 232, 240)',
    );
  });

  test('should reset back to idle state', async ({ page }) => {
    const timerContainer = page
      .locator('.recipe-timer[data-duration="5 seconds"]')
      .first();
    const btn = timerContainer.locator('.recipe-timer-btn');
    const resetBtn = timerContainer.locator('.recipe-timer-reset');
    const label = timerContainer.locator('.timer-label');

    // Start and run for 2 seconds
    await btn.click();
    await page.clock.fastForward(2000);
    await expect(label).toHaveText('0:03');

    // Click reset
    await resetBtn.click();

    // Verify it is back to default
    await expect(label).toHaveText('5 seconds');
    await expect(timerContainer).not.toHaveClass(/has-started/);
    await expect(timerContainer).not.toHaveClass(/is-running/);
    await expect(resetBtn).toBeHidden();
  });
});
