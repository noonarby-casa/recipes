import { getAdaptiveUnit, formatCookingNumber } from '../scaler';
import { checkIsStaple, Ingredient, NoteItem, matchesConfig, StringMatchConfig, isVolumeUnit, adjustDescriptionPlurality } from './utils';

export interface ConverterContext {
  scaledQty: number;
  unit: string;
  unitLower: string;
  rest: string;
  restLower: string;
  prep: string;
  prepLower: string;
  isStaple: boolean;
}

export interface ShoppingItem {
  qty: number | null;
  unit: string;
  rest: string;
  note: NoteItem[];
  isStaple: boolean;
  parts?: { [partName: string]: number | undefined };
}

export interface ConverterStrategy {
  name: string;
  matches: (ctx: ConverterContext) => boolean;
  convert: (ctx: ConverterContext) => ShoppingItem | null;
}

// Define the strategies list
export const CONVERTERS: ConverterStrategy[] = [];

/**
 * Helper function to register a converter strategy in the registry.
 */
function registerConverter(
  name: string,
  matches: (ctx: ConverterContext) => boolean,
  convert: (ctx: ConverterContext) => ShoppingItem | null
): void {
  CONVERTERS.push({ name, matches, convert });
}

/**
 * Helper to construct structured note arrays in strategy converters.
 */
function createNote(qty: number | null, unit: string, explanation = '', rest = ''): NoteItem[] {
  const adaptiveUnit = qty !== null ? getAdaptiveUnit(qty, unit) : unit;
  const adaptiveRest = qty !== null && rest ? getAdaptiveUnit(qty, rest) : rest;
  return [{ prefix: '', qty, unit: adaptiveUnit, rest: adaptiveRest, explanation }];
}

/**
 * Checks if a unit matches any of the specified keywords.
 */
function hasUnit(unitLower: string, keywords: string[]): boolean {
  return keywords.some(k => unitLower.includes(k));
}

/**
 * Searches a list of keyword groups and returns the mapped value for the first group
 * that has any keyword as a substring of the target string. Returns defaultValue if no match is found.
 */
function match<T>(
  str: string,
  mappings: [string[], T][],
  defaultValue: T
): T {
  for (const [keywords, value] of mappings) {
    if (keywords.some(k => str.includes(k))) {
      return value;
    }
  }
  return defaultValue;
}

/**
 * Searches a list of numeric limit thresholds (ordered ascending) and returns the mapped value
 * for the first limit that is greater than or equal to the target value. Returns defaultValue if no limit matches.
 */
function range<T>(
  val: number,
  mappings: [number, T][],
  defaultValue: T
): T {
  for (const [limit, value] of mappings) {
    if (val <= limit) {
      return value;
    }
  }
  return defaultValue;
}

/**
 * Replaces occurrences of terms specified in a key-value mapping within the given text.
 * The keys are matched case-insensitively using word boundaries.
 */
function replaceTerms(text: string, replacements: Record<string, string>): string {
  let result = text;
  for (const [pattern, replacement] of Object.entries(replacements)) {
    const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
    result = result.replace(regex, replacement);
  }
  return result;
}

// 1. Minced Garlic Jar
registerConverter('MincedGarlicJar',
  ({ restLower, prepLower }) => restLower.includes('garlic') && prepLower === 'minced',
  ({ scaledQty, unit }) => ({
    qty: scaledQty,
    unit: getAdaptiveUnit(scaledQty, unit),
    rest: 'minced garlic',
    note: [],
    isStaple: true
  })
);

// 2. Garlic Cloves / Heads
registerConverter('Garlic',
  ({ restLower }) => matchesConfig(restLower, { match: 'garlic', excludeIf: ['powder', 'salt'] }),
  ({ scaledQty, unit, unitLower, restLower, isStaple }) => {
    const isHeadOrBulb = matchesConfig([unitLower, restLower], { match: ['head', 'bulb'] });

    if (isHeadOrBulb) {
      const count = Math.ceil(scaledQty);
      return {
        qty: count,
        unit: getAdaptiveUnit(count, 'head'),
        rest: 'garlic',
        note: [],
        isStaple
      };
    }

    if (!hasUnit(unitLower, ['clove'])) return null;

    const count = Math.ceil(scaledQty / 10);
    return {
      qty: count,
      unit: getAdaptiveUnit(count, 'head'),
      rest: 'garlic',
      note: createNote(scaledQty, unit || 'clove', 'approx. 10 cloves/head'),
      isStaple
    };
  }
);

// 3. Ginger Root
registerConverter('Ginger',
  ({ restLower }) => matchesConfig(restLower, { match: 'ginger', excludeIf: ['powder', 'ground', 'dry', 'dried'] }),
  ({ scaledQty, unit, unitLower, isStaple }) => {
    if (!hasUnit(unitLower, ['teaspoon', 'tsp', 'tablespoon', 'tbsp', 'inch', 'piece', 'knob', 'ounce', 'oz'])) return null;

    // Fresh ginger is sold as a whole rhizome (root), which is always large enough
    // for recipe scale quantities. We buy 1 root and note the scaled quantity needed.
    return {
      qty: 1,
      unit: 'root',
      rest: 'ginger',
      note: createNote(scaledQty, unit || 'teaspoon'),
      isStaple
    };
  }
);

// 4. Lemon Zest
registerConverter('LemonZest',
  ({ restLower }) => restLower.includes('lemon') && restLower.includes('zest'),
  ({ scaledQty, unit, unitLower, isStaple }) => {
    const count = Math.ceil(match(unitLower, [
      [['tablespoon', 'tbsp'], scaledQty],
      [['teaspoon', 'tsp'], scaledQty / 3]
    ], scaledQty));
    return {
      qty: count,
      unit: '',
      rest: getAdaptiveUnit(count, 'lemon'),
      note: createNote(scaledQty, unit || 'tablespoon', '', 'zest'),
      isStaple,
      parts: { zest: count }
    };
  }
);

// 5. Lime Zest
registerConverter('LimeZest',
  ({ restLower }) => restLower.includes('lime') && restLower.includes('zest'),
  ({ scaledQty, unit, unitLower, isStaple }) => {
    const count = Math.ceil(match(unitLower, [
      [['tablespoon', 'tbsp'], scaledQty],
      [['teaspoon', 'tsp'], scaledQty / 3]
    ], scaledQty));
    return {
      qty: count,
      unit: '',
      rest: getAdaptiveUnit(count, 'lime'),
      note: createNote(scaledQty, unit || 'tablespoon', '', 'zest'),
      isStaple,
      parts: { zest: count }
    };
  }
);

// 6. Lemon Juice
registerConverter('LemonJuice',
  ({ restLower, isStaple }) => !isStaple && matchesConfig(restLower, { match: 'lemon', excludeIf: ['grass', 'pepper', 'extract', 'zest'] }),
  ({ scaledQty, unit, unitLower, isStaple }) => {
    if (!isVolumeUnit(unitLower)) return null;

    const tbsp = match(unitLower, [
      [['cup'], scaledQty * 16],
      [['teaspoon', 'tsp'], scaledQty / 3],
      [['ounce', 'oz'], scaledQty * 2],
      [['ml'], scaledQty * 0.067]
    ], scaledQty);

    const count = Math.ceil(tbsp / 3);
    return {
      qty: count,
      unit: getAdaptiveUnit(count, 'lemon'),
      rest: 'for juice',
      note: createNote(scaledQty, unit, '1 lemon = ~3 tbsp juice', 'juice'),
      isStaple,
      parts: { juice: count }
    };
  }
);

// 6.5. Whole Lemons
registerConverter('LemonWhole',
  ({ restLower, isStaple }) => !isStaple && matchesConfig(restLower, { match: 'lemon', excludeIf: ['grass', 'pepper', 'extract', 'zest'] }),
  ({ scaledQty, unitLower, rest, isStaple }) => {
    if (!hasUnit(unitLower, ['lemon'])) return null;

    const count = Math.ceil(scaledQty);
    return {
      qty: count,
      unit: '',
      rest: adjustDescriptionPlurality(count, rest, 'lemon'),
      note: [],
      isStaple
    };
  }
);

// 7. Lime Juice
registerConverter('LimeJuice',
  ({ restLower, isStaple }) => !isStaple && matchesConfig(restLower, { match: 'lime', excludeIf: ['leaf', 'leaves', 'extract', 'zest'] }),
  ({ scaledQty, unit, unitLower, isStaple }) => {
    if (!isVolumeUnit(unitLower)) return null;

    const tbsp = match(unitLower, [
      [['cup'], scaledQty * 16],
      [['teaspoon', 'tsp'], scaledQty / 3],
      [['ounce', 'oz'], scaledQty * 2],
      [['ml'], scaledQty * 0.067]
    ], scaledQty);

    const count = Math.ceil(tbsp / 2);
    return {
      qty: count,
      unit: getAdaptiveUnit(count, 'lime'),
      rest: 'for juice',
      note: createNote(scaledQty, unit, '1 lime = ~2 tbsp juice', 'juice'),
      isStaple,
      parts: { juice: count }
    };
  }
);

// 7.5. Whole Limes
registerConverter('LimeWhole',
  ({ restLower, isStaple }) => !isStaple && matchesConfig(restLower, { match: 'lime', excludeIf: ['leaf', 'leaves', 'extract', 'zest'] }),
  ({ scaledQty, unitLower, rest, isStaple }) => {
    if (!hasUnit(unitLower, ['lime'])) return null;

    const count = Math.ceil(scaledQty);
    return {
      qty: count,
      unit: '',
      rest: adjustDescriptionPlurality(count, rest, 'lime'),
      note: [],
      isStaple
    };
  }
);

// 8. Butter
registerConverter('Butter',
  ({ restLower }) => matchesConfig(restLower, { match: 'butter', excludeIf: ['peanut', 'almond', 'beans', 'milk', 'squash', 'butternut', 'lettuce', 'pickles'] }),
  ({ scaledQty, unit, unitLower, isStaple }) => {
    const butterUnits = ['cup', 'tablespoon', 'tbsp', 'pound', 'lb', 'ounce', 'oz'];
    if (!hasUnit(unitLower, butterUnits)) return null;

    const cups = match(unitLower, [
      [['tablespoon', 'tbsp'], scaledQty / 16],
      [['pound', 'lb'], scaledQty * 2],
      [['ounce', 'oz'], scaledQty / 8]
    ], scaledQty);

    const count = Math.ceil(cups * 2);
    const finalIsStaple = count >= 4 ? false : isStaple;

    const { displayUnit, explanation } = match(unitLower, [
      [['tablespoon', 'tbsp'], { displayUnit: 'tbsp', explanation: '1 stick = 8 tbsp' }],
      [['teaspoon', 'tsp'], { displayUnit: 'tsp', explanation: '1 stick = 24 tsp' }],
      [['pound', 'lb'], { displayUnit: 'lb', explanation: '1 stick = 1/4 lb' }],
      [['ounce', 'oz'], { displayUnit: 'oz', explanation: '1 stick = 4 oz' }]
    ], { displayUnit: unit, explanation: '1 stick = 1/2 cup' });

    return {
      qty: count,
      unit: getAdaptiveUnit(count, 'stick'),
      rest: 'butter',
      note: createNote(scaledQty, displayUnit, explanation),
      isStaple: finalIsStaple
    };
  }
);

// 9. Onion
registerConverter('Onion',
  ({ restLower }) => matchesConfig(restLower, { match: 'onion', excludeIf: ['powder', 'salt', 'green', 'spring', 'pearl'] }),
  ({ scaledQty, unitLower, rest, isStaple }) => {
    if (!hasUnit(unitLower, ['cup'])) return null;

    const count = Math.ceil(scaledQty);
    return {
      qty: count,
      unit: getAdaptiveUnit(count, 'onion'),
      rest,
      note: createNote(scaledQty, 'cup', '1 onion = ~1 cup chopped'),
      isStaple
    };
  }
);

// 10. Coconut Milk
registerConverter('CoconutMilk',
  ({ restLower }) => restLower.includes('coconut milk'),
  ({ scaledQty, unit, unitLower, isStaple }) => {
    const count = Math.ceil(match(unitLower, [
      [['cup'], scaledQty / 1.7],
      [['ounce', 'oz'], scaledQty / 13.5]
    ], scaledQty));
    return {
      qty: count,
      unit: getAdaptiveUnit(count, 'can'),
      rest: 'coconut milk',
      note: unitLower.includes('can') ? [] : createNote(scaledQty, unit || 'cup'),
      isStaple
    };
  }
);

// 11. Cabbage
registerConverter('Cabbage',
  ({ restLower }) => restLower.includes('cabbage'),
  ({ scaledQty, unit, unitLower, rest, isStaple }) => {
    const count = Math.ceil(match(unitLower, [
      [['gram', 'g'], scaledQty / 900],
      [['ounce', 'oz'], scaledQty / 32],
      [['pound', 'lb'], scaledQty / 2],
      [['cup'], scaledQty / 8]
    ], scaledQty));
    return {
      qty: count,
      unit: getAdaptiveUnit(count, 'head'),
      rest,
      note: createNote(scaledQty, unit || 'gram'),
      isStaple
    };
  }
);

// 12. Scallions / Green Onions
registerConverter('Scallions',
  ({ restLower }) => matchesConfig(restLower, { match: ['scallion', 'spring onion', 'green onion'] }),
  ({ scaledQty, unit, unitLower, isStaple }) => {
    const count = Math.ceil(match(unitLower, [
      [['cup'], scaledQty * 2],
      [['gram', 'g'], scaledQty / 90],
      [['ounce', 'oz'], scaledQty / 3]
    ], scaledQty / 6));
    return {
      qty: count,
      unit: getAdaptiveUnit(count, 'bundle'),
      rest: 'scallions (green onions)',
      note: createNote(scaledQty, unit || 'scallion'),
      isStaple
    };
  }
);

// 13. Half-Pint Liquids (sour cream, ricotta)
registerConverter('HalfPintLiquids',
  ({ restLower }) => matchesConfig(restLower, { match: ['sour cream', 'ricotta'] }),
  ({ scaledQty, unitLower, rest, isStaple }) => {
    if (!hasUnit(unitLower, ['cup'])) return null;

    const count = Math.ceil(scaledQty / 4);
    const { qty, unit } = range(scaledQty, [
      [1, { qty: 1, unit: 'half-pint (8 oz)' }],
      [2, { qty: 1, unit: 'pint (16 oz)' }],
      [4, { qty: 1, unit: 'quart (32 oz)' }]
    ], { qty: count, unit: getAdaptiveUnit(count, 'quart (32 oz)') });

    return {
      qty,
      unit,
      rest,
      note: createNote(scaledQty, 'cup'),
      isStaple
    };
  }
);

// 14. Pint-Minimum Liquids (broth, stock, milk, heavy cream, whipping cream, yogurt)
registerConverter('PintMinimumLiquids',
  ({ restLower }) => matchesConfig(restLower, { match: ['broth', 'stock', 'milk', 'heavy cream', 'whipping cream', 'yogurt'] }),
  ({ scaledQty, unitLower, rest, isStaple }) => {
    if (!hasUnit(unitLower, ['cup'])) return null;

    const fallbackCount = Math.ceil(scaledQty / 4);
    const { qty, unit } = range(scaledQty, [
      [2, { qty: 1, unit: 'pint (16 fl oz)' }],
      [4, { qty: 1, unit: 'quart (32 fl oz)' }]
    ], { qty: fallbackCount, unit: getAdaptiveUnit(fallbackCount, 'quart (32 fl oz)') });

    return {
      qty,
      unit,
      rest,
      note: createNote(scaledQty, 'cup'),
      isStaple
    };
  }
);

// 15. Dry Pasta
registerConverter('DryPasta',
  ({ restLower }) => matchesConfig(restLower, { match: ['pasta', 'macaroni', 'spaghetti', 'penne', 'noodle', 'noodles', 'fettuccine', 'linguine', 'lasagna'] }),
  ({ scaledQty, unit, unitLower, rest, isStaple }) => {
    const pastaUnits = ['ounce', 'ounces', 'oz', 'pound', 'pounds', 'lb', 'lbs', 'gram', 'grams', 'g'];
    if (!hasUnit(unitLower, pastaUnits)) return null;

    const { factor, explanation } = match(unitLower, [
      [['ounce', 'oz'], { factor: 1 / 16, explanation: '1 box = 16 oz' }],
      [['gram', 'g'], { factor: 1 / 453.592, explanation: '1 box = 454 g' }]
    ], { factor: 1, explanation: '1 box = 1 lb' });

    const count = Math.ceil(scaledQty * factor);
    return {
      qty: count,
      unit: getAdaptiveUnit(count, 'box'),
      rest,
      note: createNote(scaledQty, unit, explanation),
      isStaple
    };
  }
);

// 16. Cans
registerConverter('Cans',
  ({ unitLower }) => unitLower.includes('can'),
  ({ scaledQty, rest, isStaple }) => {
    const count = Math.ceil(scaledQty);
    return {
      qty: count,
      unit: getAdaptiveUnit(count, 'can'),
      rest,
      note: [],
      isStaple
    };
  }
);

// 17. Egg Yolks
registerConverter('EggYolks',
  ({ restLower }) => restLower.includes('egg yolk'),
  ({ scaledQty, unit, rest, isStaple }) => {
    const count = Math.ceil(scaledQty);
    const cleanedRest = replaceTerms(rest, {
      'egg yolk': 'egg',
      'egg yolks': 'egg'
    });
    const finalRest = adjustDescriptionPlurality(count, cleanedRest, 'egg');
    return {
      qty: count,
      unit: getAdaptiveUnit(count, unit),
      rest: finalRest,
      note: createNote(scaledQty, unit || 'large', '', 'egg yolk'),
      isStaple
    };
  }
);

// 18. Default Count Items
registerConverter('DefaultCountItems',
  ({ unitLower }) => hasUnit(unitLower, ['clove', 'small', 'large', 'medium']),
  ({ scaledQty, unit, rest, isStaple }) => {
    const count = Math.ceil(scaledQty);
    return {
      qty: count,
      unit: getAdaptiveUnit(count, unit),
      rest,
      note: [],
      isStaple
    };
  }
);

// 19. Volume to Package
registerConverter('VolumeToPackage',
  ({ unitLower, isStaple }) => {
    if (isStaple) return false;
    return ['cup', 'tablespoon', 'tbsp', 'teaspoon', 'tsp', 'ounce', 'oz', 'ml'].some(u => unitLower.includes(u));
  },
  ({ scaledQty, unit, restLower, rest, isStaple }) => {
    const purchaseUnit = match(restLower, [
      [['paste', 'sauce', 'butter', 'jam', 'jelly', 'spread', 'mayo', 'mustard', 'curry', 'pesto', 'tahini', 'jar'], 'jar'],
      [['aminos', 'oil', 'vinegar', 'syrup', 'honey', 'juice', 'extract', 'liquid', 'bottle'], 'bottle'],
      [['crumb', 'cracker'], 'box'],
      [['flour', 'sugar', 'chip', 'seed', 'nut', 'rice', 'pasta', 'noodle', 'oat', 'meal', 'powder', 'bag', 'box'], 'package'],
      [['cream', 'sour cream', 'yogurt', 'cheese', 'tub', 'container'], 'container']
    ], 'package');

    return {
      qty: 1,
      unit: purchaseUnit,
      rest,
      note: createNote(scaledQty, unit),
      isStaple
    };
  }
);

/**
 * Converts a recipe ingredient item to its commercial shopping package representation
 * by running it through the registry of registered conversion strategies.
 */
export function convertIngredient(item: Ingredient): ShoppingItem {
  const isStaple = checkIsStaple(item.rest);

  if (!item.isScalable) {
    return { qty: null, unit: '', rest: item.rest, note: [], isStaple };
  }

  const { scaledQty, unit, rest, prep } = item;
  const restLower = rest.toLowerCase();
  const unitLower = unit.toLowerCase();
  const prepLower = prep.toLowerCase();
  const context: ConverterContext = { scaledQty, unit, unitLower, rest, restLower, prep, prepLower, isStaple };

  for (const strategy of CONVERTERS) {
    if (strategy.matches(context)) {
      const result = strategy.convert(context);
      if (result) return result;
    }
  }

  return {
    qty: scaledQty,
    unit: getAdaptiveUnit(scaledQty, unit),
    rest,
    note: [],
    isStaple
  };
}
