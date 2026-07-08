import { ItemRule } from './types';

export const STAPLE_ITEMS: Set<string> = new Set([
  'salt',
  'pepper',
  'olive oil',
  'vegetable oil',
  'canola oil',
  'cooking spray',
  'sugar',
  'flour',
  'baking powder',
  'baking soda',
  'vanilla extract',
  'cornstarch',
  'yeast',
  'paprika',
  'cumin',
  'garlic powder',
  'onion powder',
  'oregano',
  'thyme',
  'rosemary',
  'cayenne',
  'chili powder',
  'cinnamon',
  'nutmeg',
  'ginger powder',
  'ground ginger',
  'turmeric',
  'coriander',
  'cardamom',
  'cloves powder',
  'allspice',
  'mustard powder',
  'parsley',
  'basil',
  'sage',
  'lemon juice',
  'lime juice',
  'water',
]);

export const UNIT_CONVERSIONS: Record<
  string,
  { system: string; base: string; factor: number }
> = {
  // Volume (base: teaspoon)
  teaspoon: { system: 'volume', base: 'teaspoon', factor: 1 },
  tsp: { system: 'volume', base: 'teaspoon', factor: 1 },
  tablespoon: { system: 'volume', base: 'teaspoon', factor: 3 },
  tbsp: { system: 'volume', base: 'teaspoon', factor: 3 },
  ounce: { system: 'volume', base: 'teaspoon', factor: 6 },
  oz: { system: 'volume', base: 'teaspoon', factor: 6 },
  cup: { system: 'volume', base: 'teaspoon', factor: 48 },
  ml: { system: 'volume', base: 'teaspoon', factor: 0.202884 },
  pint: { system: 'volume', base: 'teaspoon', factor: 96 },
  quart: { system: 'volume', base: 'teaspoon', factor: 192 },
  gallon: { system: 'volume', base: 'teaspoon', factor: 768 },

  // Weight (base: ounce)
  gram: { system: 'weight', base: 'ounce', factor: 0.03527 },
  g: { system: 'weight', base: 'ounce', factor: 0.03527 },
  pound: { system: 'weight', base: 'ounce', factor: 16 },
  lb: { system: 'weight', base: 'ounce', factor: 16 },
};

export const ITEM_RULES: ItemRule[] = [
  // 1. Garlic: cloves -> heads
  {
    items: ['garlic', 'garlic clove', 'clove garlic'],
    unitEquivalences: {
      head: { base: 'clove', factor: 10 },
      bulb: { base: 'clove', factor: 10 },
    },
  },

  // 2. Butter
  {
    items: ['butter'],
    itemSizes: [
      [1, 'stick'],
      [4, 'stick'],
      [8, 'stick'],
    ],
    unitEquivalences: {
      stick: { base: 'tablespoon', factor: 8 },
    },
  },

  // 3. Eggs
  {
    items: ['egg', 'egg yolk'],
    itemSizes: [
      [6, 'egg'],
      [12, 'egg'],
      [18, 'egg'],
    ],
  },

  // 4. Lemons
  {
    items: ['lemon', 'lemon juice', 'lemon zest'],
    unitEquivalences: {
      lemon: { base: 'tablespoon', factor: 3 }, // 1 lemon ≈ 3 tbsp juice
    },
  },

  // 5. Limes
  {
    items: ['lime', 'lime juice', 'lime zest'],
    unitEquivalences: {
      lime: { base: 'tablespoon', factor: 2 }, // 1 lime ≈ 2 tbsp juice
    },
  },

  // 6. Half-Pint Liquids
  {
    items: ['sour cream', 'ricotta'],
    itemSizes: [
      [1, 'half-pint (8 oz)'],
      [2, 'pint (16 oz)'],
      [4, 'quart (32 oz)'],
    ],
    unitEquivalences: {
      'half-pint (8 oz)': { base: 'cup', factor: 1 },
      'pint (16 oz)': { base: 'cup', factor: 2 },
      'quart (32 oz)': { base: 'cup', factor: 4 },
    },
  },

  // 7. Pint-Minimum Liquids
  {
    items: [
      'broth',
      'stock',
      'chicken broth',
      'milk',
      'heavy cream',
      'whipping cream',
      'yogurt',
      'chicken stock',
      'vegetable broth',
      'vegetable stock',
    ],
    itemSizes: [
      [1, 'pint (16 fl oz)'],
      [1, 'quart (32 fl oz)'],
    ],
    unitEquivalences: {
      'pint (16 fl oz)': { base: 'cup', factor: 2 },
      'quart (32 fl oz)': { base: 'cup', factor: 4 },
    },
  },

  // 8. Ginger
  {
    items: ['ginger'],
    itemSizes: [[1, 'root']],
    unitEquivalences: {
      root: { base: 'tablespoon', factor: 3 },
    },
  },

  // 9. Onion
  {
    items: ['onion', 'yellow onion', 'white onion', 'red onion', 'sweet onion'],
    unitEquivalences: {
      onion: { base: 'cup', factor: 1 },
    },
  },

  // 10. Coconut Milk
  {
    items: ['coconut milk', 'canned coconut milk'],
    itemSizes: [[1, 'can (13.5 oz)']],
    unitEquivalences: {
      'can (13.5 oz)': { base: 'ounce', factor: 13.5 },
      can: { base: 'ounce', factor: 13.5 },
    },
  },

  // 11. Cabbage
  {
    items: ['cabbage', 'red cabbage', 'green cabbage'],
    unitEquivalences: {
      head: { base: 'cup', factor: 8 },
    },
  },

  // 12. Scallions
  {
    items: ['scallion', 'spring onion', 'green onion'],
    itemSizes: [[1, 'bundle']],
    unitEquivalences: {
      bundle: { base: 'cup', factor: 2 }, // 1 bundle ≈ 2 cups chopped
    },
  },

  // 13. Dry Pasta
  {
    items: [
      'pasta',
      'macaroni',
      'spaghetti',
      'penne',
      'noodle',
      'noodles',
      'fettuccine',
      'linguine',
      'lasagna',
      'elbow macaroni',
      'rigatoni',
      'orzo pasta',
    ],
    itemSizes: [[1, 'box (16 oz)']],
    unitEquivalences: {
      'box (16 oz)': { base: 'ounce', factor: 16 },
    },
  },

  // 14. Chickpeas / Beans
  {
    items: [
      'chickpea',
      'black bean',
      'kidney bean',
      'cannellini bean',
      'pinto bean',
    ],
    itemSizes: [[1, 'can (15 oz)']],
    unitEquivalences: {
      'can (15 oz)': { base: 'ounce', factor: 15 },
      can: { base: 'ounce', factor: 15 },
    },
  },

  // 15. Tomatoes
  {
    items: [
      'fire roasted tomato',
      'crushed tomato',
      'diced tomato',
      'tomato sauce',
      'tomato paste',
    ],
    itemSizes: [
      [1, 'can (15 oz)'],
      [1, 'can (28 oz)'],
    ],
    unitEquivalences: {
      'can (15 oz)': { base: 'ounce', factor: 15 },
      'can (28 oz)': { base: 'ounce', factor: 28 },
      can: { base: 'ounce', factor: 15 },
    },
  },
];
