import { describe, expect, test } from 'vitest';
// @ts-expect-error Node imports not available in front-end tsconfig
import * as fs from 'fs';
// @ts-expect-error Node imports not available in front-end tsconfig
import * as path from 'path';

declare const __dirname: string;

import { processShoppingList } from './pipeline';
import { IngredientInput, ShoppingItem } from './types';
import { ITEM_RULES } from './rules';
import { getConversionFactor, convertQty } from './utils';

interface IngredientTestCase {
  input: IngredientInput;
  expected: {
    category: string;
    unit?: string;
    qty?: number | null;
    staple?: 'in-pantry';
    sizeNote?: string;
  };
}

// 18 Custom Conversion Rules Test Cases
const RULE_TEST_CASES: IngredientTestCase[] = [
  // 1. Garlic (Rule 1)
  {
    input: { item: 'garlic', qty: 2, unit: 'clove' },
    expected: { category: 'fresh-produce', unit: 'clove', qty: 2 },
  },
  {
    input: { item: 'garlic clove', qty: 10, unit: 'cloves' },
    expected: { category: 'fresh-produce', unit: 'clove', qty: 10 },
  },

  // 2. Butter (Rule 2)
  {
    input: { item: 'butter', qty: 4, unit: 'tablespoon' },
    expected: {
      category: 'butter-cheese',
      unit: 'stick',
      qty: 1,
      sizeNote: '2 oz needed',
    },
  },
  {
    input: { item: 'butter', qty: 12, unit: 'tablespoon' },
    expected: {
      category: 'butter-cheese',
      unit: 'stick',
      qty: 4,
      sizeNote: '6 oz needed',
    },
  },

  // 3. Eggs (Rule 3)
  {
    input: { item: 'egg', qty: 4, unit: 'egg' },
    expected: {
      category: 'eggs',
      unit: 'egg',
      qty: 6,
      sizeNote: '4 egg needed',
    },
  },
  {
    input: { item: 'egg yolk', qty: 14, unit: 'egg' },
    expected: {
      category: 'eggs',
      unit: 'egg',
      qty: 18,
      sizeNote: '14 egg needed',
    },
  },

  // 4. Lemons (Rule 4)
  {
    input: { item: 'lemon juice', qty: 3, unit: 'tablespoon' },
    expected: { category: 'fresh-produce', unit: 'lemon', qty: 1 },
  },

  // 5. Limes (Rule 5)
  {
    input: { item: 'lime juice', qty: 4, unit: 'tablespoon' },
    expected: { category: 'fresh-produce', unit: 'lime', qty: 2 },
  },

  // 6. Half-Pint Liquids (Rule 6)
  {
    input: { item: 'sour cream', qty: 1.5, unit: 'cup' },
    expected: {
      category: 'milk-cream',
      unit: 'pint (16 oz)',
      qty: 2,
      sizeNote: '12 oz needed',
    },
  },

  // 7. Pint-Minimum Liquids (Rule 7)
  {
    input: { item: 'heavy cream', qty: 3, unit: 'cup' },
    expected: {
      category: 'milk-cream',
      unit: 'quart (32 fl oz)',
      qty: 1,
      sizeNote: '24 oz needed',
    },
  },

  // 8. Ginger (Rule 8)
  {
    input: { item: 'ginger', qty: 2, unit: 'tablespoon' },
    expected: {
      category: 'fresh-produce',
      unit: 'root',
      qty: 1,
      sizeNote: '1 oz needed',
    },
  },

  // 9. Onion (Rule 9)
  {
    input: { item: 'onion', qty: 1.5, unit: 'cup' },
    expected: { category: 'fresh-produce', unit: 'onion', qty: 1.5 },
  },

  // 10. Coconut Milk (Rule 10)
  {
    input: { item: 'coconut milk', qty: 4, unit: 'ounce' },
    expected: {
      category: 'milk-cream',
      unit: 'can (13.5 oz)',
      qty: 1,
      sizeNote: '4 oz needed',
    },
  },

  // 11. Cabbage (Rule 11)
  {
    input: { item: 'green cabbage', qty: 4, unit: 'cup' },
    expected: { category: 'fresh-produce', unit: 'head', qty: 0.5 },
  },

  // 12. Scallions (Rule 12)
  {
    input: { item: 'scallion', qty: 1, unit: 'cup' },
    expected: {
      category: 'fresh-produce',
      unit: 'bundle',
      qty: 1,
      sizeNote: '8 oz needed',
    },
  },

  // 13. Dry Pasta (Rule 13)
  {
    input: { item: 'spaghetti', qty: 12, unit: 'ounce' },
    expected: {
      category: 'pasta-grains',
      unit: 'box (16 oz)',
      qty: 1,
      sizeNote: '12 oz needed',
    },
  },

  // 14. Chickpeas / Beans (Rule 14)
  {
    input: { item: 'chickpea', qty: 15, unit: 'ounce' },
    expected: {
      category: 'canned-beans',
      unit: 'can (15 oz)',
      qty: 1,
      sizeNote: '15 oz needed',
    },
  },

  // 15. Tomatoes (Rule 15)
  {
    input: { item: 'diced tomato', qty: 10, unit: 'ounce' },
    expected: {
      category: 'fresh-produce',
      unit: 'can (15 oz)',
      qty: 1,
      sizeNote: '10 oz needed',
    },
  },

  // 16. Roasted Red Peppers (Rule 16)
  {
    input: { item: 'jarred roasted red pepper', qty: 6, unit: 'ounce' },
    expected: {
      category: 'spices-seasonings',
      unit: '8-oz jar',
      qty: 1,
      sizeNote: '6 oz needed',
    },
  },

  // 17. Potato Gnocchi (Rule 17)
  {
    input: { item: 'potato gnocchi', qty: 16, unit: 'ounce' },
    expected: {
      category: 'fresh-produce',
      unit: '17.5-oz package',
      qty: 1,
      sizeNote: '16 oz needed',
    },
  },

  // 18. Baby Spinach (Rule 18)
  {
    input: { item: 'baby spinach', qty: 3, unit: 'cup' },
    expected: {
      category: 'fresh-produce',
      unit: '8 oz bag',
      qty: 1,
      sizeNote: '3 oz needed',
    },
  },
];

// Recipe ingredients matching ITEM_RULES, with their exact example inputs and expected outputs
const RULE_BASED_RECIPE_CASES: Record<
  string,
  {
    input: IngredientInput;
    expected: {
      qty: number | null;
      unit: string;
      category: string;
      sizeNote?: string;
      staple?: 'in-pantry';
    };
  }
> = {
  'baby spinach': {
    input: {
      item: 'baby spinach',
      qty: 5,
      unit: 'ounce',
      desc: 'leaves',
      prep: 'chopped',
    },
    expected: {
      qty: 1,
      unit: '8 oz bag',
      category: 'fresh-produce',
      sizeNote: '5 oz needed',
    },
  },
  'black bean': {
    input: {
      item: 'black bean',
      qty: 1,
      unit: 'can (14 ounce)',
      prep: 'drained',
    },
    expected: {
      qty: 1,
      unit: 'can (15 oz)',
      category: 'canned-beans',
      sizeNote: '1 oz needed',
    },
  },
  butter: {
    input: {
      item: 'butter',
      qty: 2,
      unit: 'tablespoon',
    },
    expected: {
      qty: 1,
      unit: 'stick',
      category: 'butter-cheese',
      sizeNote: '1 oz needed',
    },
  },
  cabbage: {
    input: {
      item: 'cabbage',
      qty: 1,
      unit: 'head',
      prep: 'thinly sliced or chopped',
    },
    expected: {
      qty: 1,
      unit: 'head',
      category: 'fresh-produce',
    },
  },
  'chicken broth': {
    input: {
      item: 'chicken broth',
      qty: 6,
      unit: 'cup',
      desc: 'low sodium',
    },
    expected: {
      qty: 2,
      unit: 'quart (32 fl oz)',
      category: 'poultry',
      sizeNote: '48 oz needed',
    },
  },
  chickpea: {
    input: {
      item: 'chickpea',
      qty: 2,
      unit: 'can (15 ounce)',
    },
    expected: {
      qty: 1,
      unit: 'can (15 oz)',
      category: 'canned-beans',
      sizeNote: '2 oz needed',
    },
  },
  'coconut milk': {
    input: {
      item: 'coconut milk',
      qty: 0.5,
      unit: 'cup',
      desc: 'full fat canned',
    },
    expected: {
      qty: 1,
      unit: 'can (13.5 oz)',
      category: 'milk-cream',
      sizeNote: '4 oz needed',
    },
  },
  egg: {
    input: {
      item: 'egg',
      qty: 3,
      unit: 'large',
    },
    expected: {
      qty: 6,
      unit: 'egg',
      category: 'eggs',
      sizeNote: '3 large needed',
    },
  },
  'egg yolk': {
    input: {
      item: 'egg yolk',
      qty: 1,
      unit: 'large',
    },
    expected: {
      qty: 6,
      unit: 'egg',
      category: 'eggs',
      sizeNote: '1 large needed',
    },
  },
  'elbow macaroni': {
    input: {
      item: 'elbow macaroni',
      qty: 16,
      unit: 'ounce',
    },
    expected: {
      qty: 1,
      unit: 'box (16 oz)',
      category: 'pasta-grains',
      sizeNote: '16 oz needed',
    },
  },
  fettuccine: {
    input: {
      item: 'fettuccine',
      qty: 1,
      unit: 'pound',
      desc: 'fresh',
    },
    expected: {
      qty: 1,
      unit: 'box (16 oz)',
      category: 'pasta-grains',
      sizeNote: '1 oz needed',
    },
  },
  'fire roasted tomato': {
    input: {
      item: 'fire roasted tomato',
      qty: 1,
      unit: 'can (28 ounce)',
      prep: 'crushed',
    },
    expected: {
      qty: 1,
      unit: 'can (15 oz)',
      category: 'fresh-produce',
      sizeNote: '1 oz needed',
    },
  },
  garlic: {
    input: {
      item: 'garlic',
      qty: 1,
      unit: 'head',
    },
    expected: {
      qty: 10,
      unit: 'clove',
      category: 'fresh-produce',
    },
  },
  ginger: {
    input: {
      item: 'ginger',
      qty: 1,
      unit: 'teaspoon',
      prep: 'grated',
    },
    expected: {
      qty: 1,
      unit: 'root',
      category: 'fresh-produce',
      sizeNote: '1/8 oz needed',
    },
  },
  'green onion': {
    input: {
      item: 'green onion',
      qty: 8,
      prep: 'finely sliced',
    },
    expected: {
      qty: 4,
      unit: 'bundle',
      category: 'fresh-produce',
      sizeNote: '64 oz needed',
    },
  },
  'heavy cream': {
    input: {
      item: 'heavy cream',
      qty: 1.5,
      unit: 'cup',
    },
    expected: {
      qty: 1,
      unit: 'pint (16 fl oz)',
      category: 'milk-cream',
      sizeNote: '12 oz needed',
    },
  },
  'jarred roasted red pepper': {
    input: {
      item: 'jarred roasted red pepper',
      qty: 0.75,
      unit: 'cup',
      prep: 'chopped',
    },
    expected: {
      qty: 1,
      unit: '8-oz jar',
      category: 'spices-seasonings',
      sizeNote: '6 oz needed',
    },
  },
  lemon: {
    input: {
      item: 'lemon',
      qty: 1,
      prep: 'for juice and zest',
    },
    expected: {
      qty: 1,
      unit: 'lemon',
      category: 'fresh-produce',
    },
  },
  'lemon juice': {
    input: {
      item: 'lemon juice',
      qty: 3,
      unit: 'tablespoon',
      desc: 'fresh',
    },
    expected: {
      qty: 1,
      unit: 'lemon',
      category: 'fresh-produce',
      staple: 'in-pantry',
    },
  },
  'lemon zest': {
    input: {
      item: 'lemon zest',
      qty: 2,
      unit: 'tablespoon',
    },
    expected: {
      qty: 0.67,
      unit: 'lemon',
      category: 'fresh-produce',
    },
  },
  lime: {
    input: {
      item: 'lime',
      qty: 1,
      prep: 'cut into wedges for serving',
    },
    expected: {
      qty: 1,
      unit: 'lime',
      category: 'fresh-produce',
    },
  },
  'lime juice': {
    input: {
      item: 'lime juice',
      qty: 1,
      unit: 'tablespoon',
      desc: 'fresh',
    },
    expected: {
      qty: 0.5,
      unit: 'lime',
      category: 'fresh-produce',
      staple: 'in-pantry',
    },
  },
  'lime zest': {
    input: {
      item: 'lime zest',
      qty: 3,
      unit: 'teaspoon',
      desc: 'fresh',
    },
    expected: {
      qty: 3,
      unit: 'lime',
      category: 'fresh-produce',
    },
  },
  milk: {
    input: {
      item: 'milk',
      qty: 0.75,
      unit: 'cup',
    },
    expected: {
      qty: 1,
      unit: 'pint (16 fl oz)',
      category: 'milk-cream',
      sizeNote: '6 oz needed',
    },
  },
  onion: {
    input: {
      item: 'onion',
      qty: 1,
      unit: 'small',
      prep: 'chopped',
    },
    expected: {
      qty: 1,
      unit: 'onion',
      category: 'fresh-produce',
    },
  },
  'orzo pasta': {
    input: {
      item: 'orzo pasta',
      qty: 1.5,
      unit: 'cup',
      desc: 'dry',
    },
    expected: {
      qty: 1,
      unit: 'box (16 oz)',
      category: 'pasta-grains',
      sizeNote: '12 oz needed',
    },
  },
  pasta: {
    input: {
      item: 'pasta',
      qty: 1,
      unit: 'pound',
      desc: 'short, curled',
      prep: 'such as pipettes',
    },
    expected: {
      qty: 1,
      unit: 'box (16 oz)',
      category: 'pasta-grains',
      sizeNote: '1 oz needed',
    },
  },
  'potato gnocchi': {
    input: {
      item: 'potato gnocchi',
      qty: 16,
      unit: 'ounce',
    },
    expected: {
      qty: 1,
      unit: '17.5-oz package',
      category: 'fresh-produce',
      sizeNote: '16 oz needed',
    },
  },
  'red cabbage': {
    input: {
      item: 'red cabbage',
      qty: 75,
      unit: 'gram',
      prep: 'shredded',
    },
    expected: {
      qty: 75,
      unit: 'head',
      category: 'fresh-produce',
    },
  },
  'red onion': {
    input: {
      item: 'red onion',
      qty: 0.333,
      unit: 'cup',
      prep: 'thinly sliced',
    },
    expected: {
      qty: 0.34,
      unit: 'onion',
      category: 'fresh-produce',
    },
  },
  scallion: {
    input: {
      item: 'scallion',
      optional: true,
    },
    expected: {
      qty: null,
      unit: 'cup',
      category: 'fresh-produce',
    },
  },
  'sour cream': {
    input: {
      item: 'sour cream',
      qty: 0.5,
      unit: 'cup',
    },
    expected: {
      qty: 1,
      unit: 'half-pint (8 oz)',
      category: 'milk-cream',
      sizeNote: '4 oz needed',
    },
  },
  spinach: {
    input: {
      item: 'spinach',
      optional: true,
    },
    expected: {
      qty: null,
      unit: 'ounce',
      category: 'fresh-produce',
    },
  },
  'spring onion': {
    input: {
      item: 'spring onion',
      qty: 1,
      prep: 'sliced',
    },
    expected: {
      qty: 1,
      unit: 'bundle',
      category: 'fresh-produce',
      sizeNote: '8 oz needed',
    },
  },
  'sweet onion': {
    input: {
      item: 'sweet onion',
      qty: 1,
      unit: 'small',
      prep: 'chopped',
    },
    expected: {
      qty: 1,
      unit: 'onion',
      category: 'fresh-produce',
    },
  },
  'tomato sauce': {
    input: {
      item: 'tomato sauce',
      qty: 1,
      unit: 'can (15-ounce)',
    },
    expected: {
      qty: 1,
      unit: 'can (15 oz)',
      category: 'fresh-produce',
      sizeNote: '1 oz needed',
    },
  },
  'vegetable stock': {
    input: {
      item: 'vegetable stock',
      optional: true,
    },
    expected: {
      qty: null,
      unit: 'cup',
      category: 'canned-other',
    },
  },
  'yellow onion': {
    input: {
      item: 'yellow onion',
      qty: 1,
    },
    expected: {
      qty: 1,
      unit: 'onion',
      category: 'fresh-produce',
    },
  },
  yogurt: {
    input: {
      item: 'yogurt',
      prep: 'for serving',
    },
    expected: {
      qty: null,
      unit: 'cup',
      category: 'milk-cream',
    },
  },
};

// Simple recipe ingredients (no conversions rules), with their categories
const SIMPLE_RECIPE_CASES: Record<
  string,
  {
    input: IngredientInput;
    category: string;
  }
> = {
  'all-purpose flour': {
    input: {
      item: 'all-purpose flour',
      qty: 1.5,
      unit: 'cup',
    },
    category: 'baking',
  },
  almond: {
    input: {
      item: 'almond',
      qty: 0.25,
      unit: 'cup',
      prep: 'sliced',
    },
    category: 'snacks',
  },
  'almond milk': {
    input: {
      item: 'almond milk',
      qty: 0.666,
      unit: 'cup',
      desc: 'unsweetened vanilla',
    },
    category: 'milk-cream',
  },
  avocado: {
    input: {
      item: 'avocado',
      prep: 'for serving',
    },
    category: 'fresh-produce',
  },
  'avocado oil': {
    input: {
      item: 'avocado oil',
      qty: 2,
      unit: 'tablespoon',
    },
    category: 'fresh-produce',
  },
  bacon: {
    input: {
      item: 'bacon',
      qty: 2,
      unit: 'strip',
      prep: 'chopped',
    },
    category: 'meat',
  },
  'baking powder': {
    input: {
      item: 'baking powder',
      qty: 1.5,
      unit: 'teaspoon',
    },
    category: 'baking',
  },
  'baking soda': {
    input: {
      item: 'baking soda',
      qty: 0.25,
      unit: 'teaspoon',
    },
    category: 'baking',
  },
  'balsamic glaze': {
    input: {
      item: 'balsamic glaze',
    },
    category: 'other',
  },
  banana: {
    input: {
      item: 'banana',
      qty: 2,
      unit: 'large',
      desc: 'ripe',
      prep: 'mashed',
    },
    category: 'fresh-produce',
  },
  basil: {
    input: {
      item: 'basil',
      qty: 1,
      unit: 'teaspoon',
      desc: 'dried',
    },
    category: 'fresh-herbs',
  },
  'basil leaf': {
    input: {
      item: 'basil leaf',
      qty: 1,
      unit: 'cup',
      desc: 'fresh',
    },
    category: 'fresh-herbs',
  },
  'basmati rice': {
    input: {
      item: 'basmati rice',
      desc: 'white or brown',
      prep: 'to serve',
    },
    category: 'pasta-grains',
  },
  'bay leaf': {
    input: {
      item: 'bay leaf',
      qty: 1,
    },
    category: 'other',
  },
  'beef bone broth': {
    input: {
      item: 'beef bone broth',
      qty: 1,
      unit: 'cup',
      desc: 'if using a Dutch oven',
    },
    category: 'meat',
  },
  'beef chuck roast': {
    input: {
      item: 'beef chuck roast',
      qty: 3,
      unit: 'pound',
      prep: 'cut into thirds',
    },
    category: 'meat',
  },
  beet: {
    input: {
      item: 'beet',
      qty: 1,
      unit: 'pound',
      prep: 'red or orange',
    },
    category: 'other',
  },
  berry: {
    input: {
      item: 'berry',
      qty: 1,
      unit: 'cup',
      desc: 'fresh',
      optional: true,
    },
    category: 'fresh-produce',
  },
  'black pepper': {
    input: {
      item: 'black pepper',
      qty: 1,
      unit: 'teaspoon',
    },
    category: 'spices-seasonings',
  },
  blueberry: {
    input: {
      item: 'blueberry',
      qty: 1,
      unit: 'cup',
      desc: 'fresh',
    },
    category: 'fresh-produce',
  },
  'boneless chicken thighs': {
    input: {
      item: 'boneless chicken thighs',
      qty: 1.333,
      unit: 'pound',
      prep: 'skin on or off',
    },
    category: 'poultry',
  },
  'bread-and-butter pickle': {
    input: {
      item: 'bread-and-butter pickle',
      qty: 0.666,
      unit: 'cup',
      prep: 'minced',
    },
    category: 'bakery',
  },
  brioche: {
    input: {
      item: 'brioche',
      qty: 1,
      unit: 'loaf',
      prep: 'sliced into 12 slices',
    },
    category: 'bakery',
  },
  broccoli: {
    input: {
      item: 'broccoli',
      qty: 1,
      unit: 'large head',
      prep: 'florets cut into 1.5- to 2-inch pieces, stems thinly sliced',
    },
    category: 'fresh-produce',
  },
  'brown sugar': {
    input: {
      item: 'brown sugar',
      qty: 1,
      unit: 'tablespoon',
    },
    category: 'baking',
  },
  'cake flour': {
    input: {
      item: 'cake flour',
      qty: 2.5,
      unit: 'cup',
    },
    category: 'baking',
  },
  'canola oil': {
    input: {
      item: 'canola oil',
      qty: 3,
      unit: 'tablespoon',
    },
    category: 'canned-other',
  },
  carrot: {
    input: {
      item: 'carrot',
      qty: 2,
      prep: 'grated or julienned',
    },
    category: 'fresh-produce',
  },
  'cashew powder': {
    input: {
      item: 'cashew powder',
      qty: 3,
      unit: 'tablespoon',
    },
    category: 'snacks',
  },
  'cayenne pepper': {
    input: {
      item: 'cayenne pepper',
      prep: 'to serve',
      optional: true,
    },
    category: 'spices-seasonings',
  },
  'cayenne pepper powder': {
    input: {
      item: 'cayenne pepper powder',
      qty: 0.5,
      unit: 'teaspoon',
    },
    category: 'spices-seasonings',
  },
  'celery rib': {
    input: {
      item: 'celery rib',
      qty: 2,
      prep: 'chopped (about 1/3 cup)',
    },
    category: 'fresh-produce',
  },
  cheese: {
    input: {
      item: 'cheese',
      prep: 'for serving',
    },
    category: 'butter-cheese',
  },
  'cherry tomato': {
    input: {
      item: 'cherry tomato',
      qty: 2,
      unit: 'cup',
      prep: 'halved',
    },
    category: 'fresh-produce',
  },
  'chia seed': {
    input: {
      item: 'chia seed',
      qty: 0.5,
      unit: 'tablespoon',
    },
    category: 'other',
  },
  chicken: {
    input: {
      item: 'chicken',
      qty: 2,
      unit: 'cup',
      desc: 'cooked',
      prep: 'chopped or shredded',
    },
    category: 'poultry',
  },
  'chicken breast': {
    input: {
      item: 'chicken breast',
      optional: true,
    },
    category: 'poultry',
  },
  'chicken thigh': {
    input: {
      item: 'chicken thigh',
      qty: 1,
      unit: 'pound',
      desc: 'boneless skinless',
    },
    category: 'poultry',
  },
  'chicken thighs': {
    input: {
      item: 'chicken thighs',
      qty: 2.25,
      unit: 'pound',
      desc: 'skin-on',
      prep: 'deboned',
    },
    category: 'poultry',
  },
  chickpeas: {
    input: {
      item: 'chickpeas',
      qty: 2,
      unit: 'can (15-ounce)',
      prep: 'drained and rinsed',
    },
    category: 'canned-beans',
  },
  'chili powder': {
    input: {
      item: 'chili powder',
      qty: 1,
      unit: 'teaspoon',
    },
    category: 'spices-seasonings',
  },
  'chocolate chip': {
    input: {
      item: 'chocolate chip',
      qty: 0.5,
      unit: 'cup',
      optional: true,
    },
    category: 'baking',
  },
  chorizo: {
    input: {
      item: 'chorizo',
      qty: 0.5,
      unit: 'pound',
      desc: 'fresh',
      prep: 'casing removed',
    },
    category: 'other',
  },
  cilantro: {
    input: {
      item: 'cilantro',
      qty: 4,
      unit: 'tablespoon',
      desc: 'fresh',
      prep: 'finely chopped',
    },
    category: 'fresh-herbs',
  },
  cinnamon: {
    input: {
      item: 'cinnamon',
      qty: 1.5,
      unit: 'teaspoon',
      desc: 'ground',
    },
    category: 'spices-seasonings',
  },
  'cocktail weenie': {
    input: {
      item: 'cocktail weenie',
      qty: 1,
      unit: 'package',
    },
    category: 'other',
  },
  'coconut amino': {
    input: {
      item: 'coconut amino',
      qty: 1.5,
      unit: 'tablespoon',
    },
    category: 'snacks',
  },
  'coconut oil': {
    input: {
      item: 'coconut oil',
      qty: 1,
      unit: 'tablespoon',
    },
    category: 'oils-vinegars',
  },
  "confectioners' sugar": {
    input: {
      item: "confectioners' sugar",
      qty: 4,
      unit: 'cup',
      prep: 'more if needed (for frosting)',
    },
    category: 'baking',
  },
  coriander: {
    input: {
      item: 'coriander',
      qty: 0.5,
      unit: 'teaspoon',
    },
    category: 'spices-seasonings',
  },
  'coriander powder': {
    input: {
      item: 'coriander powder',
      qty: 2.5,
      unit: 'teaspoon',
    },
    category: 'spices-seasonings',
  },
  corn: {
    input: {
      item: 'corn',
      qty: 4,
      unit: 'ear',
      desc: 'sweet fresh',
      prep: 'kernels cut from cob (about 2 3/4 cups)',
    },
    category: 'fresh-produce',
  },
  'cracker crumb': {
    input: {
      item: 'cracker crumb',
      qty: 1,
      unit: 'cup',
      desc: 'gluten-free',
    },
    category: 'snacks',
  },
  'cream cheese': {
    input: {
      item: 'cream cheese',
      qty: 8,
      unit: 'ounce',
      desc: 'full-fat',
      prep: 'a little softer than room temperature (for frosting)',
    },
    category: 'milk-cream',
  },
  cucumber: {
    input: {
      item: 'cucumber',
      qty: 1,
      prep: 'sliced',
    },
    category: 'fresh-produce',
  },
  cumin: {
    input: {
      item: 'cumin',
      qty: 1,
      unit: 'teaspoon',
    },
    category: 'spices-seasonings',
  },
  'cumin powder': {
    input: {
      item: 'cumin powder',
      qty: 0.25,
      unit: 'teaspoon',
    },
    category: 'spices-seasonings',
  },
  'curry powder': {
    input: {
      item: 'curry powder',
      qty: 1,
      unit: 'tablespoon',
    },
    category: 'other',
  },
  'diamond crystal kosher salt': {
    input: {
      item: 'Diamond Crystal kosher salt',
    },
    category: 'spices-seasonings',
  },
  'dijon mustard': {
    input: {
      item: 'Dijon mustard',
      qty: 4,
      unit: 'teaspoon',
    },
    category: 'condiments',
  },
  dill: {
    input: {
      item: 'dill',
      qty: 0.25,
      unit: 'cup',
      desc: 'fresh',
      prep: 'chopped, plus small sprigs for garnish',
    },
    category: 'fresh-herbs',
  },
  'dried cranberry': {
    input: {
      item: 'dried cranberry',
      optional: true,
    },
    category: 'fresh-produce',
  },
  'feta cheese': {
    input: {
      item: 'feta cheese',
      qty: 4,
      unit: 'ounce',
      prep: 'cut into 1/4-inch cubes',
    },
    category: 'butter-cheese',
  },
  'fresh mint': {
    input: {
      item: 'fresh mint',
      qty: [1, 2],
      unit: 'tablespoon',
    },
    category: 'fresh-herbs',
  },
  'frozen mixed berries': {
    input: {
      item: 'frozen mixed berries',
      qty: 1,
      unit: 'cup',
    },
    category: 'frozen',
  },
  'garam masala powder': {
    input: {
      item: 'garam masala powder',
      qty: 0.25,
      unit: 'teaspoon',
    },
    category: 'other',
  },
  'grain-free cracker crumb': {
    input: {
      item: 'grain-free cracker crumb',
      optional: true,
    },
    category: 'snacks',
  },
  'granulated sugar': {
    input: {
      item: 'granulated sugar',
      qty: 0.25,
      unit: 'cup',
      prep: 'for crust',
    },
    category: 'baking',
  },
  'grape tomato': {
    input: {
      item: 'grape tomato',
      qty: 1,
      unit: 'package',
    },
    category: 'fresh-produce',
  },
  'greek yogurt': {
    input: {
      item: 'Greek yogurt',
      qty: 0.333,
      unit: 'cup',
      desc: 'vanilla or plain nonfat',
    },
    category: 'milk-cream',
  },
  'ground beef': {
    input: {
      item: 'ground beef',
      qty: 1,
      unit: 'pound',
      prep: 'round or chuck',
    },
    category: 'meat',
  },
  'ground chicken': {
    input: {
      item: 'ground chicken',
      optional: true,
    },
    category: 'poultry',
  },
  'ground turkey': {
    input: {
      item: 'ground turkey',
      qty: 1,
      unit: 'pound',
      desc: 'organic',
    },
    category: 'poultry',
  },
  'half and half': {
    input: {
      item: 'half and half',
      qty: 1,
      unit: 'cup',
    },
    category: 'milk-cream',
  },
  honey: {
    input: {
      item: 'honey',
      qty: 1,
      unit: 'tablespoon',
    },
    category: 'condiments',
  },
  'hot chilli sauce': {
    input: {
      item: 'hot chilli sauce',
      optional: true,
    },
    category: 'condiments',
  },
  'italian parsley': {
    input: {
      item: 'Italian parsley',
      qty: 0.333,
      unit: 'cup',
      desc: 'fresh',
      prep: 'finely chopped, plus more for garnish',
    },
    category: 'fresh-herbs',
  },
  'italian sausage': {
    input: {
      item: 'Italian sausage',
      qty: 1,
      unit: 'pound',
      desc: 'hot or sweet',
      prep: 'casings removed',
    },
    category: 'meat',
  },
  jalapeño: {
    input: {
      item: 'jalapeño',
      qty: 2,
      prep: 'finely chopped',
    },
    category: 'other',
  },
  'kalamata olive': {
    input: {
      item: 'Kalamata olive',
      qty: 0.5,
      unit: 'cup',
      desc: 'pitted',
    },
    category: 'other',
  },
  'kasoori methi': {
    input: {
      item: 'kasoori methi',
      qty: 2,
      unit: 'tablespoon',
      optional: true,
    },
    category: 'other',
  },
  ketchup: {
    input: {
      item: 'ketchup',
      prep: 'for serving',
    },
    category: 'condiments',
  },
  'kosher salt': {
    input: {
      item: 'kosher salt',
      qty: 0.75,
      unit: 'teaspoon',
    },
    category: 'spices-seasonings',
  },
  'lemon extract': {
    input: {
      item: 'lemon extract',
      qty: 0.5,
      unit: 'teaspoon',
      desc: 'pure',
      optional: true,
    },
    category: 'fresh-produce',
  },
  'light brown sugar': {
    input: {
      item: 'light brown sugar',
      qty: 0.25,
      unit: 'cup',
      prep: 'packed',
    },
    category: 'baking',
  },
  'low-fat plain kefir': {
    input: {
      item: 'low-fat plain kefir',
      qty: 1,
      unit: 'cup',
    },
    category: 'milk-cream',
  },
  'maple syrup': {
    input: {
      item: 'maple syrup',
      qty: 2,
      unit: 'tablespoon',
    },
    category: 'condiments',
  },
  mayo: {
    input: {
      item: 'mayo',
      qty: 1,
      unit: 'tablespoon',
    },
    category: 'condiments',
  },
  mayonnaise: {
    input: {
      item: 'mayonnaise',
      qty: 0.75,
      unit: 'cup',
    },
    category: 'condiments',
  },
  'mila soup dumplings': {
    input: {
      item: 'Mila soup dumplings',
      qty: 1,
      unit: 'package',
    },
    category: 'frozen',
  },
  'mint leaf': {
    input: {
      item: 'mint leaf',
      optional: true,
    },
    category: 'fresh-herbs',
  },
  miso: {
    input: {
      item: 'miso',
      qty: 2,
      unit: 'tablespoon',
      desc: 'white or yellow recommended',
    },
    category: 'other',
  },
  'mozzarella ball': {
    input: {
      item: 'mozzarella ball',
      qty: 1,
      unit: 'container',
    },
    category: 'butter-cheese',
  },
  'olive oil': {
    input: {
      item: 'olive oil',
      qty: 1,
      unit: 'tablespoon',
    },
    category: 'oils-vinegars',
  },
  'onion powder': {
    input: {
      item: 'onion powder',
      qty: 1,
      unit: 'teaspoon',
    },
    category: 'fresh-produce',
  },
  'orange juice': {
    input: {
      item: 'orange juice',
      qty: 0.25,
      unit: 'cup',
    },
    category: 'beverages',
  },
  oregano: {
    input: {
      item: 'oregano',
      qty: 1,
      unit: 'teaspoon',
      desc: 'dried',
    },
    category: 'spices-seasonings',
  },
  'oyster sauce': {
    input: {
      item: 'oyster sauce',
      qty: 0.25,
      unit: 'cup',
    },
    category: 'condiments',
  },
  panko: {
    input: {
      item: 'panko',
      qty: 0.5,
      unit: 'cup',
    },
    category: 'pasta-grains',
  },
  paprika: {
    input: {
      item: 'paprika',
      qty: 1,
      unit: 'teaspoon',
      desc: 'sweet',
    },
    category: 'spices-seasonings',
  },
  parmesan: {
    input: {
      item: 'parmesan',
      qty: 3,
      unit: 'ounce',
      prep: 'grated',
    },
    category: 'butter-cheese',
  },
  'parmigiano-reggiano': {
    input: {
      item: 'Parmigiano-Reggiano',
      qty: 1,
      unit: 'cup',
      desc: 'freshly grated',
    },
    category: 'butter-cheese',
  },
  parsley: {
    input: {
      item: 'parsley',
      desc: 'fresh',
      prep: 'chopped, to garnish',
    },
    category: 'fresh-herbs',
  },
  'peanut butter': {
    input: {
      item: 'peanut butter',
      qty: 1,
      unit: 'cup',
      desc: 'all-natural',
    },
    category: 'butter-cheese',
  },
  pepper: {
    input: {
      item: 'pepper',
      prep: 'to taste',
    },
    category: 'spices-seasonings',
  },
  'persian cucumber': {
    input: {
      item: 'Persian cucumber',
      qty: 2,
      prep: 'halved vertically and sliced 1/4-inch thick',
    },
    category: 'fresh-produce',
  },
  'pillsbury crescent roll': {
    input: {
      item: 'Pillsbury crescent roll',
      qty: 1,
      unit: 'can',
    },
    category: 'bakery',
  },
  'plain greek yogurt': {
    input: {
      item: 'plain Greek yogurt',
      optional: true,
    },
    category: 'milk-cream',
  },
  'poblano pepper': {
    input: {
      item: 'poblano pepper',
      qty: 1,
      prep: 'chopped (or up to 2)',
    },
    category: 'spices-seasonings',
  },
  'pound cake mix': {
    input: {
      item: 'pound cake mix',
      qty: 1,
      unit: 'box (16 ounces)',
      prep: '(plus ingredients required by package instructions)',
    },
    category: 'other',
  },
  'powdered sugar': {
    input: {
      item: 'powdered sugar',
      qty: 0.25,
      unit: 'cup',
    },
    category: 'baking',
  },
  raisin: {
    input: {
      item: 'raisin',
      qty: 0.5,
      unit: 'cup',
      optional: true,
    },
    category: 'other',
  },
  'ramen noodles': {
    input: {
      item: 'ramen noodles',
      qty: 2,
      unit: 'package',
      prep: 'broken up',
    },
    category: 'pasta-grains',
  },
  raspberry: {
    input: {
      item: 'raspberry',
      qty: 1,
      unit: 'cup',
      desc: 'fresh',
    },
    category: 'fresh-produce',
  },
  'raspberry preserve': {
    input: {
      item: 'raspberry preserve',
      qty: 0.5,
      unit: 'cup',
      prep: '(for garnish)',
    },
    category: 'fresh-produce',
  },
  'red bell pepper': {
    input: {
      item: 'red bell pepper',
      qty: 1,
      prep: 'sliced',
    },
    category: 'fresh-produce',
  },
  'red curry paste': {
    input: {
      item: 'red curry paste',
      qty: 1,
      unit: 'tablespoon',
    },
    category: 'other',
  },
  'red pepper flake': {
    input: {
      item: 'red pepper flake',
      prep: 'crushed',
      optional: true,
    },
    category: 'spices-seasonings',
  },
  'red pepper flakes': {
    input: {
      item: 'red pepper flakes',
      qty: 1,
      unit: 'teaspoon',
    },
    category: 'spices-seasonings',
  },
  'red wine vinegar': {
    input: {
      item: 'red wine vinegar',
      qty: 4,
      unit: 'tablespoon',
    },
    category: 'condiments',
  },
  'regular soy sauce': {
    input: {
      item: 'regular soy sauce',
      optional: true,
    },
    category: 'condiments',
  },
  rice: {
    input: {
      item: 'rice',
      qty: 3,
      unit: 'cup',
      desc: 'cooked',
    },
    category: 'pasta-grains',
  },
  'rice vinegar': {
    input: {
      item: 'rice vinegar',
      qty: 6,
      unit: 'tablespoon',
    },
    category: 'pasta-grains',
  },
  'rice wine vinegar': {
    input: {
      item: 'rice wine vinegar',
      qty: 1.333,
      unit: 'tablespoon',
    },
    category: 'pasta-grains',
  },
  'rigatoni pasta': {
    input: {
      item: 'rigatoni pasta',
      qty: 16,
      unit: 'ounce',
      desc: 'short',
    },
    category: 'pasta-grains',
  },
  'rolled oat': {
    input: {
      item: 'rolled oat',
      qty: 0.5,
      unit: 'cup',
    },
    category: 'bakery',
  },
  'russet potato': {
    input: {
      item: 'russet potato',
      qty: 2,
      unit: 'medium',
      prep: 'peeled and diced into 1/2-inch cubes (about 1 pound)',
    },
    category: 'fresh-produce',
  },
  'salsa verde': {
    input: {
      item: 'salsa verde',
      qty: 2,
      unit: 'cup',
    },
    category: 'other',
  },
  salt: {
    input: {
      item: 'salt',
      qty: 1,
      unit: 'teaspoon',
    },
    category: 'spices-seasonings',
  },
  'sea salt': {
    input: {
      item: 'sea salt',
      qty: 0.5,
      unit: 'teaspoon',
    },
    category: 'spices-seasonings',
  },
  'sesame oil': {
    input: {
      item: 'sesame oil',
      qty: 2,
      unit: 'teaspoon',
    },
    category: 'oils-vinegars',
  },
  'sesame seed': {
    input: {
      item: 'sesame seed',
      qty: 0.25,
      unit: 'cup',
    },
    category: 'other',
  },
  'shortbread cookie': {
    input: {
      item: 'shortbread cookie',
      qty: 9,
      unit: 'ounce',
    },
    category: 'bakery',
  },
  'sliced bread': {
    input: {
      item: 'sliced bread',
      qty: 1,
      unit: 'loaf',
    },
    category: 'bakery',
  },
  'sliced cheese': {
    input: {
      item: 'sliced cheese',
      qty: 1,
      unit: 'package',
    },
    category: 'butter-cheese',
  },
  'smoked paprika': {
    input: {
      item: 'smoked paprika',
      qty: 2,
      unit: 'teaspoon',
    },
    category: 'spices-seasonings',
  },
  'snow peas or sugar snap peas': {
    input: {
      item: 'snow peas or sugar snap peas',
      qty: 4,
      unit: 'ounce',
      desc: 'about 1 1/2 cups',
      prep: 'trimmed',
    },
    category: 'fresh-produce',
  },
  'soy sauce': {
    input: {
      item: 'soy sauce',
      qty: 2,
      unit: 'tablespoon',
      desc: 'low-sodium',
    },
    category: 'condiments',
  },
  'spicy mayonnaise': {
    input: {
      item: 'spicy mayonnaise',
      prep: 'to serve',
    },
    category: 'condiments',
  },
  sriracha: {
    input: {
      item: 'sriracha',
      qty: 1,
      unit: 'tablespoon',
      optional: true,
    },
    category: 'condiments',
  },
  'steamed rice': {
    input: {
      item: 'steamed rice',
      prep: 'for serving',
    },
    category: 'pasta-grains',
  },
  sugar: {
    input: {
      item: 'sugar',
      qty: 0.25,
      unit: 'cup',
    },
    category: 'baking',
  },
  'summer squash': {
    input: {
      item: 'summer squash',
      qty: 4,
      desc: '(about 7-8 ounces each)',
      prep: 'sliced into 1/8-inch half moons',
    },
    category: 'fresh-produce',
  },
  'sweet chilli sauce': {
    input: {
      item: 'sweet chilli sauce',
      qty: 0.25,
      unit: 'cup',
    },
    category: 'condiments',
  },
  'sweetened condensed milk': {
    input: {
      item: 'sweetened condensed milk',
      qty: 1,
      unit: 'can (14-ounce)',
    },
    category: 'milk-cream',
  },
  tamari: {
    input: {
      item: 'tamari',
      qty: 1,
      unit: 'tablespoon',
    },
    category: 'other',
  },
  tequila: {
    input: {
      item: 'tequila',
      qty: 1.5,
      unit: 'tablespoon',
    },
    category: 'other',
  },
  thyme: {
    input: {
      item: 'thyme',
      qty: 1,
      unit: 'tablespoon',
      desc: 'fresh',
    },
    category: 'fresh-herbs',
  },
  'tortilla chip': {
    input: {
      item: 'tortilla chip',
      prep: 'for serving',
    },
    category: 'bakery',
  },
  'vanilla extract': {
    input: {
      item: 'vanilla extract',
      qty: 3,
      unit: 'teaspoon',
    },
    category: 'baking',
  },
  'vegetable oil': {
    input: {
      item: 'vegetable oil',
      qty: 2,
      unit: 'tablespoon',
    },
    category: 'oils-vinegars',
  },
  water: {
    input: {
      item: 'water',
      qty: 4,
      unit: 'cup',
    },
    category: 'beverages',
  },
  'whipped cream': {
    input: {
      item: 'whipped cream',
      desc: 'freshly',
      prep: 'for serving',
    },
    category: 'milk-cream',
  },
  'white rice': {
    input: {
      item: 'white rice',
      prep: 'to serve',
    },
    category: 'pasta-grains',
  },
  'whole-egg mayonnaise': {
    input: {
      item: 'whole-egg mayonnaise',
      qty: 1,
      unit: 'cup',
    },
    category: 'eggs',
  },
  zucchini: {
    input: {
      item: 'zucchini',
      qty: 1,
      unit: 'medium',
      prep: 'diced into 1/2-inch cubes (about 1 1/2 cups)',
    },
    category: 'fresh-produce',
  },
};

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
  // 1. Custom Conversion Rules tests
  RULE_TEST_CASES.forEach(({ input, expected }, idx) => {
    test(`Rule Test #${idx + 1}: ${input.qty} ${input.unit || ''} of ${input.item} converts correctly`, () => {
      const result = processShoppingList([input]);
      let item: ShoppingItem | undefined;
      if (expected.staple === 'in-pantry') {
        item = result.stapleItems.find(
          (i) => i.item.toLowerCase() === input.item.toLowerCase(),
        );
      } else if (input.optional) {
        item = result.optionalItems.find(
          (i) => i.item.toLowerCase() === input.item.toLowerCase(),
        );
      } else {
        item =
          result.buyItems.find(
            (i) => i.item.toLowerCase() === input.item.toLowerCase(),
          ) ||
          result.stapleItems.find(
            (i) => i.item.toLowerCase() === input.item.toLowerCase(),
          ) ||
          result.optionalItems.find(
            (i) => i.item.toLowerCase() === input.item.toLowerCase(),
          );
      }

      expect(item).toBeDefined();
      expect(item?.category).toBe(expected.category);
      if (expected.unit !== undefined) {
        expect(item?.unit).toBe(expected.unit);
      }
      if (expected.qty !== undefined) {
        expect(item?.qty).toBe(expected.qty);
      }
      if (expected.sizeNote !== undefined) {
        expect(item?.note?.sizeNote).toBe(expected.sizeNote);
      }
    });
  });

  // 2. Rule-Based Recipe Ingredients tests
  Object.entries(RULE_BASED_RECIPE_CASES).forEach(
    ([_key, { input, expected }]) => {
      test(`Recipe Rule Ingredient: ${input.item} with recipe input converts correctly`, () => {
        const result = processShoppingList([input]);
        let item: ShoppingItem | undefined;
        if (expected.staple === 'in-pantry') {
          item = result.stapleItems.find(
            (i) => i.item.toLowerCase() === input.item.toLowerCase(),
          );
        } else if (input.optional) {
          item = result.optionalItems.find(
            (i) => i.item.toLowerCase() === input.item.toLowerCase(),
          );
        } else {
          item =
            result.buyItems.find(
              (i) => i.item.toLowerCase() === input.item.toLowerCase(),
            ) ||
            result.stapleItems.find(
              (i) => i.item.toLowerCase() === input.item.toLowerCase(),
            ) ||
            result.optionalItems.find(
              (i) => i.item.toLowerCase() === input.item.toLowerCase(),
            );
        }

        expect(item).toBeDefined();
        expect(item?.category).toBe(expected.category);
        expect(item?.unit).toBe(expected.unit);
        expect(item?.qty).toBe(expected.qty);
        if (expected.sizeNote !== undefined) {
          expect(item?.note?.sizeNote).toBe(expected.sizeNote);
        }
      });
    },
  );

  // 3. Simple Recipe Ingredients tests
  Object.entries(SIMPLE_RECIPE_CASES).forEach(([_key, { input, category }]) => {
    test(`Simple Recipe Ingredient: ${input.item} is categorized and preserved/scaled`, () => {
      const result = processShoppingList([input]);
      const item =
        result.buyItems.find(
          (i) => i.item.toLowerCase() === input.item.toLowerCase(),
        ) ||
        result.stapleItems.find(
          (i) => i.item.toLowerCase() === input.item.toLowerCase(),
        ) ||
        result.optionalItems.find(
          (i) => i.item.toLowerCase() === input.item.toLowerCase(),
        );

      expect(item).toBeDefined();
      expect(item?.category).toBe(category);
      // Compute mathematically expected outputs for simple items (since they have no rules)
      let expectedQty =
        input.qty === undefined
          ? null
          : Array.isArray(input.qty)
            ? (input.qty[0] + input.qty[1]) / 2
            : input.qty;
      let expectedUnit = input.unit || '';

      if (expectedQty !== null && expectedUnit) {
        if (getConversionFactor(expectedUnit, 'teaspoon') > 0) {
          // Convert to teaspoon base
          expectedQty = convertQty(expectedQty, expectedUnit, 'teaspoon');
          expectedUnit = 'teaspoon';
          // Format back
          if (expectedQty >= 48) {
            expectedQty = expectedQty / 48;
            expectedUnit = 'cup';
          } else if (expectedQty >= 3) {
            expectedQty = expectedQty / 3;
            expectedUnit = 'tablespoon';
          }
        } else if (getConversionFactor(expectedUnit, 'ounce') > 0) {
          // Convert to ounce base
          expectedQty = convertQty(expectedQty, expectedUnit, 'ounce');
          expectedUnit = 'ounce';
          // Format back
          if (expectedQty >= 16) {
            expectedQty = expectedQty / 16;
            expectedUnit = 'pound';
          }
        }
      }

      if (expectedQty !== null) {
        expectedQty = Math.ceil(expectedQty * 100) / 100;
      }

      expect(item?.qty).toBe(expectedQty);
      expect(item?.unit).toBe(expectedUnit);
    });
  });

  // 4. Rule completeness assert
  test('every rule in ITEM_RULES is exercised by at least one test case', () => {
    const unexercisedRules: string[] = [];

    for (const rule of ITEM_RULES) {
      const isExercised =
        RULE_TEST_CASES.some((tc) =>
          rule.items.includes(tc.input.item.toLowerCase().trim()),
        ) ||
        Object.values(RULE_BASED_RECIPE_CASES).some((tc) =>
          rule.items.includes(tc.input.item.toLowerCase().trim()),
        );
      if (!isExercised) {
        unexercisedRules.push(rule.items.join(', '));
      }
    }

    expect(unexercisedRules).toEqual([]);
  });

  // 5. Database coverage assert
  test('every unique ingredient in recipes is covered by at least one test case', () => {
    const allIngredients = getAllIngredientsFromContent();
    const uncoveredIngredients: string[] = [];

    for (const ing of allIngredients) {
      const lower = ing.toLowerCase().trim();
      const isCovered =
        lower in RULE_BASED_RECIPE_CASES || lower in SIMPLE_RECIPE_CASES;
      if (!isCovered) {
        uncoveredIngredients.push(ing);
      }
    }

    expect(uncoveredIngredients).toEqual([]);
  });
});
