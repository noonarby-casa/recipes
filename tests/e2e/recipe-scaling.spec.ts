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
    const servingCount = page.locator('#recipe-serving-count');
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
    const incBtn = page.locator('#recipe-inc-btn');
    const servingCount = page.locator('#recipe-serving-count');

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
    const decBtn = page.locator('#recipe-dec-btn');
    const servingCount = page.locator('#recipe-serving-count');

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
});
