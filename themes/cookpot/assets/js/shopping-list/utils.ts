import { formatCookingNumber, pluralizeWord } from '../units';
import { QtyValue, IngredientInput, ItemRule } from './types';
import { UNIT_CONVERSIONS, PLURAL_TO_SINGULAR } from '../constants';

/**
 * Returns the singular form of a given unit, or the unit itself if not found.
 */
export function getSingularUnit(unit: string): string {
  if (!unit) {
    return '';
  }
  let base = unit.toLowerCase().trim();
  base = base
    .replace(/-ounce/g, ' oz')
    .replace(/ounces/g, 'oz')
    .replace(/ounce/g, 'oz')
    .replace(/fl oz/g, 'oz')
    .replace(/fl\. oz/g, 'oz')
    .replace(/\s+/g, ' ');

  if (base.includes('(')) {
    const parts = base.split('(');
    const firstWord = parts[0].trim();
    const rest = parts.slice(1).join('(');
    return `${getSingularUnit(firstWord)} (${rest}`;
  }

  return PLURAL_TO_SINGULAR[base] || base;
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

  return pluralizeWord(unit);
}

/**
 * Assembles a structured ingredient into a human-readable display string.
 */
export function assembleIngredientText(
  ing: IngredientInput,
  disablePluralization?: boolean,
): string {
  let text = '';

  let displayUnit = ing.unit || '';
  let displayItem = ing.item || '';
  let hasUnit = !!displayUnit;

  if (displayUnit && !disablePluralization) {
    const isSubstring =
      displayItem.toLowerCase().includes(displayUnit.toLowerCase()) ||
      getSingularUnit(displayItem).includes(getSingularUnit(displayUnit));
    if (isSubstring) {
      if (ing.qty !== undefined) {
        displayItem = pluralizeUnit(displayItem, ing.qty);
      }
      displayUnit = '';
      hasUnit = false;
    }
  }

  // 1. Primary Amount
  if (ing.qty !== undefined) {
    text += formatQty(ing.qty);
    if (displayUnit) {
      const unitStr = disablePluralization
        ? displayUnit
        : pluralizeUnit(displayUnit, ing.qty);
      text += ' ' + unitStr;
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
      const altUnitStr = disablePluralization
        ? ing.alt.unit
        : pluralizeUnit(ing.alt.unit, ing.alt.qty ?? 1);
      q += (q ? ' ' : '') + altUnitStr;
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
      if (
        ing.alt.qty !== undefined &&
        !ing.alt.unit &&
        altItemName &&
        !disablePluralization
      ) {
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

  let itemName = displayItem;
  if (ing.qty !== undefined && !hasUnit && !disablePluralization) {
    itemName = pluralizeUnit(displayItem, ing.qty);
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

function isVolumeWeightUnit(unit: string, rule?: ItemRule): boolean {
  const sing = getSingularUnit(unit);
  if (!sing) {
    return false;
  }
  if (sing in UNIT_CONVERSIONS) {
    return true;
  }
  if (rule?.unitEquivalences) {
    const eqKey = Object.keys(rule.unitEquivalences).find(
      (k) => getSingularUnit(k) === sing,
    );
    if (eqKey) {
      const eq = rule.unitEquivalences[eqKey];
      if (eq && getSingularUnit(eq.base) in UNIT_CONVERSIONS) {
        return true;
      }
    }
  }
  return false;
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

  const fromVolWt = isVolumeWeightUnit(fromSing, rule);
  const toVolWt = isVolumeWeightUnit(toSing, rule);

  // Check item-specific equivalences first
  if (rule?.unitEquivalences) {
    const fromEqKey = Object.keys(rule.unitEquivalences).find(
      (k) => getSingularUnit(k) === fromSing,
    );
    const toEqKey = Object.keys(rule.unitEquivalences).find(
      (k) => getSingularUnit(k) === toSing,
    );
    const fromEq = fromEqKey ? rule.unitEquivalences[fromEqKey] : undefined;
    const toEq = toEqKey ? rule.unitEquivalences[toEqKey] : undefined;

    // Case A: Both units are defined in equivalences
    if (fromEq && toEq) {
      // e.g. "can (15 oz)" -> "ounce" and "can (28 oz)" -> "ounce"
      // If they share the same base, we can convert.
      if (getSingularUnit(fromEq.base) === getSingularUnit(toEq.base)) {
        return fromEq.factor / toEq.factor;
      }
    }

    // Case B: fromUnit is in equivalences, toUnit is universal
    if (fromEq) {
      // Convert fromUnit -> base, then base -> toUnit
      const baseFactor = getConversionFactor(fromEq.base, toSing, rule);
      if (baseFactor > 0) {
        return fromEq.factor * baseFactor;
      }
    }

    // Case C: toUnit is in equivalences, fromUnit is universal
    if (toEq) {
      const baseFactor = getConversionFactor(fromSing, toEq.base, rule);
      if (baseFactor > 0) {
        return baseFactor / toEq.factor;
      }
    }
  }

  if (!fromVolWt && !toVolWt) {
    // Both are countable and no custom equivalence overrides it
    return 1;
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

export function isVolumeUnit(unit: string): boolean {
  const sing = getSingularUnit(unit);
  return sing in UNIT_CONVERSIONS && UNIT_CONVERSIONS[sing].system === 'volume';
}

export function isWeightUnit(unit: string): boolean {
  const sing = getSingularUnit(unit);
  return sing in UNIT_CONVERSIONS && UNIT_CONVERSIONS[sing].system === 'weight';
}

export function formatQtyValueWithUnit(qty: QtyValue, unit: string): string {
  const minVal = Array.isArray(qty) ? qty[0] : qty;
  const maxVal = Array.isArray(qty) ? qty[1] : qty;
  const singular = getSingularUnit(unit);
  let displayUnit = singular;
  if (singular === 'tablespoon') {
    displayUnit = 'tbsp';
  } else if (singular === 'teaspoon') {
    displayUnit = 'tsp';
  } else if (singular === 'oz' || singular === 'ounce') {
    displayUnit = 'oz';
  } else if (singular) {
    displayUnit = pluralizeUnit(singular, maxVal);
  }

  if (Array.isArray(qty)) {
    const minStr = formatCookingNumber(minVal);
    const maxStr = formatCookingNumber(maxVal);
    return `${minStr}-${maxStr} ${displayUnit}`.replace(/\s+/g, ' ').trim();
  } else {
    const qtyStr = formatCookingNumber(qty);
    return `${qtyStr} ${displayUnit}`.replace(/\s+/g, ' ').trim();
  }
}
