import { describe, expect, test } from 'vitest';
// @ts-expect-error Node imports not available in front-end tsconfig
import * as fs from 'fs';
// @ts-expect-error Node imports not available in front-end tsconfig
import * as path from 'path';

declare const __dirname: string;

import { processShoppingList } from './pipeline';
import type { IngredientInput, ShoppingItem } from '../types';
import { ITEM_RULES } from '../data/rules';
import { getCanonicalName } from './recipeValidationPipeline';
import { STORE_LAYOUTS } from '../data/store-sections';
import { UNIT_LOOKUP } from '../constants';
import {
  isVolumeUnit,
  isWeightUnit,
  formatQtyValueWithUnit,
  convertQty,
  getSingularUnit,
  singularizeWord,
  pluralizeWord,
  isSizeOnlyUnit,
} from '../units';

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
      unit: 'box (4 sticks)',
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
      qty: 1,
      unit: 'box (4 sticks)',
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
      qty: 1,
      unit: 'carton (6 eggs)',
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
      qty: 1,
      unit: 'carton (18 eggs)',
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
      unit: 'bottle (16 fl oz)',
      category: 'fresh-produce',
      staple: 'in-pantry',
      sizeNote: '1 1/2 oz needed',
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
      qty: 1,
      unit: 'bottle (16 fl oz)',
      category: 'fresh-produce',
      staple: 'in-pantry',
      sizeNote: '2 oz needed',
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
      qty: 1,
      unit: 'pint (16 oz)',
      category: 'milk-cream',
      sizeNote: '1 1/2 cups needed',
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
      sizeNote: '3 cups needed',
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
      item: 'yellow onion',
      qty: 2,
      unit: 'yellow onions',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'cauliflower',
      qty: 6,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'cauliflower',
      qty: null,
      unit: '',
      category: 'fresh-produce',
      sizeNote: '6 cups needed',
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
      category: 'canned-other',
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
      qty: 1,
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
      category: 'canned-tomatoes',
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
      item: 'roasted red pepper',
      qty: 1,
      unit: 'jar (8 oz)',
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
      unit: 'package (17.5 oz)',
      category: 'pasta-grains',
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
      unit: 'bag (8 oz)',
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
      qty: 1,
      unit: 'bottle (48 fl oz)',
      category: 'oils-vinegars',
      staple: 'in-pantry',
      sizeNote: '1/8 cup needed',
    },
  },
  {
    input: {
      item: 'breakfast sausage',
      qty: 1,
      unit: 'pound',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'breakfast sausage',
      qty: 2,
      unit: 'packages (12 oz)',
      category: 'meat',
      sizeNote: '10 2/3 link needed',
    },
  },
  {
    input: {
      item: 'frozen hash browns',
      qty: 1,
      unit: 'pound',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'frozen hash browns',
      qty: 1,
      unit: 'pound',
      category: 'frozen',
    },
  },
  {
    input: {
      item: 'cheddar cheese',
      qty: 2,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'cheddar cheese',
      qty: 1,
      unit: 'package (8 oz)',
      category: 'butter-cheese',
      sizeNote: '2 cups needed',
    },
  },
  {
    input: {
      item: 'Italian seasoning',
      qty: 1,
      unit: 'teaspoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'Italian seasoning',
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      sizeNote: '1 tsp needed',
    },
  },
  {
    input: {
      item: 'chive',
      qty: 2,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'chive',
      qty: null,
      unit: '',
      category: 'fresh-herbs',
      sizeNote: '2 tbsp needed',
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
      qty: null,
      unit: '',
      category: 'snacks',
      sizeNote: '1/4 cup needed',
    },
  },
  {
    input: {
      item: 'sesame seed',
      qty: 0.25,
      unit: 'cup',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'sesame seed',
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
      sizeNote: '1/4 cup needed',
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
      qty: 8,
      unit: '',
      category: 'fresh-produce',
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
      qty: null,
      unit: '',
      category: 'poultry',
      sizeNote: '2 cups needed',
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
      qty: 1,
      unit: 'bag (4 lb)',
      category: 'baking',
      staple: 'in-pantry',
      sizeNote: '1/4 cup needed',
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
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
      sizeNote: '1 tsp needed',
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
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
      sizeNote: '1 tsp needed',
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
      qty: 1,
      unit: 'bottle (12 fl oz)',
      category: 'oils-vinegars',
      sizeNote: '3/8 cup needed',
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
      unit: 'jar (30 fl oz)',
      category: 'condiments',
      sizeNote: '1 cup needed',
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
      qty: null,
      unit: '',
      category: 'condiments',
      sizeNote: '1/4 cup needed',
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
      unit: 'bottle (17 oz)',
      category: 'condiments',
      sizeNote: '1 tbsp needed',
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
      unit: 'bottle (12 oz)',
      category: 'condiments',
      sizeNote: '1 tbsp needed',
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
      qty: 1,
      unit: 'bottle (16 fl oz)',
      category: 'fresh-produce',
      staple: 'in-pantry',
      sizeNote: '1/2 oz needed',
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
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
      sizeNote: '1 tsp needed',
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
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
      sizeNote: '1 tsp needed',
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
      unit: 'bottle (10 fl oz)',
      category: 'condiments',
      sizeNote: '1 tbsp needed',
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
    expectedList: 'staple',
    expectedItem: {
      item: 'brown sugar',
      qty: 1,
      unit: 'bag (2 lb)',
      category: 'baking',
      sizeNote: '0.06 cup needed',
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
      unit: 'bottle (16.9 fl oz)',
      category: 'oils-vinegars',
      staple: 'in-pantry',
      sizeNote: '0.06 cup needed',
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
      unit: '',
      category: 'fresh-produce',
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
      unit: '',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'green bean',
      qty: 1,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'green bean',
      qty: null,
      unit: '',
      category: 'fresh-produce',
      sizeNote: '1 cup needed',
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
      item: 'cabbage',
      qty: 1,
      unit: 'head',
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
      prep: 'peeled and cut into 1/2-inch chunks',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'beet',
      qty: 1,
      unit: 'pound',
      category: 'fresh-produce',
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
      unit: '',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'parmesan',
      qty: 3,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'parmesan',
      qty: 1,
      unit: 'wedge (8 oz)',
      category: 'butter-cheese',
      sizeNote: '7/8 oz needed',
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
      qty: 1,
      unit: 'box (16 oz)',
      category: 'pasta-grains',
      sizeNote: '16 oz needed',
    },
  },
  {
    input: {
      item: 'dried basil',
      qty: 1,
      unit: 'teaspoon',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'dried basil',
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
      sizeNote: '1 tsp needed',
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
      unit: 'bottle (32 fl oz)',
      category: 'milk-cream',
      sizeNote: '1 cup needed',
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
      qty: null,
      unit: '',
      category: 'frozen',
      sizeNote: '1 cup needed',
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
      qty: null,
      unit: '',
      category: 'beverages',
      sizeNote: '1/4 cup needed',
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
      qty: null,
      unit: '',
      category: 'fresh-herbs',
      sizeNote: '2 tbsp needed',
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
      category: 'oils-vinegars',
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
      unit: '',
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
      unit: 'jar (14 oz)',
      category: 'oils-vinegars',
      sizeNote: '0.06 cup needed',
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
      unit: 'bag (8 oz)',
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
      unit: '',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'fire roasted tomato',
      qty: 1,
      unit: 'can (28 ounce)',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'fire roasted tomato',
      qty: 1,
      unit: 'can (28 oz)',
      category: 'canned-tomatoes',
      sizeNote: '28 oz needed',
    },
  },
  {
    input: {
      item: 'curry powder',
      qty: 1,
      unit: 'tablespoon',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'curry powder',
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
      sizeNote: '1 tbsp needed',
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
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
      sizeNote: '1 tsp needed',
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
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
      sizeNote: '1/2 tsp needed',
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
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
      sizeNote: '3/4 tsp needed',
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
      qty: 2,
      unit: 'cans (15 oz)',
      category: 'canned-beans',
      sizeNote: '30 oz needed',
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
      category: 'canned-other',
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
      qty: 1,
      unit: 'lime',
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
      qty: null,
      unit: '',
      category: 'fresh-herbs',
      sizeNote: '4 tbsp needed',
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
      category: 'fresh-produce',
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
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
      sizeNote: '1 tsp needed',
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
      unit: 'package (17.5 oz)',
      category: 'pasta-grains',
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
      qty: 1,
      unit: 'package (12 oz)',
      category: 'meat',
      sizeNote: '8 oz needed',
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
      item: 'roasted red pepper',
      qty: 1,
      unit: 'jar (8 oz)',
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
      item: 'yellow onion',
      qty: 1,
      unit: 'yellow onion',
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
      unit: 'package (19 oz)',
      category: 'meat',
      sizeNote: '16 oz needed',
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
      qty: 1,
      unit: 'carton (6 eggs)',
      category: 'eggs',
      sizeNote: '3 eggs needed',
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
      unit: 'bottle (2 fl oz)',
      category: 'baking',
      staple: 'in-pantry',
      sizeNote: '3 tsp needed',
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
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
      sizeNote: '1 1/2 tsp needed',
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
      sizeNote: '3/4 cup needed',
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
      unit: 'box (4 sticks)',
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
      sizeNote: '1 1/2 cups needed',
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
      qty: 1,
      unit: 'carton (6 eggs)',
      category: 'eggs',
      sizeNote: '1 egg needed',
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
      sizeNote: '16 oz needed',
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
      unit: 'wedge (8 oz)',
      category: 'butter-cheese',
      sizeNote: '4 oz needed',
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
      optional: true,
    },
    expectedList: 'optional',
    expectedItem: {
      item: 'peanut butter',
      qty: 1,
      unit: 'jar (16 oz)',
      category: 'condiments',
      sizeNote: '1 cup needed',
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
      qty: 1,
      unit: 'can (8.1 oz)',
      category: 'baking',
      staple: 'in-pantry',
      sizeNote: '1 1/2 tsp needed',
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
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
      sizeNote: '1/2 tsp needed',
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
      qty: 1,
      unit: 'bag (12 oz)',
      category: 'baking',
      sizeNote: '3 oz needed',
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
      qty: null,
      unit: '',
      category: 'fresh-produce',
      sizeNote: '1 cup needed',
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
      qty: null,
      unit: '',
      category: 'baking',
      sizeNote: '1/2 cup needed',
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
      category: 'baking',
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
      qty: 1,
      unit: 'bag (2 lb)',
      category: 'baking',
      sizeNote: '1/4 cup needed',
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
      qty: null,
      unit: '',
      category: 'fresh-produce',
      sizeNote: '1 cup needed',
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
      qty: null,
      unit: '',
      category: 'fresh-produce',
      sizeNote: '1 cup needed',
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
      item: 'French bread',
      qty: 1,
      unit: 'loaf',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'French bread',
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
      sizeNote: '8 oz needed',
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
      unit: 'jar (30 fl oz)',
      category: 'condiments',
      sizeNote: '0.06 cup needed',
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
      qty: null,
      unit: '',
      category: 'snacks',
      sizeNote: '1 cup needed',
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
      qty: null,
      unit: '',
      category: 'condiments',
      sizeNote: '1 1/2 tbsp needed',
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
      unit: 'jar (4 oz)',
      category: 'condiments',
      sizeNote: '1 tbsp needed',
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
      qty: 1,
      unit: 'bottle (16.9 fl oz)',
      category: 'oils-vinegars',
      sizeNote: '1/8 cup needed',
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
    expectedList: 'staple',
    expectedItem: {
      item: 'cumin',
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
      sizeNote: '1/4 tsp needed',
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
      item: 'fenugreek',
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      sizeNote: '2 tbsp needed',
    },
  },
  {
    input: {
      item: 'coriander powder',
      qty: 2.5,
      unit: 'teaspoon',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'coriander',
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
      sizeNote: '2 1/2 tsp needed',
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
      item: 'cayenne',
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
      sizeNote: '1/2 tsp needed',
    },
  },
  {
    input: {
      item: 'garam masala powder',
      qty: 0.25,
      unit: 'teaspoon',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'garam masala',
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
      sizeNote: '1/4 tsp needed',
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
      category: 'canned-tomatoes',
      sizeNote: '15 oz needed',
    },
  },
  {
    input: {
      item: 'tomato paste',
      qty: 1,
      unit: 'can (6-ounce)',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'tomato paste',
      qty: 1,
      unit: 'can (6 oz)',
      category: 'canned-tomatoes',
      sizeNote: '6 oz needed',
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
      qty: null,
      unit: '',
      category: 'snacks',
      sizeNote: '3 tbsp needed',
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
      unit: 'cans (15 oz)',
      category: 'canned-beans',
      sizeNote: '30 oz needed',
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
      qty: 1,
      unit: 'bottle (12 fl oz)',
      category: 'condiments',
      sizeNote: '1/8 cup needed',
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
      qty: 1,
      unit: 'box (8 oz)',
      category: 'pasta-grains',
      sizeNote: '1 oz needed',
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
      qty: 1,
      unit: 'bottle (15 fl oz)',
      category: 'condiments',
      sizeNote: '2 tbsp needed',
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
      unit: 'bottle (16 fl oz)',
      category: 'fresh-produce',
      staple: 'in-pantry',
      sizeNote: '1 1/2 oz needed',
    },
  },
  {
    input: {
      item: 'all-purpose flour',
      qty: 1.5,
      unit: 'cup',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'all-purpose flour',
      qty: 1,
      unit: 'bag (5 lb)',
      category: 'baking',
      staple: 'in-pantry',
      sizeNote: '1 1/2 cups needed',
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
      qty: 1,
      unit: 'box (16 oz)',
      category: 'baking',
      staple: 'in-pantry',
      sizeNote: '1/4 tsp needed',
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
      sizeNote: '1/2 cup needed',
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
      qty: 1,
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
      qty: null,
      unit: '',
      category: 'bakery',
      sizeNote: '9 oz needed',
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
      qty: 1,
      unit: 'bag (4 lb)',
      category: 'baking',
      sizeNote: '1/4 cup needed',
    },
  },
  {
    input: {
      item: 'raw sugar',
      qty: 0.25,
      unit: 'cup',
      prep: 'for topping',
      optional: true,
    },
    expectedList: 'optional',
    expectedItem: {
      item: 'raw sugar',
      qty: null,
      unit: '',
      category: 'baking',
      sizeNote: '1/4 cup needed',
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
      unit: 'can (14 oz)',
      category: 'milk-cream',
      sizeNote: '14 oz needed',
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
    expectedList: 'staple',
    expectedItem: {
      item: 'brown sugar',
      qty: 1,
      unit: 'bag (2 lb)',
      category: 'baking',
      sizeNote: '1/4 cup needed',
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
      qty: null,
      unit: '',
      category: 'fresh-produce',
      sizeNote: '1/2 tsp needed',
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
      qty: 1,
      unit: 'box (32 oz)',
      category: 'baking',
      sizeNote: '2 1/2 cups needed',
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
      unit: 'package (8 oz)',
      category: 'butter-cheese',
      sizeNote: '8 oz needed',
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
      qty: 1,
      unit: 'bag (2 lb)',
      category: 'baking',
      sizeNote: '4 cups needed',
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
      qty: null,
      unit: '',
      category: 'fresh-produce',
      sizeNote: '1/2 cup needed',
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
      unit: 'sweet onion',
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
      item: 'fresh thyme',
      qty: 1,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'fresh thyme',
      qty: null,
      unit: '',
      category: 'fresh-herbs',
      sizeNote: '1 tbsp needed',
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
      qty: null,
      unit: '',
      category: 'condiments',
      sizeNote: '2/3 cup needed',
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
      qty: 1,
      unit: 'jar (30 fl oz)',
      category: 'condiments',
      sizeNote: '3/4 cup needed',
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
      qty: null,
      unit: '',
      category: 'fresh-herbs',
      sizeNote: '1/3 cup needed',
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
      qty: null,
      unit: '',
      category: 'fresh-herbs',
      sizeNote: '1/4 cup needed',
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
      qty: 1,
      unit: 'jar (8 oz)',
      category: 'condiments',
      sizeNote: '1 1/3 tbsp needed',
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
      qty: 1,
      unit: 'tub (17.6 oz)',
      category: 'condiments',
      sizeNote: '2 tbsp needed',
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
      qty: 1,
      unit: 'bottle (12 fl oz)',
      category: 'oils-vinegars',
      sizeNote: '1/8 cup needed',
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
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
      sizeNote: '1 tsp needed',
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
      item: 'beef broth',
      qty: 1,
      unit: 'pint (16 fl oz)',
      category: 'canned-other',
      sizeNote: '1 cup needed',
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
      qty: null,
      unit: '',
      category: 'fresh-produce',
      sizeNote: '2 cups needed',
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
      qty: 1,
      unit: 'package (8 oz)',
      category: 'butter-cheese',
      sizeNote: '4 oz needed',
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
      qty: 1,
      unit: 'red onion',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'Kalamata olive',
      qty: 0.5,
      unit: 'cup',
      desc: 'pitted',
      prep: 'pitted and halved',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'Kalamata olive',
      qty: null,
      unit: '',
      category: 'condiments',
      sizeNote: '1/2 cup needed',
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
      qty: null,
      unit: '',
      category: 'fresh-herbs',
      sizeNote: '1 cup needed',
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
      qty: 1,
      unit: 'bottle (16 fl oz)',
      category: 'oils-vinegars',
      sizeNote: '1/4 cup needed',
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
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
      sizeNote: '1 tsp needed',
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
      qty: 1,
      unit: 'tub (32 oz)',
      category: 'milk-cream',
      sizeNote: '1/3 cup needed',
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
      qty: 1,
      unit: 'half-gallon (64 fl oz)',
      category: 'milk-cream',
      sizeNote: '2/3 cup needed',
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
      qty: null,
      unit: '',
      category: 'baking',
      sizeNote: '1/2 tbsp needed',
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
      qty: 1,
      unit: 'tub (42 oz)',
      category: 'pasta-grains',
      sizeNote: '1/2 cup needed',
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
      unit: 'can (8 oz)',
      category: 'bakery',
    },
  },
  {
    input: {
      item: 'crescent roll dough',
      qty: 1,
      unit: 'can',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'crescent roll dough',
      qty: 1,
      unit: 'can (8 oz)',
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
      item: 'cocktail wiener',
      qty: 1,
      unit: 'package (14 oz)',
      category: 'meat',
      sizeNote: '14 oz needed',
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
    expectedList: 'staple',
    expectedItem: {
      item: 'smoked paprika',
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
      sizeNote: '2 tsp needed',
    },
  },
  {
    input: {
      item: 'poblano pepper',
      qty: 1,
      prep: 'diced',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'poblano pepper',
      qty: 1,
      unit: '',
      category: 'fresh-produce',
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
      qty: null,
      unit: '',
      category: 'condiments',
      sizeNote: '2 cups needed',
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
      qty: 3,
      unit: 'pints (16 fl oz)',
      category: 'canned-other',
      sizeNote: '6 cups needed',
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
      sizeNote: '14 oz needed',
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
      qty: 1,
      unit: 'bag (2 lb)',
      category: 'pasta-grains',
      sizeNote: '3 cups needed',
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
      category: 'snacks',
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
      unit: '',
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
      sizeNote: '16 oz needed',
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
      qty: null,
      unit: '',
      category: 'beverages',
      sizeNote: '1 1/2 tbsp needed',
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
      unit: '',
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
      qty: null,
      unit: '',
      category: 'condiments',
      sizeNote: '1/4 cup needed',
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
      qty: 1,
      unit: 'bottle (48 fl oz)',
      category: 'oils-vinegars',
      staple: 'in-pantry',
      sizeNote: '0.19 cup needed',
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
      qty: null,
      unit: '',
      category: 'fresh-produce',
      sizeNote: '4 oz needed',
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
      qty: 1,
      unit: 'bottle (5 fl oz)',
      category: 'oils-vinegars',
      sizeNote: '2/3 tbsp needed',
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
      qty: 1,
      unit: 'package (16 oz)',
      category: 'meat',
      sizeNote: '2 oz needed',
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
      unit: '',
      category: 'canned-other',
    },
  },
  {
    input: {
      item: 'bay leaf',
      qty: 1,
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'bay leaf',
      qty: 1,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
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
      unit: 'pint (16 fl oz)',
      category: 'milk-cream',
      sizeNote: '1 cup needed',
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
      unit: 'package (5 oz)',
      category: 'fresh-produce',
      sizeNote: '1 oz needed',
    },
  },
  {
    input: {
      item: 'green bell pepper',
      qty: 1,
      prep: 'diced',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'green bell pepper',
      qty: 1,
      unit: '',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'frozen corn',
      qty: 1,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'frozen corn',
      qty: null,
      unit: '',
      category: 'frozen',
      sizeNote: '1 cup needed',
    },
  },
  {
    input: {
      item: 'refried beans',
      qty: 1,
      unit: 'can',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'refried beans',
      qty: 1,
      unit: 'can (15 oz)',
      category: 'canned-beans',
      sizeNote: '15 oz needed',
    },
  },
  {
    input: {
      item: 'green enchilada sauce',
      qty: 1.5,
      unit: 'cup',
      desc: 'divided',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'green enchilada sauce',
      qty: 2,
      unit: 'cans (10 oz)',
      category: 'condiments',
      sizeNote: '12 oz needed',
    },
  },
  {
    input: {
      item: 'tortilla',
      qty: 12,
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'tortillas',
      qty: 1,
      unit: 'package of 24',
      category: 'bakery',
      sizeNote: '12 needed',
    },
  },
  {
    input: {
      item: 'jalapeño slices',
      prep: 'for topping',
      optional: true,
    },
    expectedList: 'optional',
    expectedItem: {
      item: 'jalapeño',
      qty: null,
      unit: '',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'vegan cream cheese',
      qty: 8,
      unit: 'ounce',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'vegan cream cheese',
      qty: 1,
      unit: 'package (8 oz)',
      category: 'butter-cheese',
      sizeNote: '8 oz needed',
    },
  },
  {
    input: {
      item: 'ricotta',
      qty: 1,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'ricotta',
      qty: 1,
      unit: 'half-pint (8 oz)',
      category: 'butter-cheese',
      sizeNote: '1 cup needed',
    },
  },
  {
    input: {
      item: 'salmon',
      qty: 1,
      unit: 'pound',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'salmon',
      qty: 1,
      unit: 'pound',
      category: 'seafood',
    },
  },
  {
    input: {
      item: 'peach',
      qty: 1,
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'peach',
      qty: 1,
      unit: '',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'ground pork',
      qty: 1,
      unit: 'pound',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'ground pork',
      qty: 1,
      unit: 'pound',
      category: 'meat',
    },
  },
  {
    input: {
      item: 'ricotta',
      qty: 0.5,
      unit: 'cup',
      desc: 'whole-milk',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'ricotta',
      qty: 1,
      unit: 'half-pint (8 oz)',
      category: 'butter-cheese',
      sizeNote: '1/2 cup needed',
    },
  },
  {
    input: {
      item: 'bread crumbs',
      qty: 0.5,
      unit: 'cup',
      desc: 'plain dry',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'bread crumbs',
      qty: 1,
      unit: 'box (8 oz)',
      category: 'pasta-grains',
      sizeNote: '1 oz needed',
    },
  },
  {
    input: {
      item: 'Japanese cucumber',
      qty: 3,
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'Japanese cucumber',
      qty: 3,
      unit: '',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'walnut',
      qty: 2,
      unit: 'tablespoon',
      desc: 'roasted',
      prep: 'chopped',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'walnut',
      qty: null,
      unit: '',
      category: 'fresh-produce',
      sizeNote: '2 tbsp needed',
    },
  },
  {
    input: {
      item: 'pistachio',
      qty: 2,
      unit: 'tablespoon',
      desc: 'roasted',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'pistachio',
      qty: null,
      unit: '',
      category: 'fresh-produce',
      sizeNote: '2 tbsp needed',
    },
  },
  {
    input: {
      item: 'sumac',
      optional: true,
    },
    expectedList: 'optional',
    expectedItem: {
      item: 'sumac',
      qty: null,
      unit: '',
      category: 'spices-seasonings',
    },
  },
  {
    input: {
      item: 'quinoa',
      qty: 1.5,
      unit: 'cup',
      desc: 'cooked',
      prep: 'cooled',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'quinoa',
      qty: 1,
      unit: 'bag (16 oz)',
      category: 'pasta-grains',
      sizeNote: '1 1/2 cups needed',
    },
  },
  {
    input: {
      item: 'fish sauce',
      qty: 2,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'fish sauce',
      qty: 1,
      unit: 'bottle (7 fl oz)',
      category: 'condiments',
      sizeNote: '2 tbsp needed',
    },
  },
  {
    input: {
      item: 'cremini mushroom',
      qty: 8,
      unit: 'ounce',
      prep: 'sliced',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'cremini mushroom',
      qty: null,
      unit: '',
      category: 'fresh-produce',
      sizeNote: '8 oz needed',
    },
  },
  {
    input: {
      item: 'ramen noodle',
      qty: 2,
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'ramen noodle',
      qty: 2,
      unit: '',
      category: 'pasta-grains',
    },
  },
  {
    input: {
      item: 'peanuts',
      optional: true,
      prep: 'chopped',
    },
    expectedList: 'optional',
    expectedItem: {
      item: 'peanuts',
      qty: null,
      unit: '',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'white vinegar',
      qty: 1,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'white vinegar',
      qty: 1,
      unit: 'bottle (32 fl oz)',
      category: 'oils-vinegars',
      sizeNote: '0.06 cup needed',
    },
  },
  {
    input: {
      item: 'sweet potato',
      qty: 2,
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'sweet potato',
      qty: 2,
      unit: '',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'taco seasoning',
      qty: 2,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'taco seasoning',
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      sizeNote: '2 tbsp needed',
    },
  },
  {
    input: {
      item: 'chicken meatball',
      qty: 1,
      unit: 'pound',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'chicken meatball',
      qty: 1,
      unit: 'pound',
      category: 'poultry',
    },
  },
  {
    input: {
      item: 'rotisserie chicken',
      qty: 1,
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'rotisserie chicken',
      qty: 1,
      unit: '',
      category: 'poultry',
    },
  },
  {
    input: {
      item: 'butternut squash',
      qty: 3,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'butternut squash',
      qty: null,
      unit: '',
      category: 'fresh-produce',
      sizeNote: '3 cups needed',
    },
  },
  {
    input: {
      item: 'gruyere cheese',
      qty: 1,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'gruyere cheese',
      qty: 1,
      unit: 'package (8 oz)',
      category: 'butter-cheese',
      sizeNote: '4 oz needed',
    },
  },
  {
    input: {
      item: 'swiss cheese',
      qty: 1,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'swiss cheese',
      qty: 1,
      unit: 'package (8 oz)',
      category: 'butter-cheese',
      sizeNote: '4 oz needed',
    },
  },
  {
    input: {
      item: 'chili pepper',
      qty: 1,
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'chili pepper',
      qty: 1,
      unit: '',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'kidney bean',
      qty: 1,
      unit: 'can (15-ounce)',
      prep: 'drained and rinsed',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'kidney bean',
      qty: 1,
      unit: 'can (15 oz)',
      category: 'canned-beans',
      sizeNote: '15 oz needed',
    },
  },
  {
    input: {
      item: 'crushed tomato',
      qty: 1,
      unit: 'can (28-ounce)',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'crushed tomato',
      qty: 1,
      unit: 'can (28 oz)',
      category: 'canned-tomatoes',
      sizeNote: '28 oz needed',
    },
  },
  {
    input: {
      item: 'greek yogurt',
      prep: 'for serving',
      optional: true,
    },
    expectedList: 'optional',
    expectedItem: {
      item: 'greek yogurt',
      qty: null,
      unit: '',
      category: 'milk-cream',
    },
  },
  {
    input: {
      item: 'mexican cheese',
      desc: 'shredded',
      prep: 'for serving',
      optional: true,
    },
    expectedList: 'optional',
    expectedItem: {
      item: 'mexican cheese',
      qty: null,
      unit: '',
      category: 'butter-cheese',
    },
  },
  {
    input: {
      item: 'tortilla chips',
      prep: 'for serving',
      optional: true,
    },
    expectedList: 'optional',
    expectedItem: {
      item: 'tortilla chips',
      qty: null,
      unit: '',
      category: 'snacks',
    },
  },
  {
    input: {
      item: 'cornbread',
      prep: 'for serving',
      optional: true,
    },
    expectedList: 'optional',
    expectedItem: {
      item: 'cornbread',
      qty: null,
      unit: '',
      category: 'bakery',
    },
  },
  {
    input: {
      item: 'cayenne',
      qty: 1,
      unit: 'teaspoon',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'cayenne',
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
      sizeNote: '1 tsp needed',
    },
  },
  {
    input: {
      item: 'minced garlic',
      qty: 1,
      unit: 'tbsp',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'minced garlic',
      qty: null,
      unit: '',
      category: 'canned-other',
      sizeNote: '1 tbsp needed',
    },
  },
  {
    input: {
      item: 'beef broth',
      qty: 1,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'beef broth',
      qty: 1,
      unit: 'pint (16 fl oz)',
      category: 'canned-other',
      sizeNote: '1 cup needed',
    },
  },
  {
    input: {
      item: 'white onion',
      qty: 1,
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'white onion',
      qty: 1,
      unit: '',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'yellow bell pepper',
      qty: 1,
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'yellow bell pepper',
      qty: 1,
      unit: '',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'fresh thyme',
      qty: 1,
      unit: 'tbsp',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'fresh thyme',
      qty: null,
      unit: '',
      category: 'fresh-herbs',
      sizeNote: '1 tbsp needed',
    },
  },
  {
    input: {
      item: 'dried sage',
      qty: 1,
      unit: 'tsp',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'dried sage',
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      sizeNote: '1 tsp needed',
    },
  },
  {
    input: {
      item: 'bread flour',
      qty: 1,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'bread flour',
      qty: 1,
      unit: 'bag (5 lb)',
      category: 'baking',
      sizeNote: '1 cup needed',
    },
  },
  {
    input: {
      item: 'cornstarch',
      qty: 1,
      unit: 'tbsp',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'cornstarch',
      qty: 1,
      unit: 'box (16 oz)',
      category: 'baking',
      sizeNote: '1 tbsp needed',
    },
  },
  {
    input: {
      item: 'yeast',
      qty: 1,
      unit: 'package',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'yeast',
      qty: 1,
      unit: 'package',
      category: 'baking',
    },
  },
  {
    input: {
      item: 'dried thyme',
      qty: 1,
      unit: 'tsp',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'dried thyme',
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      sizeNote: '1 tsp needed',
    },
  },
  {
    input: {
      item: 'mozzarella',
      qty: 1,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'mozzarella',
      qty: 1,
      unit: 'package (8 oz)',
      category: 'butter-cheese',
      sizeNote: '1 cup needed',
    },
  },
  {
    input: {
      item: 'apple cider vinegar',
      qty: 1,
      unit: 'tbsp',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'apple cider vinegar',
      qty: 1,
      unit: 'bottle (16 fl oz)',
      category: 'oils-vinegars',
      sizeNote: '0.06 cup needed',
    },
  },
  {
    input: {
      item: 'balsamic vinegar',
      qty: 1,
      unit: 'tbsp',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'balsamic vinegar',
      qty: 1,
      unit: 'bottle (16.9 fl oz)',
      category: 'oils-vinegars',
      sizeNote: '0.06 cup needed',
    },
  },
  {
    input: {
      item: 'fresh oregano',
      qty: 1,
      unit: 'tbsp',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'fresh oregano',
      qty: null,
      unit: '',
      category: 'fresh-herbs',
      sizeNote: '1 tbsp needed',
    },
  },
  {
    input: {
      item: 'dried basil',
      qty: 1,
      unit: 'tsp',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'dried basil',
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      sizeNote: '1 tsp needed',
    },
  },
  {
    input: {
      item: 'fresh basil',
      qty: 1,
      unit: 'bunch',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'fresh basil',
      qty: 1,
      unit: 'bunch',
      category: 'fresh-herbs',
    },
  },
  {
    input: {
      item: 'hot dog',
      qty: 1,
      unit: 'package',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'hot dog',
      qty: 1,
      unit: 'package (8 hot dogs)',
      category: 'meat',
      sizeNote: '8 hot dog needed',
    },
  },
  {
    input: {
      item: 'cocktail wiener',
      qty: 1,
      unit: 'package',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'cocktail wiener',
      qty: 1,
      unit: 'package (14 oz)',
      category: 'meat',
      sizeNote: '14 oz needed',
    },
  },
  {
    input: {
      item: 'cannellini beans',
      qty: 1,
      unit: 'can',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'cannellini beans',
      qty: 1,
      unit: 'can (15 oz)',
      category: 'canned-beans',
      sizeNote: '15 oz needed',
    },
  },
  {
    input: {
      item: 'pinto beans',
      qty: 1,
      unit: 'can',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'pinto beans',
      qty: 1,
      unit: 'can (15 oz)',
      category: 'canned-beans',
      sizeNote: '15 oz needed',
    },
  },
  {
    input: {
      item: 'turmeric',
      qty: 1,
      unit: 'tsp',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'turmeric',
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
      sizeNote: '1 tsp needed',
    },
  },
  {
    input: {
      item: 'cardamom',
      qty: 1,
      unit: 'tsp',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'cardamom',
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
      sizeNote: '1 tsp needed',
    },
  },
  {
    input: {
      item: 'cloves',
      qty: 1,
      unit: 'tsp',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'cloves',
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
      sizeNote: '1 tsp needed',
    },
  },
  {
    input: {
      item: 'fennel seed',
      qty: 1,
      unit: 'teaspoon',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'fennel seed',
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
      sizeNote: '1 tsp needed',
    },
  },
  {
    input: {
      item: 'white wine',
      qty: 1,
      unit: 'cup',
      desc: 'dry',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'dry white wine',
      qty: 1,
      unit: 'cup',
      category: 'beverages',
    },
  },
  {
    input: {
      item: 'chicken stock',
      qty: 2.5,
      unit: 'cup',
      desc: 'low-sodium',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'chicken broth',
      qty: 1,
      unit: 'quart (32 fl oz)',
      category: 'canned-other',
      sizeNote: '2 1/2 cups needed',
    },
  },
  {
    input: {
      item: 'Italian sub roll',
      qty: 4,
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'sub roll',
      qty: 4,
      unit: '',
      category: 'bakery',
    },
  },
  {
    input: {
      item: 'bell pepper',
      qty: 3,
      unit: 'medium',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'bell pepper',
      qty: 3,
      unit: 'medium',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'graham cracker crumb',
      qty: 1.75,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'graham cracker crumb',
      qty: 1,
      unit: 'box (13.5 oz)',
      category: 'baking',
      sizeNote: '1 3/4 cups needed',
    },
  },
  {
    input: {
      item: 'cream of tartar',
      qty: 0.25,
      unit: 'teaspoon',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'cream of tartar',
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
      sizeNote: '1/4 tsp needed',
    },
  },
  {
    input: {
      item: 'celery seed',
      qty: 0.25,
      unit: 'teaspoon',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'celery seed',
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
      sizeNote: '1/4 tsp needed',
    },
  },
  {
    input: {
      item: 'celery salt',
      qty: 0.25,
      unit: 'teaspoon',
    },
    expectedList: 'staple',
    expectedItem: {
      item: 'celery salt',
      qty: null,
      unit: '',
      category: 'spices-seasonings',
      staple: 'in-pantry',
      sizeNote: '1/4 tsp needed',
    },
  },
  {
    input: {
      item: 'tomato',
      qty: 1,
      unit: 'large',
      prep: 'diced',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'tomato',
      qty: 1,
      unit: 'large',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'green pepper',
      qty: 2,
      unit: 'tablespoon',
      prep: 'chopped',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'green pepper',
      qty: 2,
      unit: 'tablespoon',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'watermelon',
      qty: 4,
      unit: 'cup',
      desc: 'seeded',
      prep: 'cubed',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'watermelon',
      qty: 4,
      unit: 'cup',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'salmon fillet',
      qty: 4,
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'salmon fillet',
      qty: 4,
      unit: '',
      category: 'seafood',
    },
  },
  {
    input: {
      item: 'red potato',
      qty: 3,
      unit: 'medium',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'red potato',
      qty: 3,
      unit: 'medium',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'Swedish meatball',
      qty: 2,
      unit: 'pound',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'Swedish meatball',
      qty: 1,
      unit: 'bag (32 oz)',
      category: 'frozen',
      sizeNote: '2 lbs needed',
    },
  },
  {
    input: {
      item: 'Worcestershire sauce',
      qty: 2,
      unit: 'teaspoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'Worcestershire sauce',
      qty: 1,
      unit: 'bottle (10 fl oz)',
      category: 'condiments',
      sizeNote: '2 tsp needed',
    },
  },
  {
    input: {
      item: 'lingonberry jam',
      qty: 1,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'lingonberry jam',
      qty: 1,
      unit: 'jar (14 oz)',
      category: 'condiments',
      sizeNote: '1 tbsp needed',
    },
  },
  {
    input: {
      item: 'cranberry sauce',
      qty: 1,
      unit: 'tablespoon',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'cranberry sauce',
      qty: 1,
      unit: 'can (14 oz)',
      category: 'condiments',
      sizeNote: '1 tbsp needed',
    },
  },
  {
    input: {
      item: 'fennel',
      qty: 1,
      unit: '',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'fennel',
      qty: 1,
      unit: '',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'leek',
      qty: 1,
      unit: '',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'leek',
      qty: 1,
      unit: '',
      category: 'fresh-produce',
    },
  },
  {
    input: {
      item: 'sushi rice',
      qty: 1,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'rice',
      qty: 1,
      unit: 'bag (2 lb)',
      category: 'pasta-grains',
      sizeNote: '1 cup needed',
    },
  },
  {
    input: {
      item: 'penne pasta',
      qty: 8,
      unit: 'ounce',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'penne pasta',
      qty: 1,
      unit: 'box (16 oz)',
      category: 'pasta-grains',
      sizeNote: '8 oz needed',
    },
  },
  {
    input: {
      item: 'spaghetti sauce',
      qty: 3,
      unit: 'cup',
    },
    expectedList: 'buy',
    expectedItem: {
      item: 'spaghetti sauce',
      qty: 1,
      unit: 'can (28 oz)',
      category: 'canned-tomatoes',
      sizeNote: '24 oz needed',
    },
  },
];

function getAllIngredientsFromContent(): string[] {
  const contentDir = path.resolve(__dirname, '../../../../../../content');
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

function normalizeUnitForAssertion(unit: string | undefined): string {
  if (!unit) {
    return '';
  }
  return unit
    .toLowerCase()
    .replace(/[\s-]/g, '')
    .replace(/ounces|ounce|floz/g, 'oz');
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

        const canonicalName = getCanonicalName(input.item);
        const searchName = canonicalName || input.item;
        const rule = ITEM_RULES.find((r) => r.canonicalName === searchName);

        let list: ShoppingItem[];
        if (expectedList === 'buy') {
          list = result.buyItems;
        } else if (expectedList === 'optional') {
          list = result.optionalItems;
        } else {
          list = result.stapleItems;
        }

        if (searchName.toLowerCase().trim() === 'water') {
          const item =
            result.buyItems.find((i) => i.item.toLowerCase() === 'water') ||
            result.optionalItems.find(
              (i) => i.item.toLowerCase() === 'water',
            ) ||
            result.stapleItems.find((i) => i.item.toLowerCase() === 'water');
          expect(item).toBeUndefined();
          return;
        }

        const item = list.find(
          (i) => i.item.toLowerCase() === searchName.toLowerCase(),
        );
        expect(item).toBeDefined();
        expect(item?.category).toBe(expectedItem.category);

        let adjExpectedQty = expectedItem.qty;
        let adjExpectedUnit = expectedItem.unit;
        let adjExpectedSizeNote = expectedItem.sizeNote;

        const isVol = isVolumeUnit(expectedItem.unit);
        const isWt = isWeightUnit(expectedItem.unit);
        const isCountable = !isVol && !isWt && expectedItem.unit !== '';

        const itemSizes =
          STORE_LAYOUTS[0]?.itemSizes?.[searchName.toLowerCase()] ||
          STORE_LAYOUTS[0]?.itemSizes?.[input.item.toLowerCase()] ||
          (rule
            ? STORE_LAYOUTS[0]?.itemSizes?.[rule.canonicalName.toLowerCase()] ||
              rule.items
                .map((i) =>
                  typeof i === 'string'
                    ? STORE_LAYOUTS[0]?.itemSizes?.[i.toLowerCase()]
                    : STORE_LAYOUTS[0]?.itemSizes?.[i.singular.toLowerCase()],
                )
                .find(Boolean)
            : undefined);
        const hasSizes = !!itemSizes && itemSizes.length > 0;

        const isPackageSize = [
          'can',
          'pack',
          'bag',
          'bottle',
          'wedge',
          'box',
          'pint',
          'quart',
        ].some((p) => expectedItem.unit.toLowerCase().includes(p));

        const ruleBaseUnit = rule?.unitEquivalences
          ? Object.values(rule.unitEquivalences)[0].base
          : '';
        if (
          getSingularUnit(expectedItem.unit) ===
            getSingularUnit(ruleBaseUnit) &&
          (input.unit || '') === '' &&
          !hasSizes
        ) {
          adjExpectedUnit = '';
        }

        if (isVol && !isPackageSize) {
          adjExpectedQty = null;
          adjExpectedUnit = '';
        } else if (isPackageSize || isCountable || adjExpectedUnit === '') {
          if (expectedItem.qty !== null) {
            adjExpectedQty = Math.ceil(expectedItem.qty);
          }
        }

        if (adjExpectedQty === 1 && adjExpectedUnit !== '') {
          adjExpectedUnit = getSingularUnit(adjExpectedUnit);
        }

        if (expectedItem.sizeNote !== undefined && input.qty !== undefined) {
          if (
            (!isVol && !isWt && !hasSizes) ||
            (input.unit || '') === '' ||
            (input.unit &&
              getSingularUnit(input.unit) === getSingularUnit(item?.unit || ''))
          ) {
            adjExpectedSizeNote = undefined;
          } else {
            const targetUnit = rule?.unitEquivalences
              ? Object.values(rule.unitEquivalences)[0].base
              : input.unit || '';
            let expectedConvertedQty = input.qty;
            let expectedConvertedUnit = input.unit || '';
            if (input.unit && targetUnit && input.unit !== targetUnit) {
              if (Array.isArray(input.qty)) {
                expectedConvertedQty = [
                  convertQty(input.qty[0], input.unit, targetUnit, rule),
                  convertQty(input.qty[1], input.unit, targetUnit, rule),
                ];
              } else {
                expectedConvertedQty = convertQty(
                  input.qty,
                  input.unit,
                  targetUnit,
                  rule,
                );
              }
              expectedConvertedUnit = targetUnit;
            }
            adjExpectedSizeNote =
              formatQtyValueWithUnit(
                expectedConvertedQty,
                expectedConvertedUnit,
              ) + ' needed';
          }
        }

        expect(normalizeUnitForAssertion(item?.unit)).toBe(
          normalizeUnitForAssertion(adjExpectedUnit),
        );
        expect(item?.qty).toBe(adjExpectedQty);

        if (adjExpectedSizeNote !== undefined) {
          expect(item?.note?.sizeNote).toBe(adjExpectedSizeNote);
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
      const isExercised = INGREDIENT_TEST_CASES.some((tc) => {
        const lowerInput = tc.input.item.toLowerCase().trim();
        const singInput = singularizeWord(lowerInput);
        const plurInput = pluralizeWord(lowerInput);

        const checkMatch = (val: string) => {
          const v = val.toLowerCase().trim();
          return v === lowerInput || v === singInput || v === plurInput;
        };

        return (
          checkMatch(rule.canonicalName) ||
          rule.items.some((i) =>
            typeof i === 'string'
              ? checkMatch(i)
              : checkMatch(i.singular) ||
                checkMatch(i.plural) ||
                i.aliases?.some((a) => checkMatch(a)),
          )
        );
      });
      if (!isExercised) {
        unexercisedRules.push(rule.canonicalName);
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

  test('every unit referenced across all recipes and test cases is registered in UNIT_DEFINITIONS', () => {
    const unmappedUnits: string[] = [];

    for (const tc of INGREDIENT_TEST_CASES) {
      if (tc.input.unit && tc.input.unit.trim().length > 0) {
        const u = tc.input.unit.trim().toLowerCase();
        const singularUnit = getSingularUnit(u).toLowerCase();
        const isPackageOrCount =
          isSizeOnlyUnit(u) ||
          u.includes('can') ||
          u.includes('box') ||
          u.includes('bottle') ||
          u.includes('package') ||
          u.includes('jar') ||
          u.includes('bag') ||
          u.includes('container') ||
          u.includes('head') ||
          u === 'egg';
        if (
          !UNIT_LOOKUP[singularUnit] &&
          !UNIT_LOOKUP[u] &&
          !isPackageOrCount
        ) {
          unmappedUnits.push(`${tc.input.item}: "${tc.input.unit}"`);
        }
      }
    }

    expect(unmappedUnits).toEqual([]);
  });
});
