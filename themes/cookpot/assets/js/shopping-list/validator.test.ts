import { describe, expect, test } from 'vitest';
import { validateIngredient } from './validator';
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
});
