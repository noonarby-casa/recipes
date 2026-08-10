import { describe, expect, test } from 'vitest';
import { processShoppingList } from './pipeline';
import type { IngredientInput, StoreLayout } from '../types';
import { getSectionForCategory, STORE_LAYOUTS } from '../data/store-sections';

const mockGnocchiLayout: StoreLayout = {
  id: 'test-layout',
  name: 'Test Layout',
  sections: [],
  itemSizes: {
    'potato gnocchi': [[1, '17.5-oz package']],
    'jarred roasted red pepper': [[1, '8-oz jar']],
    'baby spinach': [[1, '8 oz bag']],
  },
};

describe('processShoppingList', () => {
  test('combines quantities of the same item', () => {
    const ingredients: IngredientInput[] = [
      { item: 'chicken thigh', qty: 2, unit: 'pound' },
      { item: 'chicken thigh', qty: 3, unit: 'pound' },
    ];

    const result = processShoppingList(ingredients);
    expect(result.buyItems).toHaveLength(1);
    expect(result.buyItems[0].item).toBe('chicken thigh');
    expect(result.buyItems[0].qty).toBe(5);
    expect(result.buyItems[0].unit).toBe('pounds');
  });

  test('handles volume units with no package size by moving them to notes', () => {
    const ingredients: IngredientInput[] = [
      { item: 'soy sauce', qty: 2, unit: 'tablespoon' },
      { item: 'soy sauce', qty: 2, unit: 'tablespoon' },
    ];

    const result = processShoppingList(ingredients);
    expect(result.buyItems).toHaveLength(1);
    expect(result.buyItems[0].qty).toBeNull();
    expect(result.buyItems[0].unit).toBe('');
    expect(result.buyItems[0].note?.sizeNote).toBe('4 tbsp needed');
  });

  test('separates staples and optional items', () => {
    const ingredients: IngredientInput[] = [
      { item: 'salt', qty: 1, unit: 'teaspoon' }, // staple
      { item: 'cilantro', qty: 1, unit: 'teaspoon', optional: true }, // optional
      { item: 'chicken thigh', qty: 4, unit: 'pcs' }, // buy item
    ];

    const result = processShoppingList(ingredients);
    expect(result.buyItems).toHaveLength(1);
    expect(result.buyItems[0].item).toBe('chicken thigh');

    expect(result.stapleItems).toHaveLength(1);
    expect(result.stapleItems[0].item).toBe('salt');

    expect(result.optionalItems).toHaveLength(1);
    expect(result.optionalItems[0].item).toBe('cilantro');
  });

  test('assigns store sections correctly', () => {
    const ingredients: IngredientInput[] = [
      { item: 'carrot', qty: 2 },
      { item: 'salmon', qty: 1, unit: 'lb' },
    ];

    const result = processShoppingList(ingredients);
    // Carrot should be in Produce
    const carrot = result.buyItems.find(
      (i) => i.item.toLowerCase() === 'carrot',
    );
    expect(carrot).toBeDefined();
    expect(carrot?.category).toBe('fresh-produce');
    expect(getSectionForCategory(carrot!.category, STORE_LAYOUTS[1]).id).toBe(
      'produce',
    );

    // Salmon should be in Meat
    const salmon = result.buyItems.find(
      (i) => i.item.toLowerCase() === 'salmon',
    );
    expect(salmon).toBeDefined();
    expect(salmon?.category).toBe('seafood');
    expect(getSectionForCategory(salmon!.category, STORE_LAYOUTS[1]).id).toBe(
      'meat',
    );
  });

  test('handles Chorizo Roasted Red Pepper Spinach Gnocchi recipe ingredients correctly', () => {
    const ingredients: IngredientInput[] = [
      { qty: 16, unit: 'ounce', item: 'potato gnocchi' },
      {
        qty: 0.5,
        unit: 'pound',
        item: 'chorizo',
        desc: 'fresh',
        prep: 'casing removed',
      },
      {
        qty: 0.75,
        unit: 'cup',
        item: 'jarred roasted red pepper',
        prep: 'chopped',
      },
      { qty: 1, unit: 'small', item: 'onion', prep: 'chopped' },
      { qty: 0.5, unit: 'teaspoon', item: 'kosher salt' },
      { qty: 3, unit: 'cup', item: 'baby spinach', prep: 'loosely packed' },
    ];

    const result = processShoppingList(ingredients, mockGnocchiLayout);

    // 1. Potato gnocchi -> 1 17.5-oz package (with sizeNote "16 oz needed")
    const gnocchi = result.buyItems.find((i) => i.item === 'potato gnocchi');
    expect(gnocchi).toBeDefined();
    expect(gnocchi?.qty).toBe(1);
    expect(gnocchi?.unit).toBe('17.5-oz package');
    expect(gnocchi?.note?.sizeNote).toBe('16 oz needed');

    // 2. Chorizo -> 0.5 pound (stays by weight)
    const chorizo = result.buyItems.find((i) => i.item === 'chorizo');
    expect(chorizo).toBeDefined();
    expect(chorizo?.qty).toBe(0.5);
    expect(chorizo?.unit).toBe('pound');
    expect(chorizo?.note?.sizeNote).toBeUndefined();

    // 3. Jarred roasted red pepper -> 1 8-oz jar (with sizeNote "6 oz needed")
    const pepper = result.buyItems.find(
      (i) => i.item === 'jarred roasted red pepper',
    );
    expect(pepper).toBeDefined();
    expect(pepper?.qty).toBe(1);
    expect(pepper?.unit).toBe('8-oz jar');
    expect(pepper?.note?.sizeNote).toBe('6 oz needed');

    // 4. Onion -> 1 yellow onion (not 1 cup onion)
    const onion = result.buyItems.find((i) => i.item === 'yellow onion');
    expect(onion).toBeDefined();
    expect(onion?.qty).toBe(1);
    expect(onion?.unit).toBe('yellow onion');
    expect(onion?.note?.sizeNote).toBeUndefined();

    // 5. Kosher salt -> identified as pantry staple
    const salt = result.stapleItems.find(
      (i) => i.item === 'salt' || i.item === 'kosher salt',
    );
    expect(salt).toBeDefined();

    // 6. Baby spinach -> 1 8 oz bag (with sizeNote "3 oz needed")
    const spinach = result.buyItems.find((i) => i.item === 'baby spinach');
    expect(spinach).toBeDefined();
    expect(spinach?.qty).toBe(1);
    expect(spinach?.unit).toBe('8 oz bag');
    expect(spinach?.note?.sizeNote).toBe('3 oz needed');
  });

  test('combining Indian Butter Chickpeas and Bolognese yields 2 yellow onions and 2 (15 oz) cans tomato sauce', () => {
    const ingredients: IngredientInput[] = [
      // Indian Butter Chickpeas ingredients
      {
        qty: 1.5,
        unit: 'cup',
        item: 'onion',
        prep: 'finely chopped',
        alt: { qty: 1, unit: 'large' },
        recipe: 'Indian Butter Chickpeas',
      },
      {
        qty: 1,
        unit: 'can (15-ounce)',
        item: 'tomato sauce',
        recipe: 'Indian Butter Chickpeas',
      },
      // Spicy Creamy Weeknight Bolognese ingredients
      {
        qty: 1,
        unit: 'large',
        item: 'onion',
        prep: 'finely chopped',
        recipe: 'Spicy Creamy Weeknight Bolognese',
      },
      {
        qty: 1,
        unit: 'can (15 ounces)',
        item: 'tomato sauce',
        recipe: 'Spicy Creamy Weeknight Bolognese',
      },
    ];

    const result = processShoppingList(ingredients, STORE_LAYOUTS[0]);

    // Case 1: 1.5 cups onion (alt: 1 large) + 1 large onion = 2 large yellow onions
    const onion = result.buyItems.find((i) => i.item === 'yellow onion');
    expect(onion).toBeDefined();
    expect(onion?.qty).toBe(2);

    // Case 2: 1 can (15-ounce) + 1 can (15 ounces) tomato sauce = 2 cans (15 oz) tomato sauce
    const tomatoSauce = result.buyItems.find((i) => i.item === 'tomato sauce');
    expect(tomatoSauce).toBeDefined();
    expect(tomatoSauce?.qty).toBe(2);
    expect(tomatoSauce?.unit).toBe('cans (15 oz)');
  });

  test('verifies edge cases for ingredient rule improvements', () => {
    const ingredients: IngredientInput[] = [
      { item: 'onion', qty: 1 },
      { item: 'yellow onion', qty: 2 },
      { item: 'red onion', qty: 1 },
      { item: 'red bell pepper', qty: 1 },
      { item: 'green bell pepper', qty: 1 },
      { item: 'vegetable broth', qty: 2, unit: 'cup' },
      { item: 'chicken broth', qty: 2, unit: 'cup' },
      { item: 'sesame oil', qty: 1, unit: 'tbsp' },
      { item: 'coconut oil', qty: 1, unit: 'tbsp' },
      { item: 'fresh basil', qty: 1, unit: 'bunch' },
      { item: 'dried basil', qty: 1, unit: 'tsp' },
      { item: 'minced garlic', qty: 1, unit: 'tbsp' },
      { item: 'garlic', qty: 3, unit: 'clove' },
    ];

    const result = processShoppingList(ingredients);

    // 1. Yellow onion (1 plain + 2 yellow = 3 yellow onions), red onion separate
    const yellowOnion = result.buyItems.find((i) => i.item === 'yellow onion');
    const redOnion = result.buyItems.find((i) => i.item === 'red onion');
    expect(yellowOnion).toBeDefined();
    expect(yellowOnion?.qty).toBe(3);
    expect(redOnion).toBeDefined();
    expect(redOnion?.qty).toBe(1);

    // 2. Bell peppers split by color
    const redPepper = result.buyItems.find((i) => i.item === 'red bell pepper');
    const greenPepper = result.buyItems.find(
      (i) => i.item === 'green bell pepper',
    );
    expect(redPepper).toBeDefined();
    expect(greenPepper).toBeDefined();

    // 3. Vegetable broth & chicken broth separate
    const vegBroth = result.buyItems.find((i) => i.item === 'vegetable broth');
    const chkBroth = result.buyItems.find((i) => i.item === 'chicken broth');
    expect(vegBroth).toBeDefined();
    expect(chkBroth).toBeDefined();

    // 4. Oils separate
    const sesameOil = result.buyItems.find((i) => i.item === 'sesame oil');
    const coconutOil = result.buyItems.find((i) => i.item === 'coconut oil');
    expect(sesameOil).toBeDefined();
    expect(coconutOil).toBeDefined();

    // 5. Fresh basil in buyItems, dried basil in stapleItems
    const freshBasil = result.buyItems.find((i) => i.item === 'fresh basil');
    const driedBasil = result.stapleItems.find((i) => i.item === 'dried basil');
    expect(freshBasil).toBeDefined();
    expect(driedBasil).toBeDefined();

    // 6. Minced garlic in buyItems, fresh garlic in buyItems
    const mincedG = result.buyItems.find((i) => i.item === 'minced garlic');
    const freshG = result.buyItems.find((i) => i.item === 'garlic');
    expect(mincedG).toBeDefined();
    expect(freshG).toBeDefined();
  });
});
