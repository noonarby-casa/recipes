import { describe, expect, test } from 'vitest';
import {
  getAdaptiveUnit,
  formatCookingNumber,
  pluralizeWord,
  singularizeWord,
  formatItemQuantity,
  formatRecipeIngredientHTML,
} from './units';

describe('getAdaptiveUnit', () => {
  test('returns empty string if unit is empty', () => {
    expect(getAdaptiveUnit(2, '')).toBe('');
    expect(getAdaptiveUnit(null, '')).toBe('');
  });

  test('returns original unit if quantity is null', () => {
    expect(getAdaptiveUnit(null, 'cup')).toBe('cup');
    expect(getAdaptiveUnit(null, 'cups')).toBe('cups');
  });

  test('pluralizes units when quantity is greater than 1', () => {
    expect(getAdaptiveUnit(2, 'cup')).toBe('cups');
    expect(getAdaptiveUnit(1.5, 'clove')).toBe('cloves');
    expect(getAdaptiveUnit(5, 'ounce')).toBe('ounces');
  });

  test('singularizes units when quantity is 1 or less', () => {
    expect(getAdaptiveUnit(1, 'cups')).toBe('cup');
    expect(getAdaptiveUnit(0.5, 'cloves')).toBe('clove');
    expect(getAdaptiveUnit(1, 'cup')).toBe('cup');
  });

  test('returns original unit if plural/singular mapping is not found', () => {
    expect(getAdaptiveUnit(2, 'dash')).toBe('dash');
    expect(getAdaptiveUnit(1, 'pinch')).toBe('pinch');
  });
});

describe('formatCookingNumber', () => {
  test('returns 0 for non-positive values', () => {
    expect(formatCookingNumber(0)).toBe('0');
    expect(formatCookingNumber(-1.5)).toBe('0');
  });

  test('rounds to whole numbers if close enough', () => {
    expect(formatCookingNumber(1.02)).toBe('1');
    expect(formatCookingNumber(0.98)).toBe('1');
  });

  test('formats standard culinary fractions', () => {
    expect(formatCookingNumber(0.25)).toBe('1/4');
    expect(formatCookingNumber(0.5)).toBe('1/2');
    expect(formatCookingNumber(0.75)).toBe('3/4');
    expect(formatCookingNumber(0.333)).toBe('1/3');
    expect(formatCookingNumber(0.667)).toBe('2/3');
    expect(formatCookingNumber(0.125)).toBe('1/8');
  });

  test('formats mixed fractions', () => {
    expect(formatCookingNumber(1.5)).toBe('1 1/2');
    expect(formatCookingNumber(2.25)).toBe('2 1/4');
    expect(formatCookingNumber(3.75)).toBe('3 3/4');
  });

  test('falls back to decimal formatting for non-standard increments', () => {
    expect(formatCookingNumber(1.56)).toBe('1.56');
    expect(formatCookingNumber(0.44)).toBe('0.44');
    expect(formatCookingNumber(2.81)).toBe('2.81');
  });
});

describe('pluralizeWord', () => {
  test('pluralizes singular words correctly', () => {
    expect(pluralizeWord('tablespoon')).toBe('tablespoons');
    expect(pluralizeWord('lime')).toBe('limes');
    expect(pluralizeWord('head')).toBe('heads');
    expect(pluralizeWord('peach')).toBe('peaches');
    expect(pluralizeWord('zucchini')).toBe('zucchinis');
  });

  test('keeps already pluralized words as-is', () => {
    expect(pluralizeWord('tablespoons')).toBe('tablespoons');
    expect(pluralizeWord('limes')).toBe('limes');
    expect(pluralizeWord('heads')).toBe('heads');
    expect(pluralizeWord('peaches')).toBe('peaches');
    expect(pluralizeWord('zucchinis')).toBe('zucchinis');
  });

  test('handles size prefixes correctly', () => {
    expect(pluralizeWord('large tablespoon')).toBe('large tablespoons');
    expect(pluralizeWord('medium lime')).toBe('medium limes');
    expect(pluralizeWord('small head')).toBe('small heads');
    expect(pluralizeWord('large tablespoons')).toBe('large tablespoons');
    expect(pluralizeWord('medium limes')).toBe('medium limes');
    expect(pluralizeWord('small heads')).toBe('small heads');
  });

  test('handles parenthesized suffixes correctly', () => {
    expect(pluralizeWord('can (15 oz)')).toBe('cans (15 oz)');
    expect(pluralizeWord('cans (15 oz)')).toBe('cans (15 oz)');
  });
});

describe('formatItemQuantity', () => {
  test('does not double pluralize units for qty > 1', () => {
    expect(formatItemQuantity(2, 'tablespoons', 'butter')).toEqual({
      qtyStr: '2 tablespoons',
      itemStr: 'butter',
    });
    expect(formatItemQuantity(2, '', 'lime')).toEqual({
      qtyStr: '2',
      itemStr: 'limes',
    });
    expect(formatItemQuantity(2, '', 'limes')).toEqual({
      qtyStr: '2',
      itemStr: 'limes',
    });
    expect(formatItemQuantity(2, 'heads', 'garlic')).toEqual({
      qtyStr: '2 heads',
      itemStr: 'garlic',
    });
  });

  test('forces collection items to be plural regardless of unit quantity', () => {
    expect(formatItemQuantity(1, 'can', 'black bean')).toEqual({
      qtyStr: '1 can',
      itemStr: 'black beans',
    });
    expect(formatItemQuantity(0.5, 'cup', 'Kalamata olive')).toEqual({
      qtyStr: '1/2 cup',
      itemStr: 'Kalamata olives',
    });
    expect(formatItemQuantity(1.5, 'tablespoons', 'coconut amino')).toEqual({
      qtyStr: '1 1/2 tablespoons',
      itemStr: 'coconut aminos',
    });
  });

  test('treats mass nouns as uncountable', () => {
    expect(formatItemQuantity(2, 'cups', 'flour')).toEqual({
      qtyStr: '2 cups',
      itemStr: 'flour',
    });
    expect(formatItemQuantity(0.5, 'cup', 'milk')).toEqual({
      qtyStr: '1/2 cup',
      itemStr: 'milk',
    });
  });

  test('scales size-only units and pluralizes/singularizes item', () => {
    expect(formatItemQuantity(3, 'large', 'egg')).toEqual({
      qtyStr: '3 large',
      itemStr: 'eggs',
    });
    expect(formatItemQuantity(1, 'large', 'eggs')).toEqual({
      qtyStr: '1 large',
      itemStr: 'egg',
    });
  });

  test('correctly handles user reported items', () => {
    expect(formatItemQuantity(8, '', 'green onion')).toEqual({
      qtyStr: '8',
      itemStr: 'green onions',
    });
    expect(formatItemQuantity(1.5, '', 'yellow onion')).toEqual({
      qtyStr: '1 1/2',
      itemStr: 'yellow onions',
    });
    expect(formatItemQuantity(3, '', 'red bell pepper')).toEqual({
      qtyStr: '3',
      itemStr: 'red bell peppers',
    });
    expect(formatItemQuantity(3, '', 'green bell pepper')).toEqual({
      qtyStr: '3',
      itemStr: 'green bell peppers',
    });
    expect(formatItemQuantity(3, '', 'jalapeño')).toEqual({
      qtyStr: '3',
      itemStr: 'jalapeños',
    });
    expect(formatItemQuantity(2, '', 'egg')).toEqual({
      qtyStr: '2',
      itemStr: 'eggs',
    });
    expect(formatItemQuantity(0.25, 'cup', 'almond')).toEqual({
      qtyStr: '1/4 cup',
      itemStr: 'almonds',
    });
    expect(formatItemQuantity(0.25, 'cup', 'sesame seed')).toEqual({
      qtyStr: '1/4 cup',
      itemStr: 'sesame seeds',
    });
  });
});

describe('singularizeWord', () => {
  test('singularizes plural words correctly', () => {
    expect(singularizeWord('tablespoons')).toBe('tablespoon');
    expect(singularizeWord('limes')).toBe('lime');
    expect(singularizeWord('heads')).toBe('head');
    expect(singularizeWord('peaches')).toBe('peach');
    expect(singularizeWord('zucchinis')).toBe('zucchini');
  });

  test('keeps already singular words as-is', () => {
    expect(singularizeWord('tablespoon')).toBe('tablespoon');
    expect(singularizeWord('lime')).toBe('lime');
  });

  test('handles size prefixes correctly', () => {
    expect(singularizeWord('large tablespoons')).toBe('large tablespoon');
    expect(singularizeWord('medium limes')).toBe('medium lime');
  });
});

describe('formatRecipeIngredientHTML', () => {
  test('formats standard recipe ingredients', () => {
    expect(formatRecipeIngredientHTML(12, '', 'corn tortilla', '', '')).toBe(
      '<span class="recipe-quantity" data-base-qty="12" data-unit="">12</span> corn tortillas',
    );
    expect(
      formatRecipeIngredientHTML(
        3,
        'medium',
        'carrot',
        '',
        'bias-cut into slices',
      ),
    ).toBe(
      '<span class="recipe-quantity" data-base-qty="3" data-unit="medium">3 medium</span> carrots, bias-cut into slices',
    );
  });

  test('formats ingredients with alternates', () => {
    expect(
      formatRecipeIngredientHTML(0.75, 'cup', 'scallion', '', 'thinly sliced', {
        qty: 1,
        unit: 'bunch',
      }),
    ).toBe(
      '<span class="recipe-quantity" data-base-qty="0.75" data-unit="cup">3/4 cup</span> scallions, thinly sliced (<span class="recipe-quantity" data-base-qty="1" data-unit="bunch">1 bunch</span>)',
    );
    expect(
      formatRecipeIngredientHTML(2, '', 'spring onion', '', 'sliced', {
        item: 'scallion',
      }),
    ).toBe(
      '<span class="recipe-quantity" data-base-qty="2" data-unit="">2</span> spring onions, sliced (or scallions)',
    );
  });

  test('formats ingredients with range quantities and range alternates', () => {
    // Range quantity as main
    expect(
      formatRecipeIngredientHTML([7, 8], 'ounce', 'summer squash', '', ''),
    ).toBe(
      '<span class="recipe-quantity" data-base-qty="7-8" data-unit="ounce">7-8 ounces</span> summer squash',
    );

    // Range quantity as alternate
    expect(
      formatRecipeIngredientHTML(4, '', 'summer squash', '', 'sliced', {
        qty: [7, 8],
        unit: 'ounce',
      }),
    ).toBe(
      '<span class="recipe-quantity" data-base-qty="4" data-unit="">4</span> summer squashes, sliced (<span class="recipe-quantity" data-base-qty="7-8" data-unit="ounce">7-8 ounces</span>)',
    );
  });
});
