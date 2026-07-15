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
    unitEquivalences: {
      stick: { base: 'tablespoon', factor: 8 },
    },
  },

  // 3. Eggs
  {
    items: ['egg', 'egg yolk'],
  },

  // 4. Lemons
  {
    items: ['lemon', 'lemon juice', 'lemon zest'],
    unitEquivalences: {
      tablespoon: { base: 'lemon', factor: 0.3333 }, // 1 tbsp ≈ 1/3 lemon
      tbsp: { base: 'lemon', factor: 0.3333 },
      teaspoon: { base: 'lemon', factor: 0.1111 },
      tsp: { base: 'lemon', factor: 0.1111 },
    },
  },

  // 5. Limes
  {
    items: ['lime', 'lime juice', 'lime zest'],
    unitEquivalences: {
      tablespoon: { base: 'lime', factor: 0.5 }, // 1 tbsp ≈ 1/2 lime
      tbsp: { base: 'lime', factor: 0.5 },
      teaspoon: { base: 'lime', factor: 0.1666 },
      tsp: { base: 'lime', factor: 0.1666 },
    },
  },

  // 6. Half-Pint Liquids
  {
    items: ['sour cream', 'ricotta'],
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
    unitEquivalences: {
      'pint (16 fl oz)': { base: 'cup', factor: 2 },
      'quart (32 fl oz)': { base: 'cup', factor: 4 },
      'pint (16 oz)': { base: 'cup', factor: 2 },
      'quart (32 oz)': { base: 'cup', factor: 4 },
    },
  },

  // 8. Ginger
  {
    items: ['ginger'],
    unitEquivalences: {
      root: { base: 'tablespoon', factor: 3 },
    },
  },

  // 9. Onion
  {
    items: ['onion', 'yellow onion', 'white onion', 'red onion', 'sweet onion'],
    unitEquivalences: {
      cup: { base: 'onion', factor: 1 },
    },
  },

  // 10. Coconut Milk
  {
    items: ['coconut milk', 'canned coconut milk'],
    unitEquivalences: {
      'can (13.5 oz)': { base: 'ounce', factor: 13.5 },
      'can (400 ml)': { base: 'ounce', factor: 13.53 },
      can: { base: 'ounce', factor: 13.5 },
    },
  },

  // 11. Cabbage
  {
    items: ['cabbage', 'red cabbage', 'green cabbage'],
    unitEquivalences: {
      cup: { base: 'head', factor: 0.125 }, // 1 cup ≈ 1/8 head
    },
  },

  // 12. Scallions
  {
    items: ['scallion', 'spring onion', 'green onion'],
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
    unitEquivalences: {
      'box (16 oz)': { base: 'ounce', factor: 16 },
      pound: { base: 'ounce', factor: 16 },
      lb: { base: 'ounce', factor: 16 },
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
    unitEquivalences: {
      'can (14 oz)': { base: 'ounce', factor: 14 },
      'can (15 oz)': { base: 'ounce', factor: 15 },
      'can (400 g)': { base: 'ounce', factor: 14.1 },
      can: { base: 'ounce', factor: 15 },
      pound: { base: 'ounce', factor: 16 },
      lb: { base: 'ounce', factor: 16 },
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
    unitEquivalences: {
      'can (15 oz)': { base: 'ounce', factor: 15 },
      'can (28 oz)': { base: 'ounce', factor: 28 },
      'can (400 g)': { base: 'ounce', factor: 14.1 },
      can: { base: 'ounce', factor: 15 },
      pound: { base: 'ounce', factor: 16 },
      lb: { base: 'ounce', factor: 16 },
    },
  },

  // 16. Roasted Red Peppers
  {
    items: ['jarred roasted red pepper', 'roasted red pepper'],
    unitEquivalences: {
      '8-oz jar': { base: 'ounce', factor: 8 },
      jar: { base: 'ounce', factor: 8 },
      cup: { base: 'ounce', factor: 8 },
      pound: { base: 'ounce', factor: 16 },
      lb: { base: 'ounce', factor: 16 },
    },
  },

  // 17. Potato Gnocchi
  {
    items: ['potato gnocchi', 'gnocchi'],
    unitEquivalences: {
      '17.5-oz package': { base: 'ounce', factor: 17.5 },
      package: { base: 'ounce', factor: 17.5 },
      pound: { base: 'ounce', factor: 16 },
      lb: { base: 'ounce', factor: 16 },
    },
  },

  // 18. Baby Spinach
  {
    items: ['baby spinach', 'spinach'],
    unitEquivalences: {
      '8 oz bag': { base: 'ounce', factor: 8 },
      bag: { base: 'ounce', factor: 8 },
      cup: { base: 'ounce', factor: 1 },
      pound: { base: 'ounce', factor: 16 },
      lb: { base: 'ounce', factor: 16 },
    },
  },
];
