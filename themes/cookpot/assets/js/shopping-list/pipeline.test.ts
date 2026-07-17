import { describe, expect, test } from 'vitest';
import { processShoppingList } from './pipeline';
import { IngredientInput } from './types';
import { getSectionForCategory, StoreLayout } from './store-sections';

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
    expect(getSectionForCategory(carrot!.category).id).toBe('produce');

    // Salmon should be in Meat
    const salmon = result.buyItems.find(
      (i) => i.item.toLowerCase() === 'salmon',
    );
    expect(salmon).toBeDefined();
    expect(salmon?.category).toBe('seafood');
    expect(getSectionForCategory(salmon!.category).id).toBe('meat');
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

    // 4. Onion -> 1 onion (not 1 cup onion)
    const onion = result.buyItems.find((i) => i.item === 'onion');
    expect(onion).toBeDefined();
    expect(onion?.qty).toBe(1);
    expect(onion?.unit).toBe('onion');
    expect(onion?.note?.sizeNote).toBeUndefined();

    // 5. Kosher salt -> identified as pantry staple
    const salt = result.stapleItems.find((i) => i.item === 'kosher salt');
    expect(salt).toBeDefined();

    // 6. Baby spinach -> 1 8 oz bag (with sizeNote "3 oz needed")
    const spinach = result.buyItems.find((i) => i.item === 'baby spinach');
    expect(spinach).toBeDefined();
    expect(spinach?.qty).toBe(1);
    expect(spinach?.unit).toBe('8 oz bag');
    expect(spinach?.note?.sizeNote).toBe('3 oz needed');
  });
});
