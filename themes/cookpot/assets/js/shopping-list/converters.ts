import { getAdaptiveUnit } from '../scaler';
import { Ingredient, NoteItem, matchesConfig, ShoppingItem, ConverterContext, createNote, match } from './utils';
import { INGREDIENT_RULES, checkIsStaple } from './rules';

export { ShoppingItem, ConverterContext };

export interface ConverterStrategy {
  name: string;
  matches: (ctx: ConverterContext) => boolean;
  convert: (ctx: ConverterContext) => ShoppingItem | null;
}

// Define the strategies list
export const CONVERTERS: ConverterStrategy[] = [];

// Populate CONVERTERS dynamically from INGREDIENT_RULES
for (const rule of INGREDIENT_RULES) {
  if (rule.convert) {
    CONVERTERS.push({
      name: rule.name,
      matches: (ctx) => matchesConfig(ctx.restLower, rule.match),
      convert: rule.convert
    });
  }
}



// Fallback / Generic converters

// Cans
CONVERTERS.push({
  name: 'Cans',
  matches: ({ unitLower }) => unitLower.includes('can'),
  convert: ({ scaledQty, rest, isStaple }) => {
    const count = Math.ceil(scaledQty);
    return {
      qty: count,
      unit: getAdaptiveUnit(count, 'can'),
      rest,
      notes: {},
      isStaple
    };
  }
});

// Default Count Items
CONVERTERS.push({
  name: 'DefaultCountItems',
  matches: ({ unitLower }) => ['clove', 'small', 'large', 'medium'].some(u => unitLower.includes(u)),
  convert: ({ scaledQty, unit, rest, isStaple }) => {
    const count = Math.ceil(scaledQty);
    return {
      qty: count,
      unit: getAdaptiveUnit(count, unit),
      rest,
      notes: {},
      isStaple
    };
  }
});

// Volume to Package
CONVERTERS.push({
  name: 'VolumeToPackage',
  matches: ({ unitLower, isStaple }) => {
    if (isStaple) return false;
    return ['cup', 'tablespoon', 'tbsp', 'teaspoon', 'tsp', 'ounce', 'oz', 'ml'].some(u => unitLower.includes(u));
  },
  convert: ({ scaledQty, unit, restLower, rest, isStaple }) => {
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
      notes: createNote(scaledQty, unit),
      isStaple
    };
  }
});

/**
 * Converts a recipe ingredient item to its commercial shopping package representation
 * by running it through the registry of registered conversion strategies.
 */
export function convertIngredient(item: Ingredient): ShoppingItem {
  const isStaple = checkIsStaple(item.rest);

  if (!item.isScalable) {
    return { qty: null, unit: '', rest: item.rest, notes: {}, isStaple };
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
    notes: {},
    isStaple
  };
}

