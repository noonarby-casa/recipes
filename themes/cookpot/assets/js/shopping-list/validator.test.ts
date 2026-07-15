import { describe, expect, test } from 'vitest';
import { validateIngredient, validateRecipe } from './validator';
import { IngredientInput } from './types';

describe('validateIngredient', () => {
  test('valid ingredient returns no errors', () => {
    const ing: IngredientInput = {
      qty: 2,
      unit: 'cup',
      item: 'baby spinach',
      desc: 'fresh',
      prep: 'chopped',
      alt: {
        qty: 1,
        unit: 'package',
        item: 'frozen spinach',
        prep: 'thawed',
      },
    };
    expect(validateIngredient(ing)).toEqual([]);
  });

  test('Q1: item and alt.item are identical (case-insensitive)', () => {
    const ing: IngredientInput = {
      item: 'Sage ',
      alt: {
        item: '  sage',
        qty: 0.5,
        unit: 'teaspoon',
      },
    };
    const errors = validateIngredient(ing);
    expect(errors).toHaveLength(1);
    expect(errors[0].severity).toBe('error');
    expect(errors[0].message).toContain('redundant alt.item can be removed');
  });

  test('Q2: item must be non-empty and non-whitespace', () => {
    const ing1: IngredientInput = { item: '' };
    const ing2: IngredientInput = { item: '   ' };
    expect(validateIngredient(ing1)).toHaveLength(1);
    expect(validateIngredient(ing2)).toHaveLength(1);
  });

  test('Q2: optional fields must not be empty or whitespace-only', () => {
    const ing: IngredientInput = {
      item: 'basil',
      desc: ' ',
      prep: '',
      unit: '   ',
    };
    const errors = validateIngredient(ing);
    expect(errors.length).toBeGreaterThanOrEqual(3);
    errors.forEach((e) => expect(e.severity).toBe('error'));
  });

  test('Q3: alt block cannot be empty', () => {
    const ing: IngredientInput = {
      item: 'basil',
      alt: {},
    };
    const errors = validateIngredient(ing);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('cannot be empty');
  });

  test('Q3: alt block cannot be completely redundant', () => {
    const ing: IngredientInput = {
      qty: 2,
      unit: 'cup',
      item: 'spinach',
      alt: {
        qty: 2,
        unit: 'cup',
      },
    };
    const errors = validateIngredient(ing);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('completely redundant');
  });

  test('Q4: scalar quantity must be positive', () => {
    const ing: IngredientInput = {
      item: 'spinach',
      qty: 0,
    };
    const errors = validateIngredient(ing);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('must be strictly greater than 0');
  });

  test('Q4: range quantity min must be less than max and both positive', () => {
    const ingInvalidRange: IngredientInput = {
      item: 'garlic',
      qty: [3, 2],
    };
    const errors = validateIngredient(ingInvalidRange);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('must be strictly less than max');

    const ingNegativeRange: IngredientInput = {
      item: 'garlic',
      qty: [-1, 2],
    };
    expect(validateIngredient(ingNegativeRange)[0].message).toContain(
      'strictly greater than 0',
    );
  });

  test('Q5: units must be lowercase', () => {
    const ing: IngredientInput = {
      item: 'flour',
      qty: 2,
      unit: 'Cup',
    };
    const errors = validateIngredient(ing);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('must be entirely lowercase');
  });

  test('Q5: unit plurals should trigger a warning', () => {
    const ing: IngredientInput = {
      item: 'flour',
      qty: 2,
      unit: 'cups',
    };
    const errors = validateIngredient(ing);
    expect(errors).toHaveLength(1);
    expect(errors[0].severity).toBe('warning');
    expect(errors[0].message).toContain(
      'is plural. Prefer standard singular form',
    );
  });

  test('forbids the word "about" in string fields', () => {
    const ing1: IngredientInput = {
      item: 'about 1 cup of chickpeas',
    };
    const ing2: IngredientInput = {
      item: 'chickpeas',
      desc: 'About 1 cup',
    };
    const ing3: IngredientInput = {
      item: 'chickpeas',
      prep: 'chopped, about 1/2 cup',
    };

    expect(validateIngredient(ing1)[0].message).toContain(
      'must not contain the word "about"',
    );
    expect(validateIngredient(ing2)[0].message).toContain(
      'must not contain the word "about"',
    );
    expect(validateIngredient(ing3)[0].message).toContain(
      'must not contain the word "about"',
    );
  });

  test('divided is a prep term, not a desc term', () => {
    const ing1: IngredientInput = {
      item: 'butter',
      desc: 'divided',
    };
    const ing2: IngredientInput = {
      item: 'butter',
      desc: 'divided usage',
    };
    const ing3: IngredientInput = {
      item: 'butter',
      alt: {
        item: 'oil',
        desc: 'divided',
      },
    };

    expect(validateIngredient(ing1)[0].message).toContain(
      'is a preparation term, not a descriptor',
    );
    expect(validateIngredient(ing2)[0].message).toContain(
      'is a preparation term, not a descriptor',
    );
    expect(validateIngredient(ing3)[0].message).toContain(
      'is a preparation term, not a descriptor',
    );
  });

  test('alt unit must not be same as unit, prefer range syntax', () => {
    const ing: IngredientInput = {
      item: 'butter',
      qty: 1,
      unit: 'cup',
      alt: {
        qty: 2,
        unit: 'cup',
      },
    };
    const errors = validateIngredient(ing);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain(
      'alt unit must not be same as unit, prefer range syntax',
    );

    // Piece/countable items with undefined units (representing same unit)
    const ingNoUnit: IngredientInput = {
      item: 'banana',
      qty: 1,
      alt: {
        qty: 2,
      },
    };
    const errorsNoUnit = validateIngredient(ingNoUnit);
    expect(errorsNoUnit).toHaveLength(1);
    expect(errorsNoUnit[0].message).toContain(
      'alt unit must not be same as unit, prefer range syntax',
    );

    // Substitution with same unit is allowed
    const ingSub: IngredientInput = {
      item: 'butter',
      qty: 1,
      unit: 'cup',
      alt: {
        qty: 1,
        unit: 'cup',
        item: 'margarine',
      },
    };
    expect(validateIngredient(ingSub)).toHaveLength(0);
  });

  test('"or" and parentheses are not allowed in item name', () => {
    const ingOr: IngredientInput = {
      item: 'butter or margarine',
    };
    const ingParen: IngredientInput = {
      item: 'butter (salted)',
    };
    const ingAltOr: IngredientInput = {
      item: 'milk',
      alt: {
        item: 'soy or almond milk',
      },
    };

    expect(validateIngredient(ingOr)[0].message).toContain(
      'must not contain "or" or parentheses',
    );
    expect(validateIngredient(ingParen)[0].message).toContain(
      'must not contain "or" or parentheses',
    );
    expect(validateIngredient(ingAltOr)[0].message).toContain(
      'must not contain "or" or parentheses',
    );
  });

  test('alt item must not match same canonical name as item through rules', () => {
    const ing: IngredientInput = {
      item: 'garlic',
      alt: {
        item: 'garlic clove',
      },
    };
    const errors = validateIngredient(ing);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('resolves to the same canonical item');
  });

  test('validateRecipe checks for duplicate items in same section and instructions references', () => {
    const recipe = {
      title: 'Test Recipe',
      ingredients: [
        {
          category: 'Sauce',
          items: [
            { item: 'olive oil', qty: 1, unit: 'tablespoon' },
            { item: 'oil', qty: 2, unit: 'tablespoon' },
            { item: 'garlic', qty: 1 },
            { item: 'garlic', qty: 2 },
          ],
        },
      ],
      instructions: 'Sauté the garlic and olive oil.',
    };

    const errors = validateRecipe(recipe);
    // Should have duplicate error for garlic, and unreferenced error for oil
    expect(
      errors.some((e) => e.message.includes('Duplicate item "garlic"')),
    ).toBe(true);
    expect(
      errors.some((e) =>
        e.message.includes('Ingredient "oil" is not referenced'),
      ),
    ).toBe(true);
    expect(
      errors.some((e) =>
        e.message.includes('Ingredient "olive oil" is not referenced'),
      ),
    ).toBe(false);
  });
});
