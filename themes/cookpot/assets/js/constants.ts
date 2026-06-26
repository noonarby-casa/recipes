/**
 * Mappings for singular to plural units.
 * 
 * Note: Along with standard culinary/volume/packaging units, this also includes
 * a closed set of countable ingredients (e.g., lemon, lime, onion, egg yolk, scallion)
 * because shopping list converters output these whole countables in the 'unit' field.
 * Non-countable bulk ingredients (e.g., butter, garlic) remain in the 'rest' field 
 * and do not need pluralization.
 */
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
  onion: 'onions',
  stick: 'sticks',
  'quart (32 fl oz)': 'quarts (32 fl oz)',
  'quart (32 oz)': 'quarts (32 oz)',
  'pint (16 fl oz)': 'pints (16 fl oz)',
  'pint (16 oz)': 'pints (16 oz)',
  'half-pint (8 oz)': 'half-pints (8 oz)',
  egg: 'eggs',
  'egg yolk': 'egg yolks',
  scallion: 'scallions',
  lb: 'lbs',
  bulb: 'bulbs'
};

export const PLURAL_TO_SINGULAR: Record<string, string> = Object.fromEntries(
  Object.entries(SINGULAR_TO_PLURAL).map(([sing, plur]) => [plur, sing])
);
