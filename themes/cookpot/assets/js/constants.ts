export const SINGULAR_TO_PLURAL: Record<string, string> = {
  ounce: 'ounces',
  pound: 'pounds',
  cup: 'cups',
  teaspoon: 'teaspoons',
  tablespoon: 'tablespoons',
  clove: 'cloves',
  can: 'cans',
  gram: 'grams',
  small: 'small',
  large: 'large',
  medium: 'medium',
  lemon: 'lemons',
  lime: 'limes',
  head: 'heads',
  root: 'roots',
  bundle: 'bundles',
  bottle: 'bottles',
  jar: 'jars',
  box: 'boxes',
  package: 'packages',
  container: 'containers',
  'quart (32 fl oz)': 'quarts (32 fl oz)',
  'quart (32 oz)': 'quarts (32 oz)',
  'pint (16 fl oz)': 'pints (16 fl oz)',
  'pint (16 oz)': 'pints (16 oz)',
  'half-pint (8 oz)': 'half-pints (8 oz)'
};

export const PLURAL_TO_SINGULAR: Record<string, string> = Object.fromEntries(
  Object.entries(SINGULAR_TO_PLURAL).map(([sing, plur]) => [plur, sing])
);
