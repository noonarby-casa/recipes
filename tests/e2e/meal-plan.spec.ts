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

  test('should default to View Plan mode on mobile', async ({ page }) => {
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

test.describe('Meal Planner favorites filtering UX', () => {
  test('toggles favorites filter button in RecipeSelectorModal', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/plan/');

    // Switch to edit mode
    await page.click('#mode-edit-btn');

    // Click "Add Recipe" slot for Monday
    const addMonBtn = page.locator('.empty-slot-box[data-day="mon"]');
    await addMonBtn.click();

    // Verify recipe selector modal opens
    const modal = page.locator('.selector-modal-content');
    await expect(modal).toBeVisible();

    // Verify inline heart filter button exists
    const heartBtn = modal.locator('.recipe-favorite-filter-btn');
    await expect(heartBtn).toBeVisible();
    await expect(heartBtn).toHaveAttribute(
      'aria-label',
      'Filter favorites only',
    );

    // Click heart filter button to toggle favorites
    await heartBtn.click();
    await expect(heartBtn).toHaveClass(/is-favorite/);
    await expect(heartBtn).toHaveAttribute('aria-pressed', 'true');

    // Verify active filter notice banner mentions Favorites only
    const notice = modal.locator('.modal-tags-notice');
    await expect(notice).toContainText('Favorites only');
  });

  test('provides Show All Recipes action button when zero favorites match query', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/plan/?favorites=1');

    await page.click('#mode-edit-btn');

    const addMonBtn = page.locator('.empty-slot-box[data-day="mon"]');
    await addMonBtn.click();

    const modal = page.locator('.selector-modal-content');
    await expect(modal).toBeVisible();

    // Search for a non-matching query
    const searchInput = modal.locator('.modal-search-wrapper input');
    await searchInput.fill('NonexistentRecipeXYZ999');

    // Verify recovery empty state and "Show All Recipes" button appear
    const recoveryBtn = modal.locator('.clear-fav-filter-btn');
    await expect(recoveryBtn).toBeVisible();
    await expect(recoveryBtn).toContainText('Show All Recipes');

    // Click recovery button
    await recoveryBtn.click();

    // Verify heart button is no longer active
    const heartBtn = modal.locator('.recipe-favorite-filter-btn');
    await expect(heartBtn).not.toHaveClass(/is-favorite/);
  });
});
