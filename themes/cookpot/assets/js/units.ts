import {
  SINGULAR_TO_PLURAL,
  PLURAL_TO_SINGULAR,
  PLURAL_BY_DEFAULT_ITEMS,
} from './constants';

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

  let prefix = '';
  let base = unit.trim();
  const lowerBase = base.toLowerCase();

  const SIZE_PREFIXES = [
    'large',
    'medium',
    'small',
    'thick',
    'thin',
    'extra-large',
  ];
  for (const p of SIZE_PREFIXES) {
    if (lowerBase.startsWith(p + ' ')) {
      prefix = base.substring(0, p.length + 1);
      base = base.substring(p.length + 1).trim();
      break;
    }
  }

  const lower = base.toLowerCase();

  if (qty <= 1) {
    const singularBase = PLURAL_TO_SINGULAR[lower] || base;
    return prefix + singularBase;
  }
  const pluralBase = SINGULAR_TO_PLURAL[lower] || base;
  return prefix + pluralBase;
}

/**
 * Checks if a unit is only a size modifier.
 */
export function isSizeOnlyUnit(unit: string): boolean {
  if (!unit) {
    return true;
  }
  const lower = unit.trim().toLowerCase();
  const SIZE_ONLY_UNITS = new Set([
    'large',
    'medium',
    'small',
    'thick',
    'thin',
    'extra-large',
  ]);
  return SIZE_ONLY_UNITS.has(lower);
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
  if (!word) {
    return '';
  }

  let prefix = '';
  let base = word.trim();
  const lowerBase = base.toLowerCase();

  const SIZE_PREFIXES = [
    'large',
    'medium',
    'small',
    'thick',
    'thin',
    'extra-large',
  ];
  for (const p of SIZE_PREFIXES) {
    if (lowerBase.startsWith(p + ' ')) {
      prefix = base.substring(0, p.length + 1);
      base = base.substring(p.length + 1).trim();
      break;
    }
  }

  if (base.includes('(')) {
    const parts = base.split('(');
    const firstWord = parts[0].trim();
    const rest = parts.slice(1).join('(');
    return `${prefix}${pluralizeWord(firstWord)} (${rest}`;
  }

  const lower = base.toLowerCase();
  if (PLURAL_TO_SINGULAR[lower]) {
    return prefix + base;
  }
  if (SINGULAR_TO_PLURAL[lower]) {
    return prefix + SINGULAR_TO_PLURAL[lower];
  }
  if (
    lower.endsWith('y') &&
    !lower.endsWith('ay') &&
    !lower.endsWith('ey') &&
    !lower.endsWith('oy') &&
    !lower.endsWith('uy')
  ) {
    return prefix + base.slice(0, -1) + 'ies';
  }
  if (
    lower.endsWith('ch') ||
    lower.endsWith('sh') ||
    lower.endsWith('x') ||
    lower.endsWith('z')
  ) {
    return prefix + base + 'es';
  }
  if (lower.endsWith('s')) {
    return prefix + base;
  }
  return prefix + base + 's';
}

/**
 * Singularizes a word leveraging PLURAL_TO_SINGULAR and fallback rules.
 */
export function singularizeWord(word: string): string {
  if (!word) {
    return '';
  }

  let prefix = '';
  let base = word.trim();
  const lowerBase = base.toLowerCase();

  const SIZE_PREFIXES = [
    'large',
    'medium',
    'small',
    'thick',
    'thin',
    'extra-large',
  ];
  for (const p of SIZE_PREFIXES) {
    if (lowerBase.startsWith(p + ' ')) {
      prefix = base.substring(0, p.length + 1);
      base = base.substring(p.length + 1).trim();
      break;
    }
  }

  if (base.includes('(')) {
    const parts = base.split('(');
    const firstWord = parts[0].trim();
    const rest = parts.slice(1).join('(');
    return `${prefix}${singularizeWord(firstWord)} (${rest}`;
  }

  const lower = base.toLowerCase();
  if (SINGULAR_TO_PLURAL[lower]) {
    return prefix + base;
  }
  if (PLURAL_TO_SINGULAR[lower]) {
    return prefix + PLURAL_TO_SINGULAR[lower];
  }
  if (lower.endsWith('ies')) {
    return prefix + base.slice(0, -3) + 'y';
  }
  if (lower.endsWith('es')) {
    if (
      lower.endsWith('ches') ||
      lower.endsWith('shes') ||
      lower.endsWith('xes') ||
      lower.endsWith('zes')
    ) {
      return prefix + base.slice(0, -2);
    }
  }
  if (lower.endsWith('s') && !lower.endsWith('ss')) {
    return prefix + base.slice(0, -1);
  }
  return prefix + base;
}

/**
 * Formats a shopping item's quantity and name, applying unit-substring deduplication and pluralization.
 */
export function formatItemQuantity(
  qty: number | null,
  unit: string,
  item: string,
  disablePluralization?: boolean,
): { qtyStr: string; itemStr: string } {
  let displayUnit = unit.trim();
  let displayItem = item.trim();
  const shouldPluralize = !disablePluralization && qty !== null && qty > 1;

  if (displayUnit) {
    const isSubstring =
      displayItem.toLowerCase().includes(displayUnit.toLowerCase()) ||
      singularizeWord(displayItem)
        .toLowerCase()
        .includes(singularizeWord(displayUnit).toLowerCase());
    if (isSubstring) {
      if (shouldPluralize) {
        displayItem = pluralizeWord(displayItem);
      } else if (qty !== null && qty <= 1) {
        displayItem = singularizeWord(displayItem);
      }
      displayUnit = '';
    }
  }

  if (isSizeOnlyUnit(displayUnit)) {
    // Rule 1: Countable item with no unit or size modifier
    if (shouldPluralize) {
      displayItem = pluralizeWord(displayItem);
    } else if (qty !== null && qty <= 1) {
      displayItem = singularizeWord(displayItem);
    }
  } else {
    // Standard volume/weight/container unit
    if (qty !== null) {
      displayUnit = getAdaptiveUnit(qty, displayUnit);
    }

    // Rule 2 & 3: Collection items vs Mass nouns
    const lowerItem = displayItem.toLowerCase();
    const isCollection =
      PLURAL_BY_DEFAULT_ITEMS.has(lowerItem) ||
      PLURAL_BY_DEFAULT_ITEMS.has(pluralizeWord(lowerItem)) ||
      PLURAL_BY_DEFAULT_ITEMS.has(singularizeWord(lowerItem));

    if (isCollection) {
      displayItem = pluralizeWord(displayItem);
    }
  }

  const formattedQty = qty !== null ? formatCookingNumber(qty) : '';
  const qtyStr = formattedQty
    ? `${formattedQty}${displayUnit ? ' ' + displayUnit : ''}`
    : '';

  return { qtyStr, itemStr: displayItem };
}

/**
 * Formats a recipe ingredient into HTML string for client-side rendering.
 */
export function formatRecipeIngredientHTML(
  qty: number | [number, number] | null,
  unit: string,
  item: string,
  desc: string,
  prep: string,
  alt?: {
    qty?: number | [number, number] | null;
    unit?: string;
    item?: string;
    desc?: string;
    prep?: string;
  },
): string {
  let displayQtyVal: number | null = null;
  let displayQtyStr = '';

  if (qty !== null) {
    if (Array.isArray(qty)) {
      displayQtyVal = qty[1];
      displayQtyStr = `${formatCookingNumber(qty[0])}-${formatCookingNumber(qty[1])}`;
    } else {
      displayQtyVal = qty;
      displayQtyStr = formatCookingNumber(qty);
    }
  }

  const { qtyStr, itemStr } = formatItemQuantity(displayQtyVal, unit, item);

  let mainQtyHTML = '';
  if (qty !== null) {
    const finalUnit = qtyStr.substring(displayQtyStr.length).trim();
    const displayStr = `${displayQtyStr}${finalUnit ? ' ' + finalUnit : ''}`;
    mainQtyHTML = `<span class="recipe-quantity" data-base-qty="${Array.isArray(qty) ? qty[0] + '-' + qty[1] : qty}" data-unit="${unit}">${displayStr}</span>`;
  }

  const mainDescItemParts: string[] = [];
  if (desc) {
    mainDescItemParts.push(desc.trim());
  }
  mainDescItemParts.push(itemStr.trim());
  let mainText = mainDescItemParts.join(' ');

  if (mainQtyHTML) {
    mainText = `${mainQtyHTML} ${mainText}`;
  }
  if (prep) {
    mainText = `${mainText}, ${prep.trim()}`;
  }

  if (alt && (alt.item || alt.qty)) {
    let altText = '';
    let altQtyVal: number | null = null;
    let altQtyStr = '';
    const altQty = alt.qty ?? null;

    if (altQty !== null) {
      if (Array.isArray(altQty)) {
        altQtyVal = altQty[1];
        altQtyStr = `${formatCookingNumber(altQty[0])}-${formatCookingNumber(altQty[1])}`;
      } else {
        altQtyVal = altQty;
        altQtyStr = formatCookingNumber(altQty);
      }
    }

    const altUnit = alt.unit ?? '';
    const altItem = alt.item ?? '';
    const altDesc = alt.desc ?? '';
    const altPrep = alt.prep ?? '';

    if (altItem || altDesc || altPrep) {
      const altParts: string[] = [];
      if (altQty !== null) {
        const { qtyStr: altFormattedQtyStr } = formatItemQuantity(
          altQtyVal,
          altUnit,
          altItem,
        );
        const finalAltUnit = altFormattedQtyStr
          .substring(altQtyStr.length)
          .trim();
        const altDisplayStr = `${altQtyStr}${finalAltUnit ? ' ' + finalAltUnit : ''}`;
        const altQtyHTML = `<span class="recipe-quantity" data-base-qty="${Array.isArray(altQty) ? altQty[0] + '-' + altQty[1] : altQty}" data-unit="${altUnit}">${altDisplayStr}</span>`;
        altParts.push(altQtyHTML);
      }

      const altDescItemParts: string[] = [];
      if (altDesc) {
        altDescItemParts.push(altDesc.trim());
      }
      if (altItem) {
        const { itemStr: formattedAltItem } = formatItemQuantity(
          altQtyVal ?? displayQtyVal,
          '',
          altItem,
        );
        altDescItemParts.push(formattedAltItem.trim());
      }
      let altMain = altDescItemParts.join(' ');
      if (altPrep) {
        altMain = altMain ? `${altMain}, ${altPrep.trim()}` : altPrep.trim();
      }

      if (altMain) {
        altParts.push(altMain);
      }
      altText = `(or ${altParts.join(' ')})`;
    } else if (altQty !== null) {
      const { qtyStr: altFormattedQtyStr } = formatItemQuantity(
        altQtyVal,
        altUnit,
        '',
      );
      const finalAltUnit = altFormattedQtyStr
        .substring(altQtyStr.length)
        .trim();
      const altDisplayStr = `${altQtyStr}${finalAltUnit ? ' ' + finalAltUnit : ''}`;
      const altQtyHTML = `<span class="recipe-quantity" data-base-qty="${Array.isArray(altQty) ? altQty[0] + '-' + altQty[1] : altQty}" data-unit="${altUnit}">${altDisplayStr}</span>`;
      altText = `(${altQtyHTML})`;
    }

    if (altText) {
      mainText = `${mainText} ${altText}`;
    }
  }

  return mainText;
}
