export const STAPLES: string[] = [
  'salt', 'pepper', 'olive oil', 'vegetable oil', 'canola oil', 'cooking spray',
  'sugar', 'flour', 'baking powder', 'baking soda', 'vanilla extract', 'cornstarch',
  'yeast', 'paprika', 'cumin', 'garlic powder', 'onion powder', 'oregano', 'thyme',
  'rosemary', 'cayenne', 'chili powder', 'cinnamon', 'nutmeg', 'ginger powder',
  'ground ginger', 'turmeric', 'coriander', 'cardamom', 'cloves powder', 'allspice',
  'mustard powder', 'parsley', 'basil', 'sage', 'lemon juice', 'lime juice', 'butter', 'water'
];

export const VOLUME_UNITS: string[] = [
  'cup', 'cups', 'tablespoon', 'tablespoons', 'tbsp', 'teaspoon', 'teaspoons', 'tsp', 'ounce', 'ounces', 'oz', 'ml'
];

export const TO_TEASPOONS: Record<string, number> = {
  teaspoon: 1,
  tsp: 1,
  tablespoon: 3,
  tbsp: 3,
  ounce: 6,
  oz: 6,
  cup: 48,
  ml: 0.202884
};


