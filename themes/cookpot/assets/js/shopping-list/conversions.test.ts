import { describe, expect, test } from 'vitest';
// @ts-expect-error Node imports not available in front-end tsconfig
import * as fs from 'fs';
// @ts-expect-error Node imports not available in front-end tsconfig
import * as path from 'path';

declare const __dirname: string;

import { processShoppingList } from './pipeline';
import { IngredientInput, ShoppingItem } from './types';
import { ITEM_RULES } from './rules';
import { STORE_LAYOUTS } from './store-sections';

interface IngredientTestCase {
  input: IngredientInput;
  expectedList: 'buy' | 'optional' | 'staple';
  expectedItem: {
    item: string;
    qty: number | null;
    unit: string;
    category: string;
    staple?: 'in-pantry';
    sizeNote?: string;
  };
}

const INGREDIENT_TEST_CASES: IngredientTestCase[] = [
  {
    input: {
      item: 'garlic',
      qty: 2,
      unit: 'clove',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'garlic',
      qty: 1,
      unit: 'head',
      category: 'fresh-produce',
      sizeNote: '2 cloves needed',
    },
  },
  {
    input: {
      item: 'garlic clove',
      qty: 11,
      unit: 'cloves',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'garlic clove',
      qty: 2,
      unit: 'heads',
      category: 'fresh-produce',
      sizeNote: '11 cloves needed',
    },
  },
  {
    input: {
      item: 'butter',
      qty: 4,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'butter',
      qty: 1,
      unit: 'stick',
      category: 'butter-cheese',
      sizeNote: '4 tbsp needed',
    },
  },
  {
    input: {
      item: 'butter',
      qty: 12,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'butter',
      qty: 2,
      unit: 'sticks',
      category: 'butter-cheese',
      sizeNote: '12 tbsp needed',
    },
  },
  {
    input: {
      item: 'egg',
      qty: 4,
      unit: 'egg',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'egg',
      qty: 6,
      unit: 'eggs',
      category: 'eggs',
      sizeNote: '4 eggs needed',
    },
  },
  {
    input: {
      item: 'egg yolk',
      qty: 14,
      unit: 'egg',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'egg yolk',
      qty: 18,
      unit: 'eggs',
      category: 'eggs',
      sizeNote: '14 eggs needed',
    },
  },
  {
    input: {
      item: 'lemon juice',
      qty: 3,
      unit: 'tablespoon',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'lemon juice',
      qty: 1,
      unit: 'lemon',
      category: 'fresh-produce',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'lime juice',
      qty: 4,
      unit: 'tablespoon',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'lime juice',
      qty: 2,
      unit: 'limes',
      category: 'fresh-produce',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'sour cream',
      qty: 1.5,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'sour cream',
      qty: 2,
      unit: 'pints (16 oz)',
      category: 'milk-cream',
      sizeNote: '12 oz needed',
    },
  },
  {
    input: {
      item: 'heavy cream',
      qty: 3,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'heavy cream',
      qty: 1,
      unit: 'quart (32 fl oz)',
      category: 'milk-cream',
      sizeNote: '24 oz needed',
    },
  },
  {
    input: {
      item: 'ginger',
      qty: 2,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'ginger',
      qty: 1,
      unit: 'root',
      category: 'fresh-produce',
      sizeNote: '2 tbsp needed',
    },
  },
  {
    input: {
      item: 'onion',
      qty: 1.5,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'onion',
      qty: 1.5,
      unit: 'onions',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'coconut milk',
      qty: 4,
      unit: 'ounce',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'coconut milk',
      qty: 1,
      unit: 'can (13.5 oz)',
      category: 'milk-cream',
      sizeNote: '4 oz needed',
    },
  },
  {
    input: {
      item: 'green cabbage',
      qty: 4,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'green cabbage',
      qty: 0.5,
      unit: 'head',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'scallion',
      qty: 1,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'scallion',
      qty: 1,
      unit: 'bundle',
      category: 'fresh-produce',
      sizeNote: '1 cup needed',
    },
  },
  {
    input: {
      item: 'spaghetti',
      qty: 12,
      unit: 'ounce',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'spaghetti',
      qty: 1,
      unit: 'box (16 oz)',
      category: 'pasta-grains',
      sizeNote: '12 oz needed',
    },
  },
  {
    input: {
      item: 'chickpea',
      qty: 15,
      unit: 'ounce',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'chickpea',
      qty: 1,
      unit: 'can (15 oz)',
      category: 'canned-beans',
      sizeNote: '15 oz needed',
    },
  },
  {
    input: {
      item: 'diced tomato',
      qty: 10,
      unit: 'ounce',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'diced tomato',
      qty: 1,
      unit: 'can (15 oz)',
      category: 'fresh-produce',
      sizeNote: '10 oz needed',
    },
  },
  {
    input: {
      item: 'jarred roasted red pepper',
      qty: 6,
      unit: 'ounce',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'jarred roasted red pepper',
      qty: 1,
      unit: '8-oz jar',
      category: 'spices-seasonings',
      sizeNote: '6 oz needed',
    },
  },
  {
    input: {
      item: 'potato gnocchi',
      qty: 16,
      unit: 'ounce',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'potato gnocchi',
      qty: 1,
      unit: '17.5-oz package',
      category: 'fresh-produce',
      sizeNote: '16 oz needed',
    },
  },
  {
    input: {
      item: 'baby spinach',
      qty: 3,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'baby spinach',
      qty: 1,
      unit: '8 oz bag',
      category: 'fresh-produce',
      sizeNote: '3 oz needed',
    },
  },
  {
    input: {
      item: 'vegetable oil',
      qty: 2,
      unit: 'tablespoon',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'vegetable oil',
      qty: 2,
      unit: 'tablespoons',
      category: 'oils-vinegars',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'almond',
      qty: 0.25,
      unit: 'cup',
      prep: 'sliced',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'almond',
      qty: 4,
      unit: 'tablespoons',
      category: 'snacks',
    },
  },
  {
    input: {
      item: 'sesame seed',
      qty: 0.25,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'sesame seed',
      qty: 4,
      unit: 'tablespoons',
      category: 'other',
    },
  },
  {
    input: {
      item: 'green onion',
      qty: 8,
      prep: 'finely sliced',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'green onion',
      qty: 4,
      unit: 'bundles',
      category: 'fresh-produce',
      sizeNote: '8 cups needed',
    },
  },
  {
    input: {
      item: 'cabbage',
      qty: 1,
      unit: 'head',
      prep: 'thinly sliced or chopped',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'cabbage',
      qty: 1,
      unit: 'head',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'ramen noodles',
      qty: 2,
      unit: 'package',
      prep: 'broken up',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'ramen noodles',
      qty: 2,
      unit: 'packages',
      category: 'pasta-grains',
    },
  },
  {
    input: {
      item: 'chicken',
      qty: 2,
      unit: 'cup',
      desc: 'cooked',
      prep: 'chopped or shredded',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'chicken',
      qty: 2,
      unit: 'cups',
      category: 'poultry',
    },
  },
  {
    input: {
      item: 'sugar',
      qty: 0.25,
      unit: 'cup',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'sugar',
      qty: 4,
      unit: 'tablespoons',
      category: 'baking',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'black pepper',
      qty: 1,
      unit: 'teaspoon',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'black pepper',
      qty: 1,
      unit: 'teaspoon',
      category: 'spices-seasonings',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'salt',
      qty: 1,
      unit: 'teaspoon',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'salt',
      qty: 1,
      unit: 'teaspoon',
      category: 'spices-seasonings',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'rice vinegar',
      qty: 6,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'rice vinegar',
      qty: 6,
      unit: 'tablespoons',
      category: 'pasta-grains',
    },
  },
  {
    input: {
      item: 'whole-egg mayonnaise',
      qty: 1,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'whole-egg mayonnaise',
      qty: 1,
      unit: 'cup',
      category: 'eggs',
    },
  },
  {
    input: {
      item: 'sweet chilli sauce',
      qty: 0.25,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'sweet chilli sauce',
      qty: 4,
      unit: 'tablespoons',
      category: 'condiments',
    },
  },
  {
    input: {
      item: 'sriracha',
      qty: 1,
      unit: 'tablespoon',
      optional: true,
    },
    expectedList: 'optional',
    expectedItem: {
      item: 'sriracha',
      qty: 1,
      unit: 'tablespoon',
      category: 'condiments',
    },
  },
  {
    input: {
      item: 'hot chilli sauce',
      optional: true,
    },
    expectedList: 'optional',
    expectedItem: {
      item: 'hot chilli sauce',
      qty: null,
      unit: '',
      category: 'condiments',
    },
  },
  {
    input: {
      item: 'honey',
      qty: 1,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'honey',
      qty: 1,
      unit: 'tablespoon',
      category: 'condiments',
    },
  },
  {
    input: {
      item: 'lime juice',
      qty: 1,
      unit: 'tablespoon',
      desc: 'fresh',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'lime juice',
      qty: 0.5,
      unit: 'lime',
      category: 'fresh-produce',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'boneless chicken thighs',
      qty: 1.333,
      unit: 'pound',
      prep: 'skin on or off',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'boneless chicken thighs',
      qty: 1.34,
      unit: 'pounds',
      category: 'poultry',
    },
  },
  {
    input: {
      item: 'paprika',
      qty: 1,
      unit: 'teaspoon',
      desc: 'sweet',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'paprika',
      qty: 1,
      unit: 'teaspoon',
      category: 'spices-seasonings',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'onion powder',
      qty: 1,
      unit: 'teaspoon',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'onion powder',
      qty: 1,
      unit: 'teaspoon',
      category: 'fresh-produce',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'tamari',
      qty: 1,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'tamari',
      qty: 1,
      unit: 'tablespoon',
      category: 'other',
    },
  },
  {
    input: {
      item: 'regular soy sauce',
      optional: true,
    },
    expectedList: 'optional',
    expectedItem: {
      item: 'regular soy sauce',
      qty: null,
      unit: '',
      category: 'condiments',
    },
  },
  {
    input: {
      item: 'brown sugar',
      qty: 1,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'brown sugar',
      qty: 1,
      unit: 'tablespoon',
      category: 'baking',
    },
  },
  {
    input: {
      item: 'olive oil',
      qty: 1,
      unit: 'tablespoon',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'olive oil',
      qty: 1,
      unit: 'tablespoon',
      category: 'oils-vinegars',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'spring onion',
      qty: 1,
      prep: 'sliced',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'spring onion',
      qty: 1,
      unit: 'bundle',
      category: 'fresh-produce',
      sizeNote: '1 cup needed',
    },
  },
  {
    input: {
      item: 'scallion',
      optional: true,
    },
    expectedList: 'optional',
    expectedItem: {
      item: 'scallion',
      qty: null,
      unit: 'cup',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'steamed rice',
      prep: 'for serving',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'steamed rice',
      qty: null,
      unit: '',
      category: 'pasta-grains',
    },
  },
  {
    input: {
      item: 'red cabbage',
      qty: 75,
      unit: 'gram',
      prep: 'shredded',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'red cabbage',
      qty: 75,
      unit: 'heads',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'carrot',
      qty: 2,
      prep: 'grated or julienned',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'carrot',
      qty: 2,
      unit: '',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'cucumber',
      qty: 1,
      prep: 'sliced',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'cucumber',
      qty: 1,
      unit: '',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'beet',
      qty: 1,
      unit: 'pound',
      prep: 'red or orange',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'beet',
      qty: 1,
      unit: 'pound',
      category: 'other',
    },
  },
  {
    input: {
      item: 'garlic',
      qty: 1,
      unit: 'head',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'garlic',
      qty: 1,
      unit: 'head',
      category: 'fresh-produce',
      sizeNote: '10 cloves needed',
    },
  },
  {
    input: {
      item: 'lemon',
      qty: 1,
      prep: 'for juice and zest',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'lemon',
      qty: 1,
      unit: 'lemon',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'parmesan',
      qty: 3,
      unit: 'ounce',
      prep: 'grated',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'parmesan',
      qty: 6,
      unit: 'tablespoons',
      category: 'butter-cheese',
    },
  },
  {
    input: {
      item: 'Diamond Crystal kosher salt',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'Diamond Crystal kosher salt',
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'rigatoni pasta',
      qty: 16,
      unit: 'ounce',
      desc: 'short',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'rigatoni pasta',
      qty: 2,
      unit: 'cups',
      category: 'pasta-grains',
    },
  },
  {
    input: {
      item: 'basil',
      qty: 1,
      unit: 'teaspoon',
      desc: 'dried',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'basil',
      qty: 1,
      unit: 'teaspoon',
      category: 'fresh-herbs',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'low-fat plain kefir',
      qty: 1,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'low-fat plain kefir',
      qty: 1,
      unit: 'cup',
      category: 'milk-cream',
    },
  },
  {
    input: {
      item: 'frozen mixed berries',
      qty: 1,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'frozen mixed berries',
      qty: 1,
      unit: 'cup',
      category: 'frozen',
    },
  },
  {
    input: {
      item: 'orange juice',
      qty: 0.25,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'orange juice',
      qty: 4,
      unit: 'tablespoons',
      category: 'beverages',
    },
  },
  {
    input: {
      item: 'fresh mint',
      qty: [1, 2],
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'fresh mint',
      qty: 1.5,
      unit: 'tablespoons',
      category: 'fresh-herbs',
    },
  },
  {
    input: {
      item: 'grape tomato',
      qty: 1,
      unit: 'package',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'grape tomato',
      qty: 1,
      unit: 'package',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'mozzarella ball',
      qty: 1,
      unit: 'container',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'mozzarella ball',
      qty: 1,
      unit: 'container',
      category: 'butter-cheese',
    },
  },
  {
    input: {
      item: 'balsamic glaze',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'balsamic glaze',
      qty: null,
      unit: '',
      category: 'other',
    },
  },
  {
    input: {
      item: 'yellow onion',
      qty: 1,
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'yellow onion',
      qty: 1,
      unit: 'onion',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'ginger',
      qty: 1,
      unit: 'teaspoon',
      prep: 'grated',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'ginger',
      qty: 1,
      unit: 'root',
      category: 'fresh-produce',
      sizeNote: '1/3 tbsp needed',
    },
  },
  {
    input: {
      item: 'coconut oil',
      qty: 1,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'coconut oil',
      qty: 1,
      unit: 'tablespoon',
      category: 'oils-vinegars',
    },
  },
  {
    input: {
      item: 'baby spinach',
      qty: 5,
      unit: 'ounce',
      desc: 'leaves',
      prep: 'chopped',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'baby spinach',
      qty: 1,
      unit: '8 oz bag',
      category: 'fresh-produce',
      sizeNote: '5 oz needed',
    },
  },
  {
    input: {
      item: 'spinach',
      optional: true,
    },
    expectedList: 'optional',
    expectedItem: {
      item: 'spinach',
      qty: null,
      unit: 'ounce',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'fire roasted tomato',
      qty: 1,
      unit: 'can (28 ounce)',
      prep: 'crushed',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'fire roasted tomato',
      qty: 1,
      unit: 'can (15 oz)',
      category: 'fresh-produce',
      sizeNote: '1 oz needed',
    },
  },
  {
    input: {
      item: 'curry powder',
      qty: 1,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'curry powder',
      qty: 1,
      unit: 'tablespoon',
      category: 'other',
    },
  },
  {
    input: {
      item: 'cumin',
      qty: 1,
      unit: 'teaspoon',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'cumin',
      qty: 1,
      unit: 'teaspoon',
      category: 'spices-seasonings',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'coriander',
      qty: 0.5,
      unit: 'teaspoon',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'coriander',
      qty: 0.5,
      unit: 'teaspoon',
      category: 'spices-seasonings',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'kosher salt',
      qty: 0.75,
      unit: 'teaspoon',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'kosher salt',
      qty: 0.75,
      unit: 'teaspoon',
      category: 'spices-seasonings',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'chickpea',
      qty: 2,
      unit: 'can (15 ounce)',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'chickpea',
      qty: 1,
      unit: 'can (15 oz)',
      category: 'canned-beans',
      sizeNote: '2 oz needed',
    },
  },
  {
    input: {
      item: 'coconut milk',
      qty: 0.5,
      unit: 'cup',
      desc: 'full fat canned',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'coconut milk',
      qty: 1,
      unit: 'can (13.5 oz)',
      category: 'milk-cream',
      sizeNote: '4 oz needed',
    },
  },
  {
    input: {
      item: 'basmati rice',
      desc: 'white or brown',
      prep: 'to serve',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'basmati rice',
      qty: null,
      unit: '',
      category: 'pasta-grains',
    },
  },
  {
    input: {
      item: 'chicken thighs',
      qty: 2.25,
      unit: 'pound',
      desc: 'skin-on',
      prep: 'deboned',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'chicken thighs',
      qty: 2.25,
      unit: 'pounds',
      category: 'poultry',
    },
  },
  {
    input: {
      item: 'lime zest',
      qty: 3,
      unit: 'teaspoon',
      desc: 'fresh',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'lime zest',
      qty: 3,
      unit: 'limes',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'cilantro',
      qty: 4,
      unit: 'tablespoon',
      desc: 'fresh',
      prep: 'finely chopped',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'cilantro',
      qty: 4,
      unit: 'tablespoons',
      category: 'fresh-herbs',
    },
  },
  {
    input: {
      item: 'jalapeño',
      qty: 2,
      prep: 'finely chopped',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'jalapeño',
      qty: 2,
      unit: '',
      category: 'other',
    },
  },
  {
    input: {
      item: 'chili powder',
      qty: 1,
      unit: 'teaspoon',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'chili powder',
      qty: 1,
      unit: 'teaspoon',
      category: 'spices-seasonings',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'potato gnocchi',
      qty: 16,
      unit: 'ounce',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'potato gnocchi',
      qty: 1,
      unit: '17.5-oz package',
      category: 'fresh-produce',
      sizeNote: '16 oz needed',
    },
  },
  {
    input: {
      item: 'chorizo',
      qty: 0.5,
      unit: 'pound',
      desc: 'fresh',
      prep: 'casing removed',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'chorizo',
      qty: 0.5,
      unit: 'pound',
      category: 'other',
    },
  },
  {
    input: {
      item: 'jarred roasted red pepper',
      qty: 0.75,
      unit: 'cup',
      prep: 'chopped',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'jarred roasted red pepper',
      qty: 1,
      unit: '8-oz jar',
      category: 'spices-seasonings',
      sizeNote: '6 oz needed',
    },
  },
  {
    input: {
      item: 'onion',
      qty: 1,
      unit: 'small',
      prep: 'chopped',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'onion',
      qty: 1,
      unit: 'onion',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'broccoli',
      qty: 1,
      unit: 'large head',
      prep: 'florets cut into 1.5- to 2-inch pieces, stems thinly sliced',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'broccoli',
      qty: 1,
      unit: 'large head',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'red pepper flake',
      prep: 'crushed',
      optional: true,
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'red pepper flake',
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'Italian sausage',
      qty: 1,
      unit: 'pound',
      desc: 'hot or sweet',
      prep: 'casings removed',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'Italian sausage',
      qty: 1,
      unit: 'pound',
      category: 'meat',
    },
  },
  {
    input: {
      item: 'egg',
      qty: 3,
      unit: 'large',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'egg',
      qty: 6,
      unit: 'eggs',
      category: 'eggs',
      sizeNote: '3 large needed',
    },
  },
  {
    input: {
      item: 'vanilla extract',
      qty: 3,
      unit: 'teaspoon',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'vanilla extract',
      qty: 1,
      unit: 'tablespoon',
      category: 'baking',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'cinnamon',
      qty: 1.5,
      unit: 'teaspoon',
      desc: 'ground',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'cinnamon',
      qty: 1.5,
      unit: 'teaspoons',
      category: 'spices-seasonings',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'milk',
      qty: 0.75,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'milk',
      qty: 1,
      unit: 'pint (16 fl oz)',
      category: 'milk-cream',
      sizeNote: '6 oz needed',
    },
  },
  {
    input: {
      item: 'brioche',
      qty: 1,
      unit: 'loaf',
      prep: 'sliced into 12 slices',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'brioche',
      qty: 1,
      unit: 'loaf',
      category: 'bakery',
    },
  },
  {
    input: {
      item: 'butter',
      qty: 2,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'butter',
      qty: 1,
      unit: 'stick',
      category: 'butter-cheese',
      sizeNote: '2 tbsp needed',
    },
  },
  {
    input: {
      item: 'heavy cream',
      qty: 1.5,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'heavy cream',
      qty: 1,
      unit: 'pint (16 fl oz)',
      category: 'milk-cream',
      sizeNote: '12 oz needed',
    },
  },
  {
    input: {
      item: 'egg yolk',
      qty: 1,
      unit: 'large',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'egg yolk',
      qty: 6,
      unit: 'eggs',
      category: 'eggs',
      sizeNote: '1 large needed',
    },
  },
  {
    input: {
      item: 'fettuccine',
      qty: 1,
      unit: 'pound',
      desc: 'fresh',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'fettuccine',
      qty: 1,
      unit: 'box (16 oz)',
      category: 'pasta-grains',
      sizeNote: '1 oz needed',
    },
  },
  {
    input: {
      item: 'Parmigiano-Reggiano',
      qty: 1,
      unit: 'cup',
      desc: 'freshly grated',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'Parmigiano-Reggiano',
      qty: 1,
      unit: 'cup',
      category: 'butter-cheese',
    },
  },
  {
    input: {
      item: 'banana',
      qty: 2,
      unit: 'large',
      desc: 'ripe',
      prep: 'mashed',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'banana',
      qty: 2,
      unit: 'large',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'peanut butter',
      qty: 1,
      unit: 'cup',
      desc: 'all-natural',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'peanut butter',
      qty: 1,
      unit: 'cup',
      category: 'butter-cheese',
    },
  },
  {
    input: {
      item: 'baking powder',
      qty: 1.5,
      unit: 'teaspoon',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'baking powder',
      qty: 1.5,
      unit: 'teaspoons',
      category: 'baking',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'sea salt',
      qty: 0.5,
      unit: 'teaspoon',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'sea salt',
      qty: 0.5,
      unit: 'teaspoon',
      category: 'spices-seasonings',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'chocolate chip',
      qty: 0.5,
      unit: 'cup',
      optional: true,
    },
    expectedList: 'optional',
    expectedItem: {
      item: 'chocolate chip',
      qty: 8,
      unit: 'tablespoons',
      category: 'baking',
    },
  },
  {
    input: {
      item: 'berry',
      qty: 1,
      unit: 'cup',
      desc: 'fresh',
      optional: true,
    },
    expectedList: 'optional',
    expectedItem: {
      item: 'berry',
      qty: 1,
      unit: 'cup',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'raisin',
      qty: 0.5,
      unit: 'cup',
      optional: true,
    },
    expectedList: 'optional',
    expectedItem: {
      item: 'raisin',
      qty: 8,
      unit: 'tablespoons',
      category: 'other',
    },
  },
  {
    input: {
      item: 'dried cranberry',
      optional: true,
    },
    expectedList: 'optional',
    expectedItem: {
      item: 'dried cranberry',
      qty: null,
      unit: '',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'pound cake mix',
      qty: 1,
      unit: 'box (16 ounces)',
      prep: '(plus ingredients required by package instructions)',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'pound cake mix',
      qty: 1,
      unit: 'box (16 ounces)',
      category: 'other',
    },
  },
  {
    input: {
      item: 'powdered sugar',
      qty: 0.25,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'powdered sugar',
      qty: 4,
      unit: 'tablespoons',
      category: 'baking',
    },
  },
  {
    input: {
      item: 'blueberry',
      qty: 1,
      unit: 'cup',
      desc: 'fresh',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'blueberry',
      qty: 1,
      unit: 'cup',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'raspberry',
      qty: 1,
      unit: 'cup',
      desc: 'fresh',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'raspberry',
      qty: 1,
      unit: 'cup',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'sliced bread',
      qty: 1,
      unit: 'loaf',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'sliced bread',
      qty: 1,
      unit: 'loaf',
      category: 'bakery',
    },
  },
  {
    input: {
      item: 'sliced cheese',
      qty: 1,
      unit: 'package',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'sliced cheese',
      qty: 1,
      unit: 'package',
      category: 'butter-cheese',
    },
  },
  {
    input: {
      item: 'mayo',
      qty: 1,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'mayo',
      qty: 1,
      unit: 'tablespoon',
      category: 'condiments',
    },
  },
  {
    input: {
      item: 'ground turkey',
      qty: 1,
      unit: 'pound',
      desc: 'organic',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'ground turkey',
      qty: 1,
      unit: 'pound',
      category: 'poultry',
    },
  },
  {
    input: {
      item: 'ground chicken',
      optional: true,
    },
    expectedList: 'optional',
    expectedItem: {
      item: 'ground chicken',
      qty: null,
      unit: '',
      category: 'poultry',
    },
  },
  {
    input: {
      item: 'cracker crumb',
      qty: 1,
      unit: 'cup',
      desc: 'gluten-free',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'cracker crumb',
      qty: 1,
      unit: 'cup',
      category: 'snacks',
    },
  },
  {
    input: {
      item: 'grain-free cracker crumb',
      optional: true,
    },
    expectedList: 'optional',
    expectedItem: {
      item: 'grain-free cracker crumb',
      qty: null,
      unit: '',
      category: 'snacks',
    },
  },
  {
    input: {
      item: 'coconut amino',
      qty: 1.5,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'coconut amino',
      qty: 1.5,
      unit: 'tablespoons',
      category: 'snacks',
    },
  },
  {
    input: {
      item: 'red curry paste',
      qty: 1,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'red curry paste',
      qty: 1,
      unit: 'tablespoon',
      category: 'other',
    },
  },
  {
    input: {
      item: 'avocado oil',
      qty: 2,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'avocado oil',
      qty: 2,
      unit: 'tablespoons',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'red bell pepper',
      qty: 1,
      prep: 'sliced',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'red bell pepper',
      qty: 1,
      unit: '',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'cumin powder',
      qty: 0.25,
      unit: 'teaspoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'cumin powder',
      qty: 0.25,
      unit: 'teaspoon',
      category: 'spices-seasonings',
    },
  },
  {
    input: {
      item: 'kasoori methi',
      qty: 2,
      unit: 'tablespoon',
      optional: true,
    },
    expectedList: 'optional',
    expectedItem: {
      item: 'kasoori methi',
      qty: 2,
      unit: 'tablespoons',
      category: 'other',
    },
  },
  {
    input: {
      item: 'coriander powder',
      qty: 2.5,
      unit: 'teaspoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'coriander powder',
      qty: 2.5,
      unit: 'teaspoons',
      category: 'spices-seasonings',
    },
  },
  {
    input: {
      item: 'cayenne pepper powder',
      qty: 0.5,
      unit: 'teaspoon',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'cayenne pepper powder',
      qty: 0.5,
      unit: 'teaspoon',
      category: 'spices-seasonings',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'garam masala powder',
      qty: 0.25,
      unit: 'teaspoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'garam masala powder',
      qty: 0.25,
      unit: 'teaspoon',
      category: 'other',
    },
  },
  {
    input: {
      item: 'tomato sauce',
      qty: 1,
      unit: 'can (15-ounce)',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'tomato sauce',
      qty: 1,
      unit: 'can (15 oz)',
      category: 'fresh-produce',
      sizeNote: '1 oz needed',
    },
  },
  {
    input: {
      item: 'cashew powder',
      qty: 3,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'cashew powder',
      qty: 3,
      unit: 'tablespoons',
      category: 'snacks',
    },
  },
  {
    input: {
      item: 'chickpeas',
      qty: 2,
      unit: 'can (15-ounce)',
      prep: 'drained and rinsed',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'chickpeas',
      qty: 2,
      unit: 'can (15-ounce)s',
      category: 'canned-beans',
    },
  },
  {
    input: {
      item: 'maple syrup',
      qty: 2,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'maple syrup',
      qty: 2,
      unit: 'tablespoons',
      category: 'condiments',
    },
  },
  {
    input: {
      item: 'white rice',
      prep: 'to serve',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'white rice',
      qty: null,
      unit: '',
      category: 'pasta-grains',
    },
  },
  {
    input: {
      item: 'ground beef',
      qty: 1,
      unit: 'pound',
      prep: 'round or chuck',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'ground beef',
      qty: 1,
      unit: 'pound',
      category: 'meat',
    },
  },
  {
    input: {
      item: 'panko',
      qty: 0.5,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'panko',
      qty: 8,
      unit: 'tablespoons',
      category: 'pasta-grains',
    },
  },
  {
    input: {
      item: 'soy sauce',
      qty: 2,
      unit: 'tablespoon',
      desc: 'low-sodium',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'soy sauce',
      qty: 2,
      unit: 'tablespoons',
      category: 'condiments',
    },
  },
  {
    input: {
      item: 'spicy mayonnaise',
      prep: 'to serve',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'spicy mayonnaise',
      qty: null,
      unit: '',
      category: 'condiments',
    },
  },
  {
    input: {
      item: 'lemon juice',
      qty: 3,
      unit: 'tablespoon',
      desc: 'fresh',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'lemon juice',
      qty: 1,
      unit: 'lemon',
      category: 'fresh-produce',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'all-purpose flour',
      qty: 1.5,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'all-purpose flour',
      qty: 1.5,
      unit: 'cups',
      category: 'baking',
    },
  },
  {
    input: {
      item: 'baking soda',
      qty: 0.25,
      unit: 'teaspoon',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'baking soda',
      qty: 0.25,
      unit: 'teaspoon',
      category: 'baking',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'sour cream',
      qty: 0.5,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'sour cream',
      qty: 1,
      unit: 'half-pint (8 oz)',
      category: 'milk-cream',
      sizeNote: '4 oz needed',
    },
  },
  {
    input: {
      item: 'plain Greek yogurt',
      optional: true,
    },
    expectedList: 'optional',
    expectedItem: {
      item: 'plain Greek yogurt',
      qty: null,
      unit: '',
      category: 'milk-cream',
    },
  },
  {
    input: {
      item: 'lemon zest',
      qty: 2,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'lemon zest',
      qty: 0.67,
      unit: 'lemon',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'shortbread cookie',
      qty: 9,
      unit: 'ounce',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'shortbread cookie',
      qty: 1.13,
      unit: 'cups',
      category: 'bakery',
    },
  },
  {
    input: {
      item: 'granulated sugar',
      qty: 0.25,
      unit: 'cup',
      prep: 'for crust',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'granulated sugar',
      qty: 4,
      unit: 'tablespoons',
      category: 'baking',
    },
  },
  {
    input: {
      item: 'sweetened condensed milk',
      qty: 1,
      unit: 'can (14-ounce)',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'sweetened condensed milk',
      qty: 1,
      unit: 'can (14-ounce)',
      category: 'milk-cream',
    },
  },
  {
    input: {
      item: 'whipped cream',
      desc: 'freshly',
      prep: 'for serving',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'whipped cream',
      qty: null,
      unit: '',
      category: 'milk-cream',
    },
  },
  {
    input: {
      item: 'light brown sugar',
      qty: 0.25,
      unit: 'cup',
      prep: 'packed',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'light brown sugar',
      qty: 4,
      unit: 'tablespoons',
      category: 'baking',
    },
  },
  {
    input: {
      item: 'lemon extract',
      qty: 0.5,
      unit: 'teaspoon',
      desc: 'pure',
      optional: true,
    },
    expectedList: 'optional',
    expectedItem: {
      item: 'lemon extract',
      qty: 0.5,
      unit: 'teaspoon',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'cake flour',
      qty: 2.5,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'cake flour',
      qty: 2.5,
      unit: 'cups',
      category: 'baking',
    },
  },
  {
    input: {
      item: 'cream cheese',
      qty: 8,
      unit: 'ounce',
      desc: 'full-fat',
      prep: 'a little softer than room temperature (for frosting)',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'cream cheese',
      qty: 1,
      unit: 'cup',
      category: 'milk-cream',
    },
  },
  {
    input: {
      item: "confectioners' sugar",
      qty: 4,
      unit: 'cup',
      prep: 'more if needed (for frosting)',
    },
    expectedList: 'buy',
    expectedItem: {
      item: "confectioners' sugar",
      qty: 4,
      unit: 'cups',
      category: 'baking',
    },
  },
  {
    input: {
      item: 'raspberry preserve',
      qty: 0.5,
      unit: 'cup',
      prep: '(for garnish)',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'raspberry preserve',
      qty: 8,
      unit: 'tablespoons',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'sweet onion',
      qty: 1,
      unit: 'small',
      prep: 'chopped',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'sweet onion',
      qty: 1,
      unit: 'onion',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'summer squash',
      qty: 4,
      desc: '(about 7-8 ounces each)',
      prep: 'sliced into 1/8-inch half moons',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'summer squash',
      qty: 4,
      unit: '',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'thyme',
      qty: 1,
      unit: 'tablespoon',
      desc: 'fresh',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'thyme',
      qty: 1,
      unit: 'tablespoon',
      category: 'fresh-herbs',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'water',
      qty: 4,
      unit: 'cup',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'water',
      qty: 4,
      unit: 'cups',
      category: 'beverages',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'bread-and-butter pickle',
      qty: 0.666,
      unit: 'cup',
      prep: 'minced',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'bread-and-butter pickle',
      qty: 10.66,
      unit: 'tablespoons',
      category: 'bakery',
    },
  },
  {
    input: {
      item: 'mayonnaise',
      qty: 0.75,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'mayonnaise',
      qty: 12,
      unit: 'tablespoons',
      category: 'condiments',
    },
  },
  {
    input: {
      item: 'Italian parsley',
      qty: 0.333,
      unit: 'cup',
      desc: 'fresh',
      prep: 'finely chopped, plus more for garnish',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'Italian parsley',
      qty: 5.33,
      unit: 'tablespoons',
      category: 'fresh-herbs',
    },
  },
  {
    input: {
      item: 'dill',
      qty: 0.25,
      unit: 'cup',
      desc: 'fresh',
      prep: 'chopped, plus small sprigs for garnish',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'dill',
      qty: 4,
      unit: 'tablespoons',
      category: 'fresh-herbs',
    },
  },
  {
    input: {
      item: 'Dijon mustard',
      qty: 4,
      unit: 'teaspoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'Dijon mustard',
      qty: 1.34,
      unit: 'tablespoons',
      category: 'condiments',
    },
  },
  {
    input: {
      item: 'elbow macaroni',
      qty: 16,
      unit: 'ounce',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'elbow macaroni',
      qty: 1,
      unit: 'box (16 oz)',
      category: 'pasta-grains',
      sizeNote: '16 oz needed',
    },
  },
  {
    input: {
      item: 'Mila soup dumplings',
      qty: 1,
      unit: 'package',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'Mila soup dumplings',
      qty: 1,
      unit: 'package',
      category: 'frozen',
    },
  },
  {
    input: {
      item: 'beef chuck roast',
      qty: 3,
      unit: 'pound',
      prep: 'cut into thirds',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'beef chuck roast',
      qty: 3,
      unit: 'pounds',
      category: 'meat',
    },
  },
  {
    input: {
      item: 'miso',
      qty: 2,
      unit: 'tablespoon',
      desc: 'white or yellow recommended',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'miso',
      qty: 2,
      unit: 'tablespoons',
      category: 'other',
    },
  },
  {
    input: {
      item: 'rice wine vinegar',
      qty: 1.333,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'rice wine vinegar',
      qty: 1.34,
      unit: 'tablespoons',
      category: 'pasta-grains',
    },
  },
  {
    input: {
      item: 'red pepper flakes',
      qty: 1,
      unit: 'teaspoon',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'red pepper flakes',
      qty: 1,
      unit: 'teaspoon',
      category: 'spices-seasonings',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'beef bone broth',
      qty: 1,
      unit: 'cup',
      desc: 'if using a Dutch oven',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'beef bone broth',
      qty: 1,
      unit: 'cup',
      category: 'meat',
    },
  },
  {
    input: {
      item: 'orzo pasta',
      qty: 1.5,
      unit: 'cup',
      desc: 'dry',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'orzo pasta',
      qty: 1,
      unit: 'box (16 oz)',
      category: 'pasta-grains',
      sizeNote: '12 oz needed',
    },
  },
  {
    input: {
      item: 'Persian cucumber',
      qty: 2,
      prep: 'halved vertically and sliced 1/4-inch thick',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'Persian cucumber',
      qty: 2,
      unit: '',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'cherry tomato',
      qty: 2,
      unit: 'cup',
      prep: 'halved',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'cherry tomato',
      qty: 2,
      unit: 'cups',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'feta cheese',
      qty: 4,
      unit: 'ounce',
      prep: 'cut into 1/4-inch cubes',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'feta cheese',
      qty: 8,
      unit: 'tablespoons',
      category: 'butter-cheese',
    },
  },
  {
    input: {
      item: 'red onion',
      qty: 0.333,
      unit: 'cup',
      prep: 'thinly sliced',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'red onion',
      qty: 0.34,
      unit: 'onion',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'Kalamata olive',
      qty: 0.5,
      unit: 'cup',
      desc: 'pitted',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'Kalamata olive',
      qty: 8,
      unit: 'tablespoons',
      category: 'other',
    },
  },
  {
    input: {
      item: 'basil leaf',
      qty: 1,
      unit: 'cup',
      desc: 'fresh',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'basil leaf',
      qty: 1,
      unit: 'cup',
      category: 'fresh-herbs',
    },
  },
  {
    input: {
      item: 'mint leaf',
      optional: true,
    },
    expectedList: 'optional',
    expectedItem: {
      item: 'mint leaf',
      qty: null,
      unit: '',
      category: 'fresh-herbs',
    },
  },
  {
    input: {
      item: 'red wine vinegar',
      qty: 4,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'red wine vinegar',
      qty: 4,
      unit: 'tablespoons',
      category: 'condiments',
    },
  },
  {
    input: {
      item: 'oregano',
      qty: 1,
      unit: 'teaspoon',
      desc: 'dried',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'oregano',
      qty: 1,
      unit: 'teaspoon',
      category: 'spices-seasonings',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'Greek yogurt',
      qty: 0.333,
      unit: 'cup',
      desc: 'vanilla or plain nonfat',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'Greek yogurt',
      qty: 5.33,
      unit: 'tablespoons',
      category: 'milk-cream',
    },
  },
  {
    input: {
      item: 'almond milk',
      qty: 0.666,
      unit: 'cup',
      desc: 'unsweetened vanilla',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'almond milk',
      qty: 10.66,
      unit: 'tablespoons',
      category: 'milk-cream',
    },
  },
  {
    input: {
      item: 'chia seed',
      qty: 0.5,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'chia seed',
      qty: 1.5,
      unit: 'teaspoons',
      category: 'other',
    },
  },
  {
    input: {
      item: 'rolled oat',
      qty: 0.5,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'rolled oat',
      qty: 8,
      unit: 'tablespoons',
      category: 'bakery',
    },
  },
  {
    input: {
      item: 'Pillsbury crescent roll',
      qty: 1,
      unit: 'can',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'Pillsbury crescent roll',
      qty: 1,
      unit: 'can',
      category: 'bakery',
    },
  },
  {
    input: {
      item: 'cocktail weenie',
      qty: 1,
      unit: 'package',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'cocktail weenie',
      qty: 1,
      unit: 'package',
      category: 'other',
    },
  },
  {
    input: {
      item: 'ketchup',
      prep: 'for serving',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'ketchup',
      qty: null,
      unit: '',
      category: 'condiments',
    },
  },
  {
    input: {
      item: 'chicken thigh',
      qty: 1,
      unit: 'pound',
      desc: 'boneless skinless',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'chicken thigh',
      qty: 1,
      unit: 'pound',
      category: 'poultry',
    },
  },
  {
    input: {
      item: 'chicken breast',
      optional: true,
    },
    expectedList: 'optional',
    expectedItem: {
      item: 'chicken breast',
      qty: null,
      unit: '',
      category: 'poultry',
    },
  },
  {
    input: {
      item: 'smoked paprika',
      qty: 2,
      unit: 'teaspoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'smoked paprika',
      qty: 2,
      unit: 'teaspoons',
      category: 'spices-seasonings',
    },
  },
  {
    input: {
      item: 'poblano pepper',
      qty: 1,
      prep: 'chopped (or up to 2)',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'poblano pepper',
      qty: 1,
      unit: '',
      category: 'spices-seasonings',
    },
  },
  {
    input: {
      item: 'salsa verde',
      qty: 2,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'salsa verde',
      qty: 2,
      unit: 'cups',
      category: 'other',
    },
  },
  {
    input: {
      item: 'chicken broth',
      qty: 6,
      unit: 'cup',
      desc: 'low sodium',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'chicken broth',
      qty: 2,
      unit: 'quarts (32 fl oz)',
      category: 'poultry',
      sizeNote: '48 oz needed',
    },
  },
  {
    input: {
      item: 'black bean',
      qty: 1,
      unit: 'can (14 ounce)',
      prep: 'drained',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'black bean',
      qty: 1,
      unit: 'can (15 oz)',
      category: 'canned-beans',
      sizeNote: '1 oz needed',
    },
  },
  {
    input: {
      item: 'rice',
      qty: 3,
      unit: 'cup',
      desc: 'cooked',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'rice',
      qty: 3,
      unit: 'cups',
      category: 'pasta-grains',
    },
  },
  {
    input: {
      item: 'tortilla chip',
      prep: 'for serving',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'tortilla chip',
      qty: null,
      unit: '',
      category: 'bakery',
    },
  },
  {
    input: {
      item: 'yogurt',
      prep: 'for serving',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'yogurt',
      qty: null,
      unit: 'cup',
      category: 'milk-cream',
    },
  },
  {
    input: {
      item: 'avocado',
      prep: 'for serving',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'avocado',
      qty: null,
      unit: '',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'cheese',
      prep: 'for serving',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'cheese',
      qty: null,
      unit: '',
      category: 'butter-cheese',
    },
  },
  {
    input: {
      item: 'pasta',
      qty: 1,
      unit: 'pound',
      desc: 'short, curled',
      prep: 'such as pipettes',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'pasta',
      qty: 1,
      unit: 'box (16 oz)',
      category: 'pasta-grains',
      sizeNote: '1 oz needed',
    },
  },
  {
    input: {
      item: 'tequila',
      qty: 1.5,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'tequila',
      qty: 1.5,
      unit: 'tablespoons',
      category: 'other',
    },
  },
  {
    input: {
      item: 'lime',
      qty: 1,
      prep: 'cut into wedges for serving',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'lime',
      qty: 1,
      unit: 'lime',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'oyster sauce',
      qty: 0.25,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'oyster sauce',
      qty: 4,
      unit: 'tablespoons',
      category: 'condiments',
    },
  },
  {
    input: {
      item: 'canola oil',
      qty: 3,
      unit: 'tablespoon',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'canola oil',
      qty: 3,
      unit: 'tablespoons',
      category: 'canned-other',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'snow peas or sugar snap peas',
      qty: 4,
      unit: 'ounce',
      desc: 'about 1 1/2 cups',
      prep: 'trimmed',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'snow peas or sugar snap peas',
      qty: 8,
      unit: 'tablespoons',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'sesame oil',
      qty: 2,
      unit: 'teaspoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'sesame oil',
      qty: 2,
      unit: 'teaspoons',
      category: 'oils-vinegars',
    },
  },
  {
    input: {
      item: 'pepper',
      prep: 'to taste',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'pepper',
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'bacon',
      qty: 2,
      unit: 'strip',
      prep: 'chopped',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'bacon',
      qty: 2,
      unit: 'strips',
      category: 'meat',
    },
  },
  {
    input: {
      item: 'celery rib',
      qty: 2,
      prep: 'chopped (about 1/3 cup)',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'celery rib',
      qty: 2,
      unit: '',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'russet potato',
      qty: 2,
      unit: 'medium',
      prep: 'peeled and diced into 1/2-inch cubes (about 1 pound)',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'russet potato',
      qty: 2,
      unit: 'medium',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'vegetable stock',
      optional: true,
    },
    expectedList: 'optional',
    expectedItem: {
      item: 'vegetable stock',
      qty: null,
      unit: 'cup',
      category: 'canned-other',
    },
  },
  {
    input: {
      item: 'bay leaf',
      qty: 1,
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'bay leaf',
      qty: 1,
      unit: '',
      category: 'other',
    },
  },
  {
    input: {
      item: 'corn',
      qty: 4,
      unit: 'ear',
      desc: 'sweet fresh',
      prep: 'kernels cut from cob (about 2 3/4 cups)',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'corn',
      qty: 4,
      unit: 'ears',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'zucchini',
      qty: 1,
      unit: 'medium',
      prep: 'diced into 1/2-inch cubes (about 1 1/2 cups)',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'zucchini',
      qty: 1,
      unit: 'medium',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'half and half',
      qty: 1,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'half and half',
      qty: 1,
      unit: 'cup',
      category: 'milk-cream',
    },
  },
  {
    input: {
      item: 'parsley',
      desc: 'fresh',
      prep: 'chopped, to garnish',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'parsley',
      qty: null,
      unit: '',
      category: 'fresh-herbs',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'cayenne pepper',
      prep: 'to serve',
      optional: true,
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'cayenne pepper',
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
    },
  },
  {
    input: {
      item: 'butternut squash',
      qty: 1,
      unit: '',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'butternut squash',
      qty: 1,
      unit: '',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'shallot',
      qty: 2,
      unit: '',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'shallot',
      qty: 2,
      unit: '',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'fresh sage',
      qty: 10,
      unit: 'leaf',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'fresh sage',
      qty: 10,
      unit: 'leaves',
      category: 'fresh-herbs',
    },
  },
  {
    input: {
      item: 'kale',
      qty: 1,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'kale',
      qty: 1,
      unit: 'cup',
      category: 'fresh-produce',
    },
  },
];

function getAllIngredientsFromContent(): string[] {
  const contentDir = path.resolve(__dirname, '../../../../../content');
  const ingredients: string[] = [];

  function scanDir(dir: string) {
    if (!fs.existsSync(dir)) {
      return;
    }
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (file.endsWith('.md')) {
        const text = fs.readFileSync(fullPath, 'utf-8');
        const startIdx = text.indexOf('ingredients = [');
        if (startIdx !== -1) {
          const endIdx = text.indexOf('+++', startIdx);
          const ingredientsBlock = text.slice(startIdx, endIdx);
          const itemMatches = ingredientsBlock.match(/items*=s*"([^"]+)"/g);
          if (itemMatches) {
            itemMatches.forEach((m: string) => {
              const itemMatch = m.match(/"([^"]+)"/);
              if (itemMatch) {
                ingredients.push(itemMatch[1]);
              }
            });
          }
        }
      }
    }
  }

  scanDir(contentDir);
  return Array.from(new Set(ingredients));
}

describe('Shopping List Conversion Integration Tests', () => {
  INGREDIENT_TEST_CASES.forEach(
    ({ input, expectedList, expectedItem }, idx) => {
      const testName =
        input.qty !== undefined
          ? `Case #${idx + 1}: ${input.qty} ${input.unit || ''} of ${input.item} converts to ${expectedList} list`
          : `Case #${idx + 1}: ${input.item} converts to ${expectedList} list`;

      test(testName, () => {
        const result = processShoppingList([input], STORE_LAYOUTS[0]);

        let list: ShoppingItem[];
        if (expectedList === 'buy') {
          list = result.buyItems;
        } else if (expectedList === 'optional') {
          list = result.optionalItems;
        } else {
          list = result.stapleItems;
        }

        const item = list.find(
          (i) => i.item.toLowerCase() === input.item.toLowerCase(),
        );
        expect(item).toBeDefined();
        expect(item?.category).toBe(expectedItem.category);
        expect(item?.unit).toBe(expectedItem.unit);
        expect(item?.qty).toBe(expectedItem.qty);

        if (expectedItem.sizeNote !== undefined) {
          expect(item?.note?.sizeNote).toBe(expectedItem.sizeNote);
        }
        if (expectedItem.staple !== undefined) {
          expect(item?.staple).toBe(expectedItem.staple);
        }

        // Assert it doesn't appear in the other lists
        if (expectedList !== 'buy') {
          expect(
            result.buyItems.find(
              (i) => i.item.toLowerCase() === input.item.toLowerCase(),
            ),
          ).toBeUndefined();
        }
        if (expectedList !== 'optional') {
          expect(
            result.optionalItems.find(
              (i) => i.item.toLowerCase() === input.item.toLowerCase(),
            ),
          ).toBeUndefined();
        }
        if (expectedList !== 'staple') {
          expect(
            result.stapleItems.find(
              (i) => i.item.toLowerCase() === input.item.toLowerCase(),
            ),
          ).toBeUndefined();
        }
      });
    },
  );

  test('every rule in ITEM_RULES is exercised by at least one test case', () => {
    const unexercisedRules: string[] = [];

    for (const rule of ITEM_RULES) {
      const isExercised = INGREDIENT_TEST_CASES.some((tc) =>
        rule.items.includes(tc.input.item.toLowerCase().trim()),
      );
      if (!isExercised) {
        unexercisedRules.push(rule.items.join(', '));
      }
    }

    expect(unexercisedRules).toEqual([]);
  });

  test('every unique ingredient in recipes is covered by at least one test case', () => {
    const allIngredients = getAllIngredientsFromContent();
    const uncoveredIngredients: string[] = [];

    for (const ing of allIngredients) {
      const isCovered = INGREDIENT_TEST_CASES.some(
        (tc) => tc.input.item.toLowerCase().trim() === ing.toLowerCase().trim(),
      );
      if (!isCovered) {
        uncoveredIngredients.push(ing);
      }
    }

    expect(uncoveredIngredients).toEqual([]);
  });
});
