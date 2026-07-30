import { describe, expect, test } from 'vitest';
import { ValidateRequiredFieldsStep } from './ValidateRequiredFieldsStep';

describe('ValidateRequiredFieldsStep', () => {
  const step = new ValidateRequiredFieldsStep();

  test('returns validation error if recipe title is missing', () => {
    const result = step.process([{ title: '   ' }]);
    expect(result[0].errors).toHaveLength(1);
    expect(result[0].errors![0].field).toBe('title');
    expect(result[0].errors![0].message).toBe('Recipe title is required.');
  });

  test('returns no errors for valid title', () => {
    const result = step.process([{ title: 'Chocolate Chip Cookies' }]);
    expect(result[0].errors).toHaveLength(0);
  });
});
