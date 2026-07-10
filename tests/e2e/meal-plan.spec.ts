import { test, expect } from '@playwright/test';

test.describe('Meal Planner default mode', () => {
  test('should default to View Plan mode on desktop', async ({ page }) => {
    // Set desktop viewport size
    await page.setViewportSize({ width: 1280, height: 800 });

    // Navigate to the meal plan page
    await page.goto('/plan/');

    // Check that View Plan tab button has both active and btn-brand classes
    const viewBtn = page.locator('#mode-view-btn');
    await expect(viewBtn).toHaveClass(/active/);
    await expect(viewBtn).toHaveClass(/btn-brand/);

    // Check that Edit Plan tab button does not have active or btn-brand classes
    const editBtn = page.locator('#mode-edit-btn');
    await expect(editBtn).not.toHaveClass(/active/);
    await expect(editBtn).not.toHaveClass(/btn-brand/);

    // Check that toolbar for view is visible and edit toolbar is hidden
    const toolbarView = page.locator('#toolbar-view');
    await expect(toolbarView).toBeVisible();
    const toolbarEdit = page.locator('#toolbar-edit');
    await expect(toolbarEdit).toBeHidden();

    // Check that shopping list column is hidden on desktop by default in View Plan mode
    const colShopping = page.locator('#col-shopping');
    await expect(colShopping).toBeHidden();
  });

  test('should default to View Plan mode on mobile', async ({
    page,
  }) => {
    // Set mobile viewport size
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to the meal plan page
    await page.goto('/plan/');

    // Check that View Plan tab button is active
    const viewBtn = page.locator('#mode-view-btn');
    await expect(viewBtn).toHaveClass(/active/);
    await expect(viewBtn).toHaveClass(/btn-brand/);

    // Check that shopping list column is hidden on mobile
    const colShopping = page.locator('#col-shopping');
    await expect(colShopping).toBeHidden();
  });
});
