/**
 * Mappings and utilities for singular to plural units and cooking numbers.
 */

export const SINGULAR_TO_PLURAL: Record<string, string> = {
  ounce: "ounces",
  pound: "pounds",
  cup: "cups",
  teaspoon: "teaspoons",
  tablespoon: "tablespoons",
  clove: "cloves",
  can: "cans",
  gram: "grams",
  small: "small",
  large: "large",
  medium: "medium",
  lemon: "lemons",
  lime: "limes",
  head: "heads",
  root: "roots",
  bundle: "bundles",
  bottle: "bottles",
  jar: "jars",
  box: "boxes",
  package: "packages",
  container: "containers",
  onion: "onions",
  stick: "sticks",
  "quart (32 fl oz)": "quarts (32 fl oz)",
  "quart (32 oz)": "quarts (32 oz)",
  "pint (16 fl oz)": "pints (16 fl oz)",
  "pint (16 oz)": "pints (16 oz)",
  "half-pint (8 oz)": "half-pints (8 oz)",
  egg: "eggs",
  "egg yolk": "egg yolks",
  scallion: "scallions",
  lb: "lbs",
  bulb: "bulbs",
  leaf: "leaves",
  half: "halves",
};

export const PLURAL_TO_SINGULAR: Record<string, string> = Object.fromEntries(
  Object.entries(SINGULAR_TO_PLURAL).map(([sing, plur]) => [plur, sing]),
);

/**
 * Returns the plural or singular form of a unit based on the quantity.
 */
export function getAdaptiveUnit(qty: number | null, unit: string): string {
  if (!unit) return "";
  if (qty === null) return unit;
  const lowerUnit = unit.toLowerCase();

  // If quantity is less than or equal to 1, return singular form
  if (qty <= 1) {
    return PLURAL_TO_SINGULAR[lowerUnit] || unit;
  }
  // Otherwise, return plural form
  return SINGULAR_TO_PLURAL[lowerUnit] || unit;
}

interface FractionMapItem {
  dec: number;
  str: string;
}

/**
 * Formats a decimal number into standard culinary fractions (e.g. 1/2, 1/4)
 * or a clean decimal.
 */
export function formatCookingNumber(val: number): string {
  if (val <= 0) return "0";

  const rounded = Math.round(val * 1000) / 1000;
  const whole = Math.floor(rounded);
  const dec = Math.round((rounded - whole) * 1000) / 1000;

  const fractionMap: FractionMapItem[] = [
    { dec: 0.125, str: "1/8" },
    { dec: 0.25, str: "1/4" },
    { dec: 0.333, str: "1/3" },
    { dec: 0.375, str: "3/8" },
    { dec: 0.5, str: "1/2" },
    { dec: 0.625, str: "5/8" },
    { dec: 0.667, str: "2/3" },
    { dec: 0.75, str: "3/4" },
    { dec: 0.875, str: "7/8" },
  ];

  if (dec < 0.05) {
    return whole > 0 ? whole.toString() : "0";
  }
  if (dec > 0.95) {
    return (whole + 1).toString();
  }

  // Locate the closest matching fraction
  let closest = fractionMap[0];
  let minDiff = Math.abs(dec - closest.dec);
  for (let i = 1; i < fractionMap.length; i++) {
    const diff = Math.abs(dec - fractionMap[i].dec);
    if (diff < minDiff) {
      minDiff = diff;
      closest = fractionMap[i];
    }
  }

  // Format as a fraction if it is close enough to standard cooking increments
  if (minDiff < 0.06) {
    return whole > 0 ? `${whole} ${closest.str}` : closest.str;
  }

  // Otherwise, display as a clean, concise decimal (e.g. 1.2 or 0.7)
  return rounded.toFixed(2).replace(/\.?0+$/, "");
}
