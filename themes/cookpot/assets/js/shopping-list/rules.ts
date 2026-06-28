import { getAdaptiveUnit } from '../scaler';
import { StringMatchConfig, ShoppingItem, ConverterContext, matchesConfig, isVolumeUnit, adjustDescriptionPlurality, getSingularUnit, buildMapKey, createNote, match, hasUnit, range, replaceTerms } from './utils';
import { STAPLES } from './config';

export interface IngredientRule {
  name: string;
  match: StringMatchConfig;
  isStaple?: boolean | ((qty: number | null, unit: string) => boolean);
  getIngredientKey?: (unit: string, prep: string, baseKey: string) => string;
  getShoppingItemKey?: (unit: string, restLower: string) => string | undefined;
  convert?: (ctx: ConverterContext) => ShoppingItem | null;
}



export const INGREDIENT_RULES: IngredientRule[] = [
  // 1. Garlic
  {
    name: 'garlic',
    match: { match: 'garlic', excludeIf: ['powder', 'salt'] },
    isStaple: false,
    getIngredientKey: (unit, prep, baseKey) => {
      if (prep === 'minced') {
        return `${baseKey}_minced`;
      }
      return baseKey;
    },
    convert: ({ scaledQty, unit, unitLower, restLower, prepLower, isStaple }) => {
      if (prepLower === 'minced') {
        return {
          qty: scaledQty,
          unit: getAdaptiveUnit(scaledQty, unit),
          rest: 'minced garlic',
          notes: {},
          isStaple: true
        };
      }

      const isHeadOrBulb = matchesConfig([unitLower, restLower], { match: ['head', 'bulb'] });

      if (isHeadOrBulb) {
        const count = Math.ceil(scaledQty);
        return {
          qty: count,
          unit: getAdaptiveUnit(count, 'head'),
          rest: 'garlic',
          notes: {},
          isStaple
        };
      }

      if (!hasUnit(unitLower, ['clove'])) return null;

      const count = Math.ceil(scaledQty / 10);
      return {
        qty: count,
        unit: getAdaptiveUnit(count, 'head'),
        rest: 'garlic',
        notes: createNote(scaledQty, unit || 'clove', 'approx. 10 cloves/head'),
        isStaple
      };
    }
  },

  // 2. Ginger
  {
    name: 'ginger',
    match: { match: 'ginger', excludeIf: ['powder', 'ground', 'dry', 'dried'] },
    isStaple: false,
    convert: ({ scaledQty, unit, unitLower, isStaple }) => {
      if (!hasUnit(unitLower, ['teaspoon', 'tsp', 'tablespoon', 'tbsp', 'inch', 'piece', 'knob', 'ounce', 'oz'])) return null;
      return {
        qty: 1,
        unit: 'root',
        rest: 'ginger',
        notes: createNote(scaledQty, unit || 'teaspoon'),
        isStaple
      };
    }
  },

  // 3. Lemons
  {
    name: 'lemon',
    match: { match: 'lemon', excludeIf: ['extract', 'grass', 'pepper'] },
    isStaple: false,
    getShoppingItemKey: (unit, restLower) => {
      const normUnit = getSingularUnit(unit);
      if (normUnit === 'lemon' || matchesConfig(restLower, { match: 'lemon', excludeIf: ['extract', 'grass', 'pepper'] })) {
        return '_lemons';
      }
      return undefined;
    },
    convert: ({ scaledQty, unit, unitLower, restLower, rest, isStaple }): ShoppingItem | null => {
      if (restLower.includes('zest')) {
        const count = Math.ceil(match(unitLower, [
          [['tablespoon', 'tbsp'], scaledQty],
          [['teaspoon', 'tsp'], scaledQty / 3]
        ], scaledQty));
        return {
          qty: count,
          unit: '',
          rest: getAdaptiveUnit(count, 'lemon'),
          notes: createNote(scaledQty, unit || 'tablespoon', '', 'zest'),
          isStaple,
          parts: { zest: count }
        };
      }

      if (!isStaple && isVolumeUnit(unitLower)) {
        const tbsp = match(unitLower, [
          [['cup'], scaledQty * 16],
          [['teaspoon', 'tsp'], scaledQty / 3],
          [['ounce', 'oz'], scaledQty * 2],
          [['ml'], scaledQty * 0.067]
        ], scaledQty);

        const count = Math.ceil(tbsp / 3);
        return {
          qty: count,
          unit: '',
          rest: getAdaptiveUnit(count, 'lemon'),
          notes: createNote(scaledQty, unit, '1 lemon = ~3 tbsp juice', 'juice'),
          isStaple,
          parts: { juice: count }
        };
      }

      if (hasUnit(unitLower, ['lemon'])) {
        const count = Math.ceil(scaledQty);
        return {
          qty: count,
          unit: '',
          rest: adjustDescriptionPlurality(count, rest, 'lemon'),
          notes: {},
          isStaple
        };
      }

      return null;
    }
  },

  // 4. Limes
  {
    name: 'lime',
    match: { match: 'lime', excludeIf: ['leaf', 'leaves', 'extract'] },
    isStaple: false,
    getShoppingItemKey: (unit, restLower) => {
      const normUnit = getSingularUnit(unit);
      if (normUnit === 'lime' || matchesConfig(restLower, { match: 'lime', excludeIf: ['leaf', 'leaves', 'extract'] })) {
        return '_limes';
      }
      return undefined;
    },
    convert: ({ scaledQty, unit, unitLower, restLower, rest, isStaple }): ShoppingItem | null => {
      if (restLower.includes('zest')) {
        const count = Math.ceil(match(unitLower, [
          [['tablespoon', 'tbsp'], scaledQty],
          [['teaspoon', 'tsp'], scaledQty / 3]
        ], scaledQty));
        return {
          qty: count,
          unit: '',
          rest: getAdaptiveUnit(count, 'lime'),
          notes: createNote(scaledQty, unit || 'tablespoon', '', 'zest'),
          isStaple,
          parts: { zest: count }
        };
      }

      if (!isStaple && isVolumeUnit(unitLower)) {
        const tbsp = match(unitLower, [
          [['cup'], scaledQty * 16],
          [['teaspoon', 'tsp'], scaledQty / 3],
          [['ounce', 'oz'], scaledQty * 2],
          [['ml'], scaledQty * 0.067]
        ], scaledQty);

        const count = Math.ceil(tbsp / 2);
        return {
          qty: count,
          unit: '',
          rest: getAdaptiveUnit(count, 'lime'),
          notes: createNote(scaledQty, unit, '1 lime = ~2 tbsp juice', 'juice'),
          isStaple,
          parts: { juice: count }
        };
      }

      if (hasUnit(unitLower, ['lime'])) {
        const count = Math.ceil(scaledQty);
        return {
          qty: count,
          unit: '',
          rest: adjustDescriptionPlurality(count, rest, 'lime'),
          notes: {},
          isStaple
        };
      }

      return null;
    }
  },

  // 5. Butter
  {
    name: 'butter',
    match: {
      match: 'butter',
      excludeIf: [
        'peanut', 'almond', 'beans', 'milk', 'squash',
        'butternut', 'lettuce', 'pickles'
      ]
    },
    isStaple: (qty, unit) => {
      if (unit === 'stick' || unit === 'sticks') {
        return qty !== null && qty < 4;
      }
      return true;
    },
    convert: ({ scaledQty, unit, unitLower, isStaple }) => {
      const butterUnits = ['cup', 'tablespoon', 'tbsp', 'pound', 'lb', 'ounce', 'oz'];
      if (!hasUnit(unitLower, butterUnits)) return null;

      const cups = match(unitLower, [
        [['tablespoon', 'tbsp'], scaledQty / 16],
        [['pound', 'lb'], scaledQty * 2],
        [['ounce', 'oz'], scaledQty / 8]
      ], scaledQty);

      const count = Math.ceil(cups * 2);

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
        notes: createNote(scaledQty, displayUnit, explanation),
        isStaple
      };
    }
  },

  // 6. Onion
  {
    name: 'onion',
    match: { match: 'onion', excludeIf: ['powder', 'salt', 'green', 'spring', 'pearl'] },
    isStaple: false,
    convert: ({ scaledQty, unitLower, rest, isStaple }) => {
      if (!hasUnit(unitLower, ['cup'])) return null;
      const count = Math.ceil(scaledQty);
      return {
        qty: count,
        unit: getAdaptiveUnit(count, 'onion'),
        rest,
        notes: createNote(scaledQty, 'cup', '1 onion = ~1 cup chopped'),
        isStaple
      };
    }
  },

  // 7. Coconut Milk
  {
    name: 'coconut milk',
    match: { match: 'coconut milk' },
    isStaple: false,
    convert: ({ scaledQty, unit, unitLower, isStaple }) => {
      const count = Math.ceil(match(unitLower, [
        [['cup'], scaledQty / 1.7],
        [['ounce', 'oz'], scaledQty / 13.5]
      ], scaledQty));
      return {
        qty: count,
        unit: getAdaptiveUnit(count, 'can'),
        rest: 'coconut milk',
        notes: unitLower.includes('can') ? {} : createNote(scaledQty, unit || 'cup'),
        isStaple
      };
    }
  },

  // 8. Cabbage
  {
    name: 'cabbage',
    match: { match: 'cabbage' },
    isStaple: false,
    convert: ({ scaledQty, unit, unitLower, rest, isStaple }) => {
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
        notes: createNote(scaledQty, unit || 'gram'),
        isStaple
      };
    }
  },

  // 9. Scallions / Green Onions
  {
    name: 'scallions',
    match: { match: ['scallion', 'spring onion', 'green onion'] },
    isStaple: false,
    convert: ({ scaledQty, unit, unitLower, isStaple }) => {
      const count = Math.ceil(match(unitLower, [
        [['cup'], scaledQty * 2],
        [['gram', 'g'], scaledQty / 90],
        [['ounce', 'oz'], scaledQty / 3]
      ], scaledQty / 6));
      return {
        qty: count,
        unit: getAdaptiveUnit(count, 'bundle'),
        rest: 'scallions (green onions)',
        notes: createNote(scaledQty, unit || 'scallion'),
        isStaple
      };
    }
  },

  // 10. Half-Pint Liquids
  {
    name: 'half-pint liquids',
    match: { match: ['sour cream', 'ricotta'] },
    isStaple: false,
    convert: ({ scaledQty, unitLower, rest, isStaple }) => {
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
        notes: createNote(scaledQty, 'cup'),
        isStaple
      };
    }
  },

  // 11. Pint-Minimum Liquids
  {
    name: 'pint-minimum liquids',
    match: { match: ['broth', 'stock', 'milk', 'heavy cream', 'whipping cream', 'yogurt'] },
    isStaple: false,
    convert: ({ scaledQty, unitLower, rest, isStaple }) => {
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
        notes: createNote(scaledQty, 'cup'),
        isStaple
      };
    }
  },

  // 12. Dry Pasta
  {
    name: 'dry pasta',
    match: { match: ['pasta', 'macaroni', 'spaghetti', 'penne', 'noodle', 'noodles', 'fettuccine', 'linguine', 'lasagna'] },
    isStaple: false,
    convert: ({ scaledQty, unit, unitLower, rest, isStaple }) => {
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
        notes: createNote(scaledQty, unit, explanation),
        isStaple
      };
    }
  },

  // 13. Egg Yolks
  {
    name: 'egg yolks',
    match: { match: 'egg yolk' },
    isStaple: false,
    convert: ({ scaledQty, unit, rest, isStaple }) => {
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
        notes: createNote(scaledQty, unit || 'large', '', 'egg yolk'),
        isStaple
      };
    }
  }
];

export function findRule(rest: string): IngredientRule | undefined {
  const restLower = rest.toLowerCase();
  return INGREDIENT_RULES.find(rule => matchesConfig(restLower, rule.match));
}

export function checkIsStaple(rest: string): boolean {
  const restLower = rest.toLowerCase();
  const rule = findRule(restLower);
  if (rule && rule.isStaple !== undefined) {
    if (typeof rule.isStaple === 'function') {
      return true;
    }
    return rule.isStaple;
  }
  return STAPLES.some(entry => matchesConfig(restLower, entry));
}

export function getIngredientKey(unit: string, rest: string, prep: string): string {
  const baseKey = buildMapKey(unit, rest);
  const rule = findRule(rest);
  if (rule && rule.getIngredientKey) {
    return rule.getIngredientKey(unit, prep, baseKey);
  }
  return baseKey;
}

export function getShoppingItemKey(unit: string, rest: string): string {
  const restLower = rest.toLowerCase().trim();
  const rule = findRule(restLower);
  if (rule && rule.getShoppingItemKey) {
    const key = rule.getShoppingItemKey(unit, restLower);
    if (key !== undefined) {
      return key;
    }
  }
  return buildMapKey(unit, rest);
}


