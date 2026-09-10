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
    const addMonBtn = page.locator('.empty-slot-box').first();
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

    const addMonBtn = page.locator('.empty-slot-box').first();
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

test.describe('Meal Planner custom recipes Mon-Fri workflow', () => {
  test('creates a 5-day meal plan with custom recipes Monday through Friday', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // Navigate to a fixed Monday 5-day work week plan in edit mode
    await page.goto('/plan/?d=2026-08-24&w=5&m=e');

    // Clear any existing plan if present
    const clearBtn = page.locator('#clear-plan-btn');
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
    }

    const customDishes = [
      { dayIndex: 0, title: 'Monday Protein Smoothie' },
      { dayIndex: 1, title: 'Tuesday Chicken Wrap' },
      { dayIndex: 2, title: 'Wednesday Grain Bowl' },
      { dayIndex: 3, title: 'Thursday Veggie Stir Fry' },
      { dayIndex: 4, title: 'Friday Homemade Pizza' },
    ];

    const dayColumns = page.locator(
      '.day-column:not(:has-text("Anytime / Supplemental"))',
    );
    await expect(dayColumns).toHaveCount(5);

    for (const { dayIndex, title } of customDishes) {
      const col = dayColumns.nth(dayIndex);
      const addBtn = col.locator('.empty-slot-box');
      await addBtn.click();

      const modal = page.locator('.selector-modal-content');
      await expect(modal).toBeVisible();

      // Fill custom dish title
      const titleInput = modal.locator('#custom-dish-title');
      await titleInput.fill(title);

      // Click "Add Custom Dish to Plan"
      const submitBtn = modal.locator('.add-custom-btn');
      await submitBtn.click();

      // Modal closes
      await expect(modal).toBeHidden();

      // Verify custom recipe card appears in the day column
      const recipeCard = col.locator('.recipe-card-unified');
      await expect(recipeCard).toBeVisible();
      await expect(recipeCard.locator('.recipe-card-title')).toContainText(
        title,
      );

      // Verify swap button is NOT present on custom recipe card
      const swapBtn = recipeCard.locator('.recipe-swap-btn');
      await expect(swapBtn).toHaveCount(0);
    }

    // Verify total 5 custom recipe cards rendered across Monday to Friday
    const allRecipeCards = page.locator('.day-column .recipe-card-unified');
    await expect(allRecipeCards).toHaveCount(5);
  });
});

test.describe('Meal Planner drag and drop interactions', () => {
  test('drags and drops a recipe card from Monday to Tuesday via pointer', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/plan/?d=2026-08-24&w=5&m=e');

    // Add a custom dish to Monday
    const mondayCol = page.locator('.day-column').first();
    await mondayCol.locator('.day-header-add-btn').click();

    const modal = page.locator('.selector-modal-content');
    await expect(modal).toBeVisible();
    await modal.locator('#custom-dish-title').fill('Tacos');
    await modal.locator('.add-custom-btn').click();
    await expect(modal).toBeHidden();

    const monCard = mondayCol.locator('.recipe-card-unified');
    await expect(monCard).toBeVisible();

    const tuesdayCol = page.locator('.day-column').nth(1);
    await expect(tuesdayCol.locator('.recipe-card-unified')).toHaveCount(0);

    // Get bounding boxes
    const cardHandle = monCard.locator('.recipe-drag-handle');
    const handleBox = await cardHandle.boundingBox();
    const tueBox = await tuesdayCol.boundingBox();

    expect(handleBox).not.toBeNull();
    expect(tueBox).not.toBeNull();

    if (handleBox && tueBox) {
      const startX = handleBox.x + handleBox.width / 2;
      const startY = handleBox.y + handleBox.height / 2;
      const targetX = tueBox.x + tueBox.width / 2;
      const targetY = tueBox.y + tueBox.height / 2;

      // Perform pointer drag
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(targetX, targetY, { steps: 10 });
      await page.mouse.up();
    }

    // Verify card moved from Monday to Tuesday
    await expect(mondayCol.locator('.recipe-card-unified')).toHaveCount(0);
    await expect(tuesdayCol.locator('.recipe-card-unified')).toHaveCount(1);
    await expect(tuesdayCol.locator('.recipe-card-title')).toContainText(
      'Tacos',
    );
  });

  test('drags and drops a recipe card by grabbing the recipe image with mouse', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/plan/?d=2026-08-24&w=5&m=e');

    const mondayCol = page.locator('.day-column').first();
    await mondayCol.locator('.day-header-add-btn').click();

    const modal = page.locator('.selector-modal-content');
    await modal.locator('#custom-dish-title').fill('Pasta Carbonara');
    await modal.locator('.add-custom-btn').click();
    await expect(modal).toBeHidden();

    const monCard = mondayCol.locator('.recipe-card-unified');
    await expect(monCard).toBeVisible();

    const tuesdayCol = page.locator('.day-column').nth(1);
    await expect(tuesdayCol.locator('.recipe-card-unified')).toHaveCount(0);

    // Grab image directly
    const imgEl = monCard.locator('.recipe-card-img');
    const imgBox = await imgEl.boundingBox();
    const tueBox = await tuesdayCol.boundingBox();

    expect(imgBox).not.toBeNull();
    expect(tueBox).not.toBeNull();

    if (imgBox && tueBox) {
      const startX = imgBox.x + imgBox.width / 2;
      const startY = imgBox.y + imgBox.height / 2;
      const targetX = tueBox.x + tueBox.width / 2;
      const targetY = tueBox.y + tueBox.height / 2;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(targetX, targetY, { steps: 12 });
      await page.mouse.up();
    }

    // Verify card successfully moved to Tuesday
    await expect(mondayCol.locator('.recipe-card-unified')).toHaveCount(0);
    await expect(tuesdayCol.locator('.recipe-card-unified')).toHaveCount(1);
    await expect(tuesdayCol.locator('.recipe-card-title')).toContainText(
      'Pasta Carbonara',
    );
  });

  test('drags and drops a recipe card via touch events on the image', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 800, height: 900 });
    await page.goto('/plan/?d=2026-08-24&w=5&m=e');

    const mondayCol = page.locator('.day-column').first();
    await mondayCol.locator('.day-header-add-btn').click();

    const modal = page.locator('.selector-modal-content');
    await modal.locator('#custom-dish-title').fill('Touch Burrito');
    await modal.locator('.add-custom-btn').click();
    await expect(modal).toBeHidden();

    const monCard = mondayCol.locator('.recipe-card-unified');
    await expect(monCard).toBeVisible();

    const tuesdayCol = page.locator('.day-column').nth(1);
    await expect(tuesdayCol.locator('.recipe-card-unified')).toHaveCount(0);

    const imgBox = await monCard.locator('.recipe-card-img').boundingBox();
    const tueBox = await tuesdayCol.boundingBox();

    expect(imgBox).not.toBeNull();
    expect(tueBox).not.toBeNull();

    if (imgBox && tueBox) {
      const startX = imgBox.x + imgBox.width / 2;
      const startY = imgBox.y + imgBox.height / 2;
      const targetX = tueBox.x + tueBox.width / 2;
      const targetY = tueBox.y + tueBox.height / 2;

      // Dispatch touch sequence on client
      await page.evaluate(
        ({ sX, sY, tX, tY }) => {
          const el = document.elementFromPoint(sX, sY);
          if (!el) {
            return;
          }

          const touch1 = new Touch({
            identifier: 1,
            target: el,
            clientX: sX,
            clientY: sY,
            pageX: sX,
            pageY: sY,
          });

          el.dispatchEvent(
            new TouchEvent('touchstart', {
              bubbles: true,
              cancelable: true,
              touches: [touch1],
              targetTouches: [touch1],
              changedTouches: [touch1],
            }),
          );

          // Step moves
          for (let i = 1; i <= 8; i++) {
            const curX = sX + ((tX - sX) * i) / 8;
            const curY = sY + ((tY - sY) * i) / 8;
            const moveTouch = new Touch({
              identifier: 1,
              target: el,
              clientX: curX,
              clientY: curY,
              pageX: curX,
              pageY: curY,
            });
            window.dispatchEvent(
              new TouchEvent('touchmove', {
                bubbles: true,
                cancelable: true,
                touches: [moveTouch],
                targetTouches: [moveTouch],
                changedTouches: [moveTouch],
              }),
            );
          }

          const endTouch = new Touch({
            identifier: 1,
            target: el,
            clientX: tX,
            clientY: tY,
            pageX: tX,
            pageY: tY,
          });
          window.dispatchEvent(
            new TouchEvent('touchend', {
              bubbles: true,
              cancelable: true,
              touches: [],
              targetTouches: [],
              changedTouches: [endTouch],
            }),
          );
        },
        { sX: startX, sY: startY, tX: targetX, tY: targetY },
      );
    }

    // Verify touch drag moved card to Tuesday
    await expect(mondayCol.locator('.recipe-card-unified')).toHaveCount(0);
    await expect(tuesdayCol.locator('.recipe-card-unified')).toHaveCount(1);
    await expect(tuesdayCol.locator('.recipe-card-title')).toContainText(
      'Touch Burrito',
    );
  });

  test('confirms vertical scrolling via gutters and card body without triggering drag', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 700 });
    await page.goto('/plan/?d=2026-08-24&w=5&m=e');

    const mondayCol = page.locator('.day-column').first();

    // Add 4 meals to Monday to make it overflow vertically
    for (let i = 1; i <= 4; i++) {
      await mondayCol.locator('.day-header-add-btn').click();
      const modal = page.locator('.selector-modal-content');
      await modal.locator('#custom-dish-title').fill(`Meal Item ${i}`);
      await modal.locator('.add-custom-btn').click();
      await expect(modal).toBeHidden();
    }

    const cards = mondayCol.locator('.recipe-card-unified');
    await expect(cards).toHaveCount(4);

    const scrollContainer = page.locator('#col-planner');

    // Check initial scrollTop
    const initialScroll = await scrollContainer.evaluate((el) => el.scrollTop);
    expect(initialScroll).toBe(0);

    // Scroll by mouse wheel over card title / body (not image)
    const cardTitle = cards.first().locator('.recipe-card-title');
    await cardTitle.hover();
    await page.mouse.wheel(0, 200);

    // Wait briefly for scroll to settle
    await page.waitForTimeout(200);

    const scrolledPos = await scrollContainer.evaluate((el) => el.scrollTop);
    expect(scrolledPos).toBeGreaterThan(0);

    // Verify no drag was accidentally initiated (trash zone stays hidden and no card is in dragging state)
    await expect(page.locator('#planner-trash-zone')).toBeHidden();
    await expect(page.locator('.drag-wrapper.is-dragging')).toHaveCount(0);
  });
});
