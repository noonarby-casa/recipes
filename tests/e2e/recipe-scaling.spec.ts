import { test, expect } from '@playwright/test';

test.describe('Recipe Scaling E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Cozy Chickpea Curry page
    await page.goto('/chickpea-curry/');
  });

  test('should load the recipe page with default values', async ({ page }) => {
    // Check page title
    await expect(page.locator('.recipe-title-bar h1')).toContainText(
      'Cozy Chickpea Curry',
    );

    // Check default serving count (4 servings)
    const servingCount = page.locator('.servings-val');
    await expect(servingCount).toHaveText('4');

    // Check coconut milk initial quantity (1/2 cup)
    const coconutMilk = page
      .locator('.recipe-quantity', { hasText: 'cup' })
      .nth(0);
    // Since Cozy Chickpea Curry has "0.5 cup" for coconut milk, let's verify its initial text
    await expect(coconutMilk).toContainText('1/2');
  });

  test('should scale ingredients up when clicking the increment button', async ({
    page,
  }) => {
    const incBtn = page.locator('.inc-btn');
    const servingCount = page.locator('.servings-val');

    // Click increment button (4 -> 5 servings)
    await incBtn.click();
    await expect(servingCount).toHaveText('5');

    // 0.5 cup * 5/4 = 0.625 cup which is 5/8 cup
    const coconutMilk = page
      .locator('.recipe-quantity', { hasText: 'cup' })
      .nth(0);
    await expect(coconutMilk).toContainText('5/8');
  });

  test('should scale ingredients down when clicking the decrement button', async ({
    page,
  }) => {
    const decBtn = page.locator('.dec-btn');
    const servingCount = page.locator('.servings-val');

    // Click decrement button twice (4 -> 3 -> 2 servings)
    await decBtn.click();
    await decBtn.click();
    await expect(servingCount).toHaveText('2');

    // 0.5 cup * 2/4 = 0.25 cup which is 1/4 cup
    const coconutMilk = page
      .locator('.recipe-quantity', { hasText: 'cup' })
      .nth(0);
    await expect(coconutMilk).toContainText('1/4');
  });

  test('should pluralize egg on load', async ({ page }) => {
    await page.goto('/vegetable-fried-rice/');
    const eggIngredient = page.locator('.recipe-ingredient', {
      hasText: 'egg',
    });
    await expect(eggIngredient).toContainText('2 eggs, beaten');
  });

  test('should mount Svelte ToggleGroup components', async ({ page }) => {
    const shoppingToggle = page.locator('.shopping-view-toggle');
    await expect(shoppingToggle).toBeVisible();
    const toggleGroup = shoppingToggle.locator('.toggle-group');
    await expect(toggleGroup).toBeVisible();
    await expect(toggleGroup).toHaveCSS('display', 'flex');

    const toggleButtons = shoppingToggle.locator('.toggle-btn');
    await expect(toggleButtons).toHaveCount(2);
    await expect(toggleButtons.nth(0)).toContainText('Recipe');
    await expect(toggleButtons.nth(1)).toContainText('Shopping List');

    const fontControls = page.locator('.font-controls');
    await expect(fontControls).toBeVisible();
    const fontButtons = fontControls.locator('.toggle-btn');
    await expect(fontButtons).toHaveCount(3);
    await expect(fontButtons.nth(0)).toContainText('Smaller');
    await expect(fontButtons.nth(1)).toContainText('Default');
    await expect(fontButtons.nth(2)).toContainText('Larger');
  });

  test('should toggle active tab state and visibility on click', async ({
    page,
  }) => {
    const shoppingToggle = page.locator('.shopping-view-toggle');
    const shoppingBtn = shoppingToggle.locator('.toggle-btn').nth(1);

    // Initial state: recipe ingredients list visible
    const recipeList = page.locator('.recipe-ingredients-list');
    const shoppingWrapper = page.locator('.shopping-list-wrapper');
    await expect(recipeList).toBeVisible();
    await expect(shoppingWrapper).toBeHidden();

    // Click "Shopping List"
    await shoppingBtn.click();

    // Verification: shopping list wrapper is now visible, recipe ingredients list is hidden
    await expect(shoppingWrapper).toBeVisible();
    await expect(recipeList).toBeHidden();
  });
});
