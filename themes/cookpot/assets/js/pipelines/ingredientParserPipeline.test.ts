import { describe, expect, test } from 'vitest';
import {
  parseIngredientText,
  ParseRawTextStep,
} from './ingredientParserPipeline';

describe('ingredientParserPipeline', () => {
  test('parses simple quantity, unit, and item name using parseIngredientText', () => {
    const result = parseIngredientText('2 cups flour');
    expect(result.qty).toBe(2);
    expect(result.unit).toBe('cups');
    expect(result.item).toBe('flour');
  });

  test('ParseRawTextStep parses raw text into structured ingredient object', () => {
    const step = new ParseRawTextStep();
    const result = step.process([{ rawText: '1 lb chicken breast' }]);
    expect(result[0].parsed?.qty).toBe(1);
    expect(result[0].parsed?.unit).toBe('lb');
    expect(result[0].parsed?.item).toBe('chicken breast');
  });
});
