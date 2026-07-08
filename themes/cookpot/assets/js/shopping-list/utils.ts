import {
  formatCookingNumber,
  SINGULAR_TO_PLURAL,
  PLURAL_TO_SINGULAR,
} from '../units';
import { QtyValue, IngredientInput, ItemRule } from './types';
import { UNIT_CONVERSIONS } from './config';

/**
 * Returns the singular form of a given unit, or the unit itself if not found.
 */
export function getSingularUnit(unit: string): string {
  if (!unit) {
    return '';
  }
  const lower = unit.toLowerCase().trim();
  return PLURAL_TO_SINGULAR[lower] || lower;
}

export function formatQty(qty: QtyValue): string {
  if (Array.isArray(qty)) {
    return `${formatCookingNumber(qty[0])}-${formatCookingNumber(qty[1])}`;
  }
  return formatCookingNumber(qty);
}

const SIZE_PREFIXES = ['large', 'medium', 'small'];

export function getBaseUnit(unit: string): string {
  if (!unit) {
    return '';
  }
  let base = unit.toLowerCase().trim();
  for (const prefix of SIZE_PREFIXES) {
    if (base.startsWith(prefix + ' ')) {
      base = base.substring(prefix.length + 1).trim();
      break;
    }
  }
  return base;
}

export function pluralizeUnit(unit: string, qty: QtyValue): string {
  if (!unit) {
    return '';
  }

  const isPlural = Array.isArray(qty) ? qty[1] > 1 : qty > 1;
  if (!isPlural) {
    return unit;
  }

  let prefix = '';
  let base = unit.toLowerCase().trim();
  for (const p of SIZE_PREFIXES) {
    if (base.startsWith(p + ' ')) {
      // Preserve original case of the prefix
      prefix = unit.substring(0, p.length + 1);
      base = base.substring(p.length + 1).trim();
      break;
    }
  }

  const pluralBase = SINGULAR_TO_PLURAL[base];
  if (pluralBase) {
    return prefix + pluralBase;
  }

  // Fallback naive pluralization if not found in dictionary
  if (base.endsWith('s')) {
    return prefix + base;
  }
  return prefix + base + 's';
}

/**
 * Assembles a structured ingredient into a human-readable display string.
 */
export function assembleIngredientText(ing: IngredientInput): string {
  let text = '';

  // 1. Primary Amount
  if (ing.qty !== undefined) {
    text += formatQty(ing.qty);
    if (ing.unit) {
      text += ' ' + pluralizeUnit(ing.unit, ing.qty);
    }
  }

  // 2. Alt Structure
  let secondaryMeasurement = '';
  let alternateItem = '';

  if (ing.alt) {
    const hasAltItemOrDesc = !!(ing.alt.desc || ing.alt.item || ing.alt.prep);

    let q = '';
    if (ing.alt.qty !== undefined) {
      q += formatQty(ing.alt.qty);
    }
    if (ing.alt.unit) {
      q += (q ? ' ' : '') + pluralizeUnit(ing.alt.unit, ing.alt.qty ?? 1);
    }
    if (ing.alt.each) {
      q += ' each';
    }

    if (!hasAltItemOrDesc) {
      if (q) {
        secondaryMeasurement = '(' + q + ')';
      }
    } else {
      const altParts = [];
      if (q) {
        altParts.push(q);
      }

      const altDescItem = [];
      if (ing.alt.desc) {
        altDescItem.push(ing.alt.desc);
      }

      let altItemName = ing.alt.item || '';
      if (ing.alt.qty !== undefined && !ing.alt.unit && altItemName) {
        altItemName = pluralizeUnit(altItemName, ing.alt.qty);
      }
      if (altItemName) {
        altDescItem.push(altItemName);
      }

      let altMain = altDescItem.join(' ');
      if (ing.alt.prep) {
        if (altMain) {
          altMain += ', ' + ing.alt.prep;
        } else {
          altMain = ing.alt.prep;
        }
      }
      if (altMain) {
        altParts.push(altMain);
      }

      alternateItem = '(or ' + altParts.join(' ') + ')';
    }
  }

  // Insert secondary measurement if it exists
  if (secondaryMeasurement) {
    text += text ? ' ' + secondaryMeasurement : secondaryMeasurement;
  }

  // 3. Desc and Item
  const itemParts = [];
  if (ing.desc) {
    itemParts.push(ing.desc);
  }

  let itemName = ing.item;
  if (ing.qty !== undefined && !ing.unit) {
    itemName = pluralizeUnit(ing.item, ing.qty);
  }
  itemParts.push(itemName);

  const mainItemText = itemParts.join(' ');
  if (mainItemText) {
    text += text ? ' ' + mainItemText : mainItemText;
  }

  // 4. Prep
  if (ing.prep) {
    text += ', ' + ing.prep;
  }

  // Insert alternate item at the very end
  if (alternateItem) {
    text += ' ' + alternateItem;
  }

  return text.trim();
}

export function getConversionFactor(
  fromUnit: string,
  toUnit: string,
  rule?: ItemRule,
): number {
  if (fromUnit === toUnit) {
    return 1;
  }
  const fromSing = getSingularUnit(fromUnit);
  const toSing = getSingularUnit(toUnit);
  if (fromSing === toSing) {
    return 1;
  }

  // Check item-specific equivalences first
  if (rule?.unitEquivalences) {
    const fromEq = rule.unitEquivalences[fromSing];
    const toEq = rule.unitEquivalences[toSing];

    // Case A: Both units are defined in equivalences
    if (fromEq && toEq) {
      // e.g. "can (15 oz)" -> "ounce" and "can (28 oz)" -> "ounce"
      // If they share the same base, we can convert.
      if (fromEq.base === toEq.base) {
        return fromEq.factor / toEq.factor;
      }
    }

    // Case B: fromUnit is in equivalences, toUnit is universal
    if (fromEq) {
      // Convert fromUnit -> base, then base -> toUnit
      const baseFactor = getConversionFactor(fromEq.base, toSing);
      if (baseFactor > 0) {
        return fromEq.factor * baseFactor;
      }
    }

    // Case C: toUnit is in equivalences, fromUnit is universal
    if (toEq) {
      const baseFactor = getConversionFactor(fromSing, toEq.base);
      if (baseFactor > 0) {
        return baseFactor / toEq.factor;
      }
    }
  }

  // Check universal table
  const fromUniv = UNIT_CONVERSIONS[fromSing];
  const toUniv = UNIT_CONVERSIONS[toSing];

  if (fromUniv && toUniv && fromUniv.system === toUniv.system) {
    return fromUniv.factor / toUniv.factor;
  }

  // Can't convert
  return 0;
}

export function convertQty(
  qty: number,
  fromUnit: string,
  toUnit: string,
  rule?: ItemRule,
): number {
  const factor = getConversionFactor(fromUnit, toUnit, rule);
  if (factor > 0) {
    return qty * factor;
  }
  return qty;
}
