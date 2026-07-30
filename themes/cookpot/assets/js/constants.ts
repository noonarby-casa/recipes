import type { UnitDefinition } from './types';
import { ITEM_RULES } from './data/rules';

export const UNIT_DEFINITIONS: readonly UnitDefinition[] = [
  // Volume (base: teaspoon)
  {
    singular: 'teaspoon',
    plural: 'teaspoons',
    category: 'VOLUME',
    base: 'teaspoon',
    factor: 1,
    aliases: ['tsp'],
  },
  {
    singular: 'tablespoon',
    plural: 'tablespoons',
    category: 'VOLUME',
    base: 'teaspoon',
    factor: 3,
    aliases: ['tbsp', 'tbs'],
  },
  {
    singular: 'ounce',
    plural: 'ounces',
    category: 'VOLUME',
    base: 'teaspoon',
    factor: 6,
    aliases: ['oz', 'fl oz', 'fl. oz'],
  },
  {
    singular: 'cup',
    plural: 'cups',
    category: 'VOLUME',
    base: 'teaspoon',
    factor: 48,
  },
  {
    singular: 'ml',
    plural: 'ml',
    category: 'VOLUME',
    base: 'teaspoon',
    factor: 0.202884,
  },
  {
    singular: 'pint',
    plural: 'pints',
    category: 'VOLUME',
    base: 'teaspoon',
    factor: 96,
  },
  {
    singular: 'quart',
    plural: 'quarts',
    category: 'VOLUME',
    base: 'teaspoon',
    factor: 192,
  },
  {
    singular: 'gallon',
    plural: 'gallons',
    category: 'VOLUME',
    base: 'teaspoon',
    factor: 768,
  },

  // Weight (base: ounce)
  {
    singular: 'gram',
    plural: 'grams',
    category: 'WEIGHT',
    base: 'ounce',
    factor: 0.03527,
    aliases: ['g'],
  },
  {
    singular: 'pound',
    plural: 'pounds',
    category: 'WEIGHT',
    base: 'ounce',
    factor: 16,
    aliases: ['lb', 'lbs'],
  },

  // Package Units
  { singular: 'can', plural: 'cans', category: 'PACKAGE' },
  { singular: 'box', plural: 'boxes', category: 'PACKAGE' },
  { singular: 'jar', plural: 'jars', category: 'PACKAGE' },
  { singular: 'bottle', plural: 'bottles', category: 'PACKAGE' },
  { singular: 'package', plural: 'packages', category: 'PACKAGE' },
  { singular: 'bag', plural: 'bags', category: 'PACKAGE' },
  { singular: 'container', plural: 'containers', category: 'PACKAGE' },
  {
    singular: 'half-pint (8 oz)',
    plural: 'half-pints (8 oz)',
    category: 'PACKAGE',
  },
  { singular: 'pint (16 oz)', plural: 'pints (16 oz)', category: 'PACKAGE' },
  {
    singular: 'pint (16 fl oz)',
    plural: 'pints (16 fl oz)',
    category: 'PACKAGE',
  },
  { singular: 'quart (32 oz)', plural: 'quarts (32 oz)', category: 'PACKAGE' },
  {
    singular: 'quart (32 fl oz)',
    plural: 'quarts (32 fl oz)',
    category: 'PACKAGE',
  },

  // Countable Units & Size Modifiers
  { singular: 'clove', plural: 'cloves', category: 'COUNTABLE' },
  {
    singular: 'head',
    plural: 'heads',
    category: 'COUNTABLE',
    aliases: ['bulb'],
  },
  { singular: 'root', plural: 'roots', category: 'COUNTABLE' },
  { singular: 'bundle', plural: 'bundles', category: 'COUNTABLE' },
  { singular: 'stick', plural: 'sticks', category: 'COUNTABLE' },
  { singular: 'small', plural: 'small', category: 'COUNTABLE' },
  { singular: 'large', plural: 'large', category: 'COUNTABLE' },
  { singular: 'medium', plural: 'medium', category: 'COUNTABLE' },
  { singular: 'leaf', plural: 'leaves', category: 'COUNTABLE' },
  { singular: 'half', plural: 'halves', category: 'COUNTABLE' },
  { singular: 'sprig', plural: 'sprigs', category: 'COUNTABLE' },
  { singular: 'stalk', plural: 'stalks', category: 'COUNTABLE' },
  { singular: 'rib', plural: 'ribs', category: 'COUNTABLE' },
  { singular: 'bunch', plural: 'bunches', category: 'COUNTABLE' },
  { singular: 'strip', plural: 'strips', category: 'COUNTABLE' },
  { singular: 'ear', plural: 'ears', category: 'COUNTABLE' },
  { singular: 'loaf', plural: 'loaves', category: 'COUNTABLE' },
  { singular: 'slice', plural: 'slices', category: 'COUNTABLE' },
  { singular: 'piece', plural: 'pieces', category: 'COUNTABLE' },
  { singular: 'wedge', plural: 'wedges', category: 'COUNTABLE' },
];

export const UNIT_LOOKUP: Record<string, UnitDefinition> = Object.fromEntries(
  UNIT_DEFINITIONS.flatMap((u) => [
    [u.singular.toLowerCase(), u],
    [u.plural.toLowerCase(), u],
    ...(u.aliases?.map((alias) => [alias.toLowerCase(), u]) || []),
  ]),
);

export const UNIT_CONVERSIONS: Record<
  string,
  { system: string; base: string; factor: number }
> = Object.fromEntries(
  UNIT_DEFINITIONS.filter(
    (u) =>
      (u.category === 'VOLUME' || u.category === 'WEIGHT') &&
      u.base &&
      u.factor,
  ).flatMap((u) => {
    const entry = {
      system: u.category.toLowerCase(),
      base: u.base!,
      factor: u.factor!,
    };
    return [
      [u.singular, entry],
      [u.plural, entry],
      ...(u.aliases?.map((alias) => [alias, entry]) || []),
    ];
  }),
);

export const PRIMARY_TAGS: readonly string[] = [
  'breakfast',
  'lunch',
  'appetizer',
  'dinner',
  'dessert',
  'vegetarian',
  'vegan',
];

export const BREAKDOWN_CATEGORIES: readonly string[] = [
  ...PRIMARY_TAGS,
  'chicken',
  'meat',
  'baking',
  'pasta',
  'soup',
  'salad',
];

// Derive item singular/plural entries from ITEM_RULES
const itemSingularPluralEntries: [string, string][] = ITEM_RULES.flatMap(
  (r) => {
    const entries: [string, string][] = [];
    r.items.forEach((item) => {
      if (typeof item !== 'string') {
        item.aliases?.forEach((alias) => {
          entries.push([alias.toLowerCase(), item.plural.toLowerCase()]);
        });
        entries.push([item.singular.toLowerCase(), item.plural.toLowerCase()]);
      }
    });
    return entries;
  },
);

const unitSingularPluralEntries: [string, string][] = UNIT_DEFINITIONS.flatMap(
  (u): [string, string][] => [
    ...(u.aliases?.map((alias): [string, string] => [
      alias.toLowerCase(),
      u.plural.toLowerCase(),
    ]) || []),
    [u.singular.toLowerCase(), u.plural.toLowerCase()],
  ],
);

export const SINGULAR_TO_PLURAL: Record<string, string> = Object.fromEntries([
  ...unitSingularPluralEntries,
  ...itemSingularPluralEntries,
]);

export const PLURAL_TO_SINGULAR: Record<string, string> = Object.fromEntries(
  Object.entries(SINGULAR_TO_PLURAL).map(([sing, plur]) => [plur, sing]),
);

export const PLURAL_BY_DEFAULT_ITEMS: Set<string> = new Set(
  ITEM_RULES.filter((r) => r.pluralByDefault).flatMap((r) => [
    r.canonicalName.toLowerCase(),
    ...r.items.flatMap((item) =>
      typeof item === 'string'
        ? [item.toLowerCase()]
        : [
            item.singular.toLowerCase(),
            item.plural.toLowerCase(),
            ...(item.aliases?.map((a) => a.toLowerCase()) || []),
          ],
    ),
  ]),
);
