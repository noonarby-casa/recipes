import { getAdaptiveUnit, formatCookingNumber } from '../scaler';
import { checkIsStaple } from './utils';

export interface ConverterContext {
  scaledQty: number;
  unit: string;
  rest: string;
  isMinced: boolean;
  nameLower: string;
  isStaple: boolean;
}

export interface ConvertedItem {
  qty: number | null;
  unit: string;
  rest: string;
  note: string;
  isStaple: boolean;
  juiceQty?: number;
  zestWholeQty?: number;
}

export interface ConverterStrategy {
  name: string;
  matches: (ctx: ConverterContext) => boolean;
  convert: (ctx: ConverterContext) => ConvertedItem | null | undefined;
}

// Define the strategies list
export const CONVERTERS: ConverterStrategy[] = [];

/**
 * Helper function to register a converter strategy in the registry.
 */
function registerConverter(
  name: string,
  matches: (ctx: ConverterContext) => boolean,
  convert: (ctx: ConverterContext) => ConvertedItem | null | undefined
): void {
  CONVERTERS.push({ name, matches, convert });
}

// 1. Minced Garlic Jar
registerConverter('MincedGarlicJar',
  ({ nameLower, unit, isMinced }) => nameLower.includes('garlic') && isMinced && !['clove', 'cloves'].some(u => unit.toLowerCase().includes(u)),
  ({ scaledQty, unit }) => ({
    qty: scaledQty,
    unit: getAdaptiveUnit(scaledQty, unit),
    rest: 'minced garlic',
    note: 'Pantry Staple',
    isStaple: true
  })
);

// 2. Garlic Cloves / Heads
registerConverter('Garlic',
  ({ nameLower }) => nameLower.includes('garlic') && !nameLower.includes('powder') && !nameLower.includes('salt'),
  ({ scaledQty, unit, rest, isStaple }) => {
    const nameLower = rest.toLowerCase();
    const isHeadOrBulb = nameLower.includes('head') || nameLower.includes('bulb');
    
    if (isHeadOrBulb) {
      const heads = Math.ceil(scaledQty);
      return {
        qty: heads,
        unit: heads === 1 ? 'head' : 'heads',
        rest: 'garlic',
        note: '',
        isStaple
      };
    }
    
    if (unit.toLowerCase().includes('clove') || unit === '') {
      const heads = Math.ceil(scaledQty / 10);
      return {
        qty: heads,
        unit: heads === 1 ? 'head' : 'heads',
        rest: 'garlic',
        note: `approx. 10 cloves/head (need ${formatCookingNumber(scaledQty)} ${getAdaptiveUnit(scaledQty, unit || 'clove')})`,
        isStaple
      };
    }
    return null;
  }
);

// 3. Ginger Root
registerConverter('Ginger',
  ({ nameLower }) => nameLower.includes('ginger') && !nameLower.includes('powder') && !nameLower.includes('ground') && !nameLower.includes('dry') && !nameLower.includes('dried'),
  ({ scaledQty, unit, isStaple }) => {
    const lowerUnit = unit.toLowerCase();
    if (['teaspoon', 'teaspoons', 'tsp', 'tablespoon', 'tablespoons', 'tbsp', 'inch', 'inches', 'piece', 'pieces', 'knob', 'knobs', 'oz', 'ounce', 'ounces'].some(u => lowerUnit.includes(u) || lowerUnit === '')) {
      return {
        qty: 1,
        unit: 'root',
        rest: 'ginger',
        note: `need ${formatCookingNumber(scaledQty)} ${getAdaptiveUnit(scaledQty, unit || 'teaspoon')}`,
        isStaple
      };
    }
    return null;
  }
);

// 4. Lemon Zest
registerConverter('LemonZest',
  ({ nameLower }) => nameLower.includes('lemon') && nameLower.includes('zest'),
  ({ scaledQty, unit, isStaple }) => {
    let lemonsCount = 1;
    const lowerUnit = unit.toLowerCase();
    if (['tablespoon', 'tablespoons', 'tbsp'].some(u => lowerUnit.includes(u))) {
      lemonsCount = Math.ceil(scaledQty);
    } else if (['teaspoon', 'teaspoons', 'tsp'].some(u => lowerUnit.includes(u))) {
      lemonsCount = Math.ceil(scaledQty / 3);
    } else {
      lemonsCount = Math.ceil(scaledQty);
    }
    return {
      qty: lemonsCount,
      unit: '',
      rest: lemonsCount === 1 ? 'lemon' : 'lemons',
      note: `need ${formatCookingNumber(scaledQty)} ${getAdaptiveUnit(scaledQty, unit || 'tablespoon')} zest`,
      isStaple,
      juiceQty: 0,
      zestWholeQty: lemonsCount
    };
  }
);

// 5. Lime Zest
registerConverter('LimeZest',
  ({ nameLower }) => nameLower.includes('lime') && nameLower.includes('zest'),
  ({ scaledQty, unit, isStaple }) => {
    let limesCount = 1;
    const lowerUnit = unit.toLowerCase();
    if (['tablespoon', 'tablespoons', 'tbsp'].some(u => lowerUnit.includes(u))) {
      limesCount = Math.ceil(scaledQty);
    } else if (['teaspoon', 'teaspoons', 'tsp'].some(u => lowerUnit.includes(u))) {
      limesCount = Math.ceil(scaledQty / 3);
    } else {
      limesCount = Math.ceil(scaledQty);
    }
    return {
      qty: limesCount,
      unit: '',
      rest: limesCount === 1 ? 'lime' : 'limes',
      note: `need ${formatCookingNumber(scaledQty)} ${getAdaptiveUnit(scaledQty, unit || 'tablespoon')} zest`,
      isStaple,
      juiceQty: 0,
      zestWholeQty: limesCount
    };
  }
);

// 6. Lemon Juice / Whole Lemons
registerConverter('Lemon',
  ({ nameLower, isStaple }) => nameLower.includes('lemon') && !isStaple && !nameLower.includes('grass') && !nameLower.includes('pepper') && !nameLower.includes('extract') && !nameLower.includes('zest'),
  ({ scaledQty, unit, rest, isStaple }) => {
    const lowerUnit = unit.toLowerCase();
    if (['tablespoon', 'tablespoons', 'tbsp', 'teaspoon', 'teaspoons', 'tsp', 'cup', 'cups', 'ounce', 'ounces', 'oz', 'ml'].some(u => lowerUnit.includes(u))) {
      let tbsp = scaledQty;
      if (lowerUnit.includes('cup')) tbsp = scaledQty * 16;
      if (lowerUnit.includes('teaspoon') || lowerUnit.includes('tsp')) tbsp = scaledQty / 3;
      if (lowerUnit.includes('ounce') || lowerUnit.includes('oz')) tbsp = scaledQty * 2;
      if (lowerUnit.includes('ml')) tbsp = scaledQty * 0.067;

      const lemons = Math.ceil(tbsp / 3);
      return {
        qty: lemons,
        unit: lemons === 1 ? 'lemon' : 'lemons',
        rest: 'for juice',
        note: `need ${formatCookingNumber(scaledQty)} ${getAdaptiveUnit(scaledQty, unit)} juice (1 lemon = ~3 tbsp juice)`,
        isStaple,
        juiceQty: lemons,
        zestWholeQty: 0
      };
    } else if (lowerUnit.includes('lemon') || lowerUnit === '') {
      const lemons = Math.ceil(scaledQty);
      let finalRest = rest.trim();
      if (lemons > 1) {
        finalRest = finalRest.replace(/\blemon\b/gi, 'lemons');
      } else {
        finalRest = finalRest.replace(/\blemons\b/gi, 'lemon');
      }
      if (!finalRest) {
        finalRest = lemons === 1 ? 'lemon' : 'lemons';
      }
      return {
        qty: lemons,
        unit: '',
        rest: finalRest,
        note: '',
        isStaple,
        juiceQty: 0,
        zestWholeQty: lemons
      };
    }
    return null;
  }
);

// 7. Lime Juice / Whole Limes
registerConverter('Lime',
  ({ nameLower, isStaple }) => nameLower.includes('lime') && !isStaple && !nameLower.includes('leaf') && !nameLower.includes('leaves') && !nameLower.includes('extract') && !nameLower.includes('zest'),
  ({ scaledQty, unit, rest, isStaple }) => {
    const lowerUnit = unit.toLowerCase();
    if (['tablespoon', 'tablespoons', 'tbsp', 'teaspoon', 'teaspoons', 'tsp', 'cup', 'cups', 'ounce', 'ounces', 'oz', 'ml'].some(u => lowerUnit.includes(u))) {
      let tbsp = scaledQty;
      if (lowerUnit.includes('cup')) tbsp = scaledQty * 16;
      if (lowerUnit.includes('teaspoon') || lowerUnit.includes('tsp')) tbsp = scaledQty / 3;
      if (lowerUnit.includes('ounce') || lowerUnit.includes('oz')) tbsp = scaledQty * 2;
      if (lowerUnit.includes('ml')) tbsp = scaledQty * 0.067;

      const limes = Math.ceil(tbsp / 2);
      return {
        qty: limes,
        unit: limes === 1 ? 'lime' : 'limes',
        rest: 'for juice',
        note: `need ${formatCookingNumber(scaledQty)} ${getAdaptiveUnit(scaledQty, unit)} juice (1 lime = ~2 tbsp juice)`,
        isStaple,
        juiceQty: limes,
        zestWholeQty: 0
      };
    } else if (lowerUnit.includes('lime') || lowerUnit === '') {
      const limes = Math.ceil(scaledQty);
      let finalRest = rest.trim();
      if (limes > 1) {
        finalRest = finalRest.replace(/\blime\b/gi, 'limes');
      } else {
        finalRest = finalRest.replace(/\blimes\b/gi, 'lime');
      }
      if (!finalRest) {
        finalRest = limes === 1 ? 'lime' : 'limes';
      }
      return {
        qty: limes,
        unit: '',
        rest: finalRest,
        note: '',
        isStaple,
        juiceQty: 0,
        zestWholeQty: limes
      };
    }
    return null;
  }
);

// 8. Butter
registerConverter('Butter',
  ({ nameLower }) => nameLower.includes('butter') && !['peanut', 'almond', 'beans', 'milk', 'squash', 'butternut', 'lettuce', 'pickles'].some(b => nameLower.includes(b)),
  ({ scaledQty, unit, isStaple }) => {
    const lowerUnit = unit.toLowerCase();
    if (['cup', 'cups', 'tablespoon', 'tablespoons', 'tbsp', 'pound', 'pounds', 'lb', 'lbs', 'ounce', 'ounces', 'oz'].some(u => lowerUnit.includes(u))) {
      let cups = scaledQty;
      if (lowerUnit.includes('tablespoon') || lowerUnit.includes('tbsp')) cups = scaledQty / 16;
      if (lowerUnit.includes('pound') || lowerUnit.includes('lb')) cups = scaledQty * 2;
      if (lowerUnit.includes('ounce') || lowerUnit.includes('oz')) cups = scaledQty / 8;

      const sticks = Math.ceil(cups * 2);
      const finalIsStaple = sticks >= 4 ? false : isStaple;

      let displayUnit = unit;
      let explanation = '1 stick = 1/2 cup';
      if (lowerUnit.includes('tablespoon') || lowerUnit.includes('tbsp')) {
        displayUnit = 'tbsp';
        explanation = '1 stick = 8 tbsp';
      } else if (lowerUnit.includes('teaspoon') || lowerUnit.includes('tsp')) {
        displayUnit = 'tsp';
        explanation = '1 stick = 24 tsp';
      } else if (lowerUnit.includes('pound') || lowerUnit.includes('lb')) {
        displayUnit = 'lb';
        explanation = '1 stick = 1/4 lb';
      } else if (lowerUnit.includes('ounce') || lowerUnit.includes('oz')) {
        displayUnit = 'oz';
        explanation = '1 stick = 4 oz';
      }

      return {
        qty: sticks,
        unit: sticks === 1 ? 'stick' : 'sticks',
        rest: 'butter',
        note: `need ${formatCookingNumber(scaledQty)} ${displayUnit} (${explanation})`,
        isStaple: finalIsStaple
      };
    }
    return null;
  }
);

// 9. Onion
registerConverter('Onion',
  ({ nameLower }) => nameLower.includes('onion') && !['powder', 'salt', 'green', 'spring', 'pearl'].some(o => nameLower.includes(o)),
  ({ scaledQty, unit, rest, isStaple }) => {
    if (unit.toLowerCase().includes('cup')) {
      const onions = Math.ceil(scaledQty);
      return {
        qty: onions,
        unit: onions === 1 ? 'onion' : 'onions',
        rest,
        note: `1 onion = ~1 cup chopped (need ${formatCookingNumber(scaledQty)} cups)`,
        isStaple
      };
    }
    return null;
  }
);

// 10. Coconut Milk
registerConverter('CoconutMilk',
  ({ nameLower }) => nameLower.includes('coconut milk'),
  ({ scaledQty, unit, isStaple }) => {
    let cansCount = 1;
    const lowerUnit = unit.toLowerCase();
    if (lowerUnit.includes('cup')) {
      cansCount = Math.ceil(scaledQty / 1.7);
    } else if (lowerUnit.includes('oz') || lowerUnit.includes('ounce')) {
      cansCount = Math.ceil(scaledQty / 13.5);
    } else {
      cansCount = Math.ceil(scaledQty);
    }
    return {
      qty: cansCount,
      unit: cansCount === 1 ? 'can' : 'cans',
      rest: 'coconut milk',
      note: lowerUnit.includes('can') ? '' : `need ${formatCookingNumber(scaledQty)} ${getAdaptiveUnit(scaledQty, unit || 'cup')}`,
      isStaple
    };
  }
);

// 11. Cabbage
registerConverter('Cabbage',
  ({ nameLower }) => nameLower.includes('cabbage'),
  ({ scaledQty, unit, rest, isStaple }) => {
    let headsCount = 1;
    const lowerUnit = unit.toLowerCase();
    if (lowerUnit.includes('g') || lowerUnit.includes('gram')) {
      headsCount = Math.ceil(scaledQty / 900);
    } else if (lowerUnit.includes('oz') || lowerUnit.includes('ounce')) {
      headsCount = Math.ceil(scaledQty / 32);
    } else if (lowerUnit.includes('pound') || lowerUnit.includes('lb')) {
      headsCount = Math.ceil(scaledQty / 2);
    } else if (lowerUnit.includes('cup')) {
      headsCount = Math.ceil(scaledQty / 8);
    } else {
      headsCount = Math.ceil(scaledQty);
    }
    return {
      qty: headsCount,
      unit: headsCount === 1 ? 'head' : 'heads',
      rest,
      note: `need ${formatCookingNumber(scaledQty)} ${getAdaptiveUnit(scaledQty, unit || 'gram')}`,
      isStaple
    };
  }
);

// 12. Scallions / Green Onions
registerConverter('Scallions',
  ({ nameLower }) => ['scallion', 'spring onion', 'green onion'].some(s => nameLower.includes(s)),
  ({ scaledQty, unit, isStaple }) => {
    let bundlesCount = 1;
    const lowerUnit = unit.toLowerCase();
    if (lowerUnit.includes('cup')) {
      bundlesCount = Math.ceil(scaledQty * 2);
    } else if (lowerUnit.includes('g') || lowerUnit.includes('gram')) {
      bundlesCount = Math.ceil(scaledQty / 90);
    } else if (lowerUnit.includes('oz') || lowerUnit.includes('ounce')) {
      bundlesCount = Math.ceil(scaledQty / 3);
    } else {
      bundlesCount = Math.ceil(scaledQty / 6);
    }
    return {
      qty: bundlesCount,
      unit: bundlesCount === 1 ? 'bundle' : 'bundles',
      rest: 'scallions (green onions)',
      note: `need ${formatCookingNumber(scaledQty)} ${getAdaptiveUnit(scaledQty, unit || 'scallion')}`,
      isStaple
    };
  }
);

// 13. Half-Pint Liquids (sour cream, ricotta)
registerConverter('HalfPintLiquids',
  ({ nameLower }) => ['sour cream', 'ricotta'].some(liq => nameLower.includes(liq)),
  ({ scaledQty, unit, rest, isStaple }) => {
    const lowerUnit = unit.toLowerCase();
    if (lowerUnit.includes('cup')) {
      if (scaledQty <= 1) {
        return {
          qty: 1,
          unit: 'half-pint (8 oz)',
          rest,
          note: `need ${formatCookingNumber(scaledQty)} cup`,
          isStaple
        };
      } else if (scaledQty <= 2) {
        return {
          qty: 1,
          unit: 'pint (16 oz)',
          rest,
          note: `need ${formatCookingNumber(scaledQty)} cups`,
          isStaple
        };
      } else if (scaledQty <= 4) {
        return {
          qty: 1,
          unit: 'quart (32 oz)',
          rest,
          note: `need ${formatCookingNumber(scaledQty)} cups`,
          isStaple
        };
      } else {
        const quarts = Math.ceil(scaledQty / 4);
        return {
          qty: quarts,
          unit: quarts === 1 ? 'quart (32 oz)' : 'quarts (32 oz)',
          rest,
          note: `need ${formatCookingNumber(scaledQty)} cups`,
          isStaple
        };
      }
    }
    return null;
  }
);

// 14. Pint-Minimum Liquids (broth, stock, milk, heavy cream, whipping cream, yogurt)
registerConverter('PintMinimumLiquids',
  ({ nameLower }) => ['broth', 'stock', 'milk', 'heavy cream', 'whipping cream', 'yogurt'].some(liq => nameLower.includes(liq)),
  ({ scaledQty, unit, rest, isStaple }) => {
    const lowerUnit = unit.toLowerCase();
    if (lowerUnit.includes('cup')) {
      if (scaledQty <= 2) {
        return {
          qty: 1,
          unit: 'pint (16 fl oz)',
          rest,
          note: `need ${formatCookingNumber(scaledQty)} ${scaledQty <= 1 ? 'cup' : 'cups'}`,
          isStaple
        };
      } else if (scaledQty <= 4) {
        return {
          qty: 1,
          unit: 'quart (32 fl oz)',
          rest,
          note: `need ${formatCookingNumber(scaledQty)} cups`,
          isStaple
        };
      } else {
        const quarts = Math.ceil(scaledQty / 4);
        return {
          qty: quarts,
          unit: quarts === 1 ? 'quart (32 fl oz)' : 'quarts (32 fl oz)',
          rest,
          note: `need ${formatCookingNumber(scaledQty)} cups`,
          isStaple
        };
      }
    }
    return null;
  }
);

// 15. Dry Pasta
registerConverter('DryPasta',
  ({ nameLower }) => ['pasta', 'macaroni', 'spaghetti', 'penne', 'noodle', 'noodles', 'fettuccine', 'linguine', 'lasagna'].some(p => nameLower.includes(p)),
  ({ scaledQty, unit, rest, isStaple }) => {
    const lowerUnit = unit.toLowerCase();
    if (['ounce', 'ounces', 'oz', 'pound', 'pounds', 'lb', 'lbs', 'gram', 'grams', 'g'].some(u => lowerUnit.includes(u))) {
      let boxes = 1;
      let explanation = '1 box = 1 lb';
      if (lowerUnit.includes('ounce') || lowerUnit.includes('oz')) {
        boxes = Math.ceil(scaledQty / 16);
        explanation = '1 box = 16 oz';
      } else if (lowerUnit.includes('gram') || lowerUnit.includes('g')) {
        boxes = Math.ceil(scaledQty / 453.592);
        explanation = '1 box = 454 g';
      } else {
        boxes = Math.ceil(scaledQty);
      }
      return {
        qty: boxes,
        unit: boxes === 1 ? 'box' : 'boxes',
        rest,
        note: `need ${formatCookingNumber(scaledQty)} ${getAdaptiveUnit(scaledQty, unit)} (${explanation})`,
        isStaple
      };
    }
    return null;
  }
);

// 16. Cans
registerConverter('Cans',
  ({ unit }) => unit.toLowerCase().includes('can'),
  ({ scaledQty, rest, isStaple }) => {
    const cans = Math.ceil(scaledQty);
    return {
      qty: cans,
      unit: cans === 1 ? 'can' : 'cans',
      rest,
      note: '',
      isStaple
    };
  }
);

// 17. Egg Yolks
registerConverter('EggYolks',
  ({ nameLower }) => nameLower.includes('egg yolk'),
  ({ scaledQty, unit, rest, isStaple }) => {
    const rounded = Math.ceil(scaledQty);
    let finalRest = rest.trim();
    if (rounded > 1) {
      finalRest = finalRest.replace(/\begg yolks?\b/gi, 'eggs');
    } else {
      finalRest = finalRest.replace(/\begg yolks?\b/gi, 'egg');
    }
    return {
      qty: rounded,
      unit: getAdaptiveUnit(rounded, unit),
      rest: finalRest,
      note: `need ${formatCookingNumber(scaledQty)} ${getAdaptiveUnit(scaledQty, unit || 'large')} egg yolk${scaledQty > 1 ? 's' : ''}`,
      isStaple
    };
  }
);

// 18. Default Count Items
registerConverter('DefaultCountItems',
  ({ unit }) => unit === '' || ['clove', 'cloves', 'small', 'large', 'medium'].some(u => unit.toLowerCase().includes(u)),
  ({ scaledQty, unit, rest, isStaple }) => {
    const rounded = Math.ceil(scaledQty);
    return {
      qty: rounded,
      unit: getAdaptiveUnit(rounded, unit),
      rest,
      note: '',
      isStaple
    };
  }
);

// 19. Volume to Package
registerConverter('VolumeToPackage',
  ({ unit, isStaple }) => {
    if (isStaple) return false;
    const lowerUnit = unit.toLowerCase();
    return ['cup', 'cups', 'tablespoon', 'tablespoons', 'tbsp', 'teaspoon', 'teaspoons', 'tsp', 'ounce', 'ounces', 'oz', 'ml'].some(u => lowerUnit.includes(u));
  },
  ({ scaledQty, unit, rest, isStaple }) => {
    const nameLower = rest.toLowerCase();
    let purchaseUnit = 'package';
    let purchaseQty = 1;
    
    if (['paste', 'sauce', 'butter', 'jam', 'jelly', 'spread', 'mayo', 'mustard', 'curry', 'pesto', 'tahini', 'jar'].some(k => nameLower.includes(k))) {
      purchaseUnit = 'jar';
    } else if (['aminos', 'oil', 'vinegar', 'syrup', 'honey', 'juice', 'extract', 'liquid', 'bottle'].some(k => nameLower.includes(k))) {
      purchaseUnit = 'bottle';
    } else if (['crumb', 'cracker', 'flour', 'sugar', 'chip', 'seed', 'nut', 'rice', 'pasta', 'noodle', 'oat', 'meal', 'powder', 'bag', 'box'].some(k => nameLower.includes(k))) {
      purchaseUnit = (nameLower.includes('crumb') || nameLower.includes('cracker')) ? 'box' : 'package';
    } else if (['cream', 'sour cream', 'yogurt', 'cheese', 'tub', 'container'].some(k => nameLower.includes(k))) {
      purchaseUnit = 'container';
    }

    return {
      qty: purchaseQty,
      unit: purchaseUnit,
      rest,
      note: `need ${formatCookingNumber(scaledQty)} ${getAdaptiveUnit(scaledQty, unit)}`,
      isStaple
    };
  }
);

interface RawIngredientItem {
  scaledQty: number | null;
  unit: string;
  rest: string;
  isMinced: boolean;
}

/**
 * Converts a recipe ingredient item to its commercial shopping package representation
 * by running it through the registry of registered conversion strategies.
 */
export function convertIngredient(item: RawIngredientItem): ConvertedItem {
  const { scaledQty, unit, rest, isMinced } = item;
  const nameLower = rest.toLowerCase();
  const isStaple = checkIsStaple(rest, scaledQty, unit);

  if (scaledQty === null || scaledQty === undefined || isNaN(scaledQty)) {
    return { qty: null, unit: '', rest, note: isStaple ? 'Pantry Staple' : '', isStaple };
  }

  const context: ConverterContext = { scaledQty, unit, rest, isMinced, nameLower, isStaple };

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
    note: isStaple ? 'Pantry Staple' : '',
    isStaple
  };
}
