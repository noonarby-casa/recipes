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
  'all-purpose flour',
  'cake flour',
  'baking powder',
  'baking soda',
  'vanilla extract',
  'cornstarch',
  'yeast',
  'paprika',
  'smoked paprika',
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
  'bay leaf',
  'curry powder',
  'garam masala powder',
  'sesame seed',
]);

export const ITEM_RULES: ItemRule[] = [
  // 1. Garlic: cloves -> heads
  {
    items: ['garlic', 'garlic clove', 'clove garlic'],
    canonicalName: 'garlic',
    unitEquivalences: {
      head: { base: 'clove', factor: 10 },
      bulb: { base: 'clove', factor: 10 },
    },
  },

  // 2. Butter
  {
    items: ['butter'],
    canonicalName: 'butter',
    unitEquivalences: {
      'box (4 sticks)': { base: 'tablespoon', factor: 32 },
      stick: { base: 'tablespoon', factor: 8 },
    },
  },

  // 3. Eggs
  {
    items: ['egg', 'egg yolk'],
    canonicalName: 'egg',
    unitEquivalences: {
      yolk: { base: 'egg', factor: 1 },
    },
  },

  // 4. Lemons
  {
    items: ['lemon', 'lemon zest'],
    canonicalName: 'lemon',
    unitEquivalences: {
      tablespoon: { base: 'lemon', factor: 0.3333 }, // 1 tbsp ≈ 1/3 lemon
      tbsp: { base: 'lemon', factor: 0.3333 },
      teaspoon: { base: 'lemon', factor: 0.1111 },
      tsp: { base: 'lemon', factor: 0.1111 },
    },
  },

  // 4a. Lemon Juice
  {
    items: ['lemon juice'],
    canonicalName: 'lemon juice',
    unitEquivalences: {
      'bottle (16 fl oz)': { base: 'ounce', factor: 16 },
      bottle: { base: 'ounce', factor: 16 },
    },
  },

  // 5. Limes
  {
    items: ['lime', 'lime zest'],
    canonicalName: 'lime',
    unitEquivalences: {
      tablespoon: { base: 'lime', factor: 0.5 }, // 1 tbsp ≈ 1/2 lime
      tbsp: { base: 'lime', factor: 0.5 },
      teaspoon: { base: 'lime', factor: 0.1666 },
      tsp: { base: 'lime', factor: 0.1666 },
    },
  },

  // 5a. Lime Juice
  {
    items: ['lime juice'],
    canonicalName: 'lime juice',
    unitEquivalences: {
      'bottle (16 fl oz)': { base: 'ounce', factor: 16 },
      bottle: { base: 'ounce', factor: 16 },
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
    canonicalName: 'baby spinach',
    unitEquivalences: {
      '8 oz bag': { base: 'ounce', factor: 8 },
      bag: { base: 'ounce', factor: 8 },
      cup: { base: 'ounce', factor: 1 },
      pound: { base: 'ounce', factor: 16 },
      lb: { base: 'ounce', factor: 16 },
    },
  },

  // 19. Cream Cheese
  {
    items: ['cream cheese'],
    canonicalName: 'cream cheese',
    unitEquivalences: {
      '8-oz package': { base: 'ounce', factor: 8 },
      package: { base: 'ounce', factor: 8 },
    },
  },

  // 20. Feta Cheese
  {
    items: ['feta cheese', 'feta'],
    canonicalName: 'feta cheese',
    unitEquivalences: {
      '8-oz package': { base: 'ounce', factor: 8 },
      package: { base: 'ounce', factor: 8 },
    },
  },

  // 21. Chocolate Chips
  {
    items: ['chocolate chips', 'chocolate chip'],
    canonicalName: 'chocolate chips',
    unitEquivalences: {
      '12-oz bag': { base: 'ounce', factor: 12 },
      bag: { base: 'ounce', factor: 12 },
      cup: { base: 'ounce', factor: 6 }, // 1 cup ≈ 6 oz
      tablespoon: { base: 'ounce', factor: 0.375 }, // 1 tbsp ≈ 3/8 oz
    },
  },

  // 22. Tortillas
  {
    items: ['tortilla', 'tortillas'],
    canonicalName: 'tortilla',
    unitEquivalences: {
      'package of 10': { base: 'tortilla', factor: 10 },
      'package of 24': { base: 'tortilla', factor: 24 },
      'package of 30': { base: 'tortilla', factor: 30 },
      package: { base: 'tortilla', factor: 10 },
    },
  },

  // 23. Green Enchilada Sauce
  {
    items: ['green enchilada sauce', 'enchilada sauce'],
    canonicalName: 'green enchilada sauce',
    unitEquivalences: {
      '10-oz can': { base: 'ounce', factor: 10 },
      '28-oz can': { base: 'ounce', factor: 28 },
      can: { base: 'ounce', factor: 10 },
      cup: { base: 'ounce', factor: 8 },
    },
  },

  // 24. Kale
  {
    items: ['kale'],
    canonicalName: 'kale',
    unitEquivalences: {
      '5-oz package': { base: 'ounce', factor: 5 },
      package: { base: 'ounce', factor: 5 },
      cup: { base: 'ounce', factor: 2 }, // 1 cup kale is about 2 oz
    },
  },

  // 25. Parmesan
  {
    items: ['parmesan', 'parmesan cheese', 'parmigiano', 'parmigiano-reggiano'],
    canonicalName: 'parmesan',
    unitEquivalences: {
      wedge: { base: 'ounce', factor: 8 },
      tablespoon: { base: 'ounce', factor: 0.3 },
      tbsp: { base: 'ounce', factor: 0.3 },
      cup: { base: 'ounce', factor: 4 },
    },
  },

  // 26. Jalapeños
  {
    items: ['jalapeño', 'jalapeno', 'jalapeño slices', 'jalapeno slices'],
    canonicalName: 'jalapeño',
    defaultQty: 1,
  },
];
