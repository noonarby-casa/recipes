import { SINGULAR_TO_PLURAL, PLURAL_TO_SINGULAR } from './constants';


/**
 * Returns the plural or singular form of a unit based on the quantity.
 */
export function getAdaptiveUnit(qty: number | null, unit: string): string {
  if (!unit) {
    return '';
  }
  if (qty === null) {
    return unit;
  }
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
  if (val <= 0) {
    return '0';
  }

  const rounded = Math.round(val * 1000) / 1000;
  const whole = Math.floor(rounded);
  const dec = Math.round((rounded - whole) * 1000) / 1000;

  const fractionMap: FractionMapItem[] = [
    { dec: 0.125, str: '1/8' },
    { dec: 0.25, str: '1/4' },
    { dec: 0.333, str: '1/3' },
    { dec: 0.375, str: '3/8' },
    { dec: 0.5, str: '1/2' },
    { dec: 0.625, str: '5/8' },
    { dec: 0.667, str: '2/3' },
    { dec: 0.75, str: '3/4' },
    { dec: 0.875, str: '7/8' },
  ];

  if (dec < 0.05) {
    return whole > 0 ? whole.toString() : '0';
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
  return rounded.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * Pluralizes a word (either a unit or an item) leveraging SINGULAR_TO_PLURAL and fallback rules.
 */
export function pluralizeWord(word: string): string {
  const lower = word.toLowerCase().trim();
  if (SINGULAR_TO_PLURAL[lower]) {
    return SINGULAR_TO_PLURAL[lower];
  }
  if (word.includes('(')) {
    const parts = word.split('(');
    const firstWord = parts[0].trim();
    const rest = parts.slice(1).join('(');
    return `${pluralizeWord(firstWord)} (${rest}`;
  }
  if (
    lower.endsWith('y') &&
    !lower.endsWith('ay') &&
    !lower.endsWith('ey') &&
    !lower.endsWith('oy') &&
    !lower.endsWith('uy')
  ) {
    return word.slice(0, -1) + 'ies';
  }
  if (
    lower.endsWith('ch') ||
    lower.endsWith('sh') ||
    lower.endsWith('s') ||
    lower.endsWith('x') ||
    lower.endsWith('z')
  ) {
    return word + 'es';
  }
  return word + 's';
}

/**
 * Formats a shopping item's quantity and name, applying unit-substring deduplication and pluralization.
 */
export function formatItemQuantity(
  qty: number | null,
  unit: string,
  item: string,
): { qtyStr: string; itemStr: string } {
  let displayUnit = unit.trim();
  let displayItem = item.trim();
  const shouldPluralize = qty === null || qty > 1;

  if (displayUnit) {
    const isSubstring = displayItem
      .toLowerCase()
      .includes(displayUnit.toLowerCase());
    if (isSubstring) {
      if (shouldPluralize) {
        displayItem = pluralizeWord(displayItem);
      }
      displayUnit = '';
    } else {
      if (shouldPluralize) {
        displayUnit = pluralizeWord(displayUnit);
      }
    }
  } else {
    if (shouldPluralize) {
      displayItem = pluralizeWord(displayItem);
    }
  }

  const formattedQty = qty !== null ? formatCookingNumber(qty) : '';
  const qtyStr = formattedQty
    ? `${formattedQty}${displayUnit ? ' ' + displayUnit : ''}`
    : '';

  return { qtyStr, itemStr: displayItem };
}
