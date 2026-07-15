import { IngredientInput, QtyValue } from './types';
import { SINGULAR_TO_PLURAL } from '../constants';
import { getSingularUnit } from './utils';
import { ITEM_RULES } from './rules';

export interface ValidationError {
  message: string;
  field?: string;
  severity: 'error' | 'warning';
}

const PLURAL_UNITS_SET = new Set(
  Object.entries(SINGULAR_TO_PLURAL)
    .filter(([singular, plural]) => singular !== plural)
    .map(([_, plural]) => plural),
);

function isQtyEqual(
  q1: QtyValue | undefined,
  q2: QtyValue | undefined,
): boolean {
  if (q1 === undefined || q2 === undefined) {
    return q1 === q2;
  }
  if (Array.isArray(q1) && Array.isArray(q2)) {
    return q1[0] === q2[0] && q1[1] === q2[1];
  }
  if (!Array.isArray(q1) && !Array.isArray(q2)) {
    return q1 === q2;
  }
  return false;
}

function validateQuantity(
  qty: QtyValue | undefined,
  fieldName: string,
): ValidationError[] {
  const errors: ValidationError[] = [];
  if (qty === undefined) {
    return errors;
  }

  if (Array.isArray(qty)) {
    if (qty.length !== 2) {
      errors.push({
        message: `${fieldName} range must contain exactly 2 numbers.`,
        field: fieldName,
        severity: 'error',
      });
      return errors;
    }
    const [min, max] = qty;
    if (
      typeof min !== 'number' ||
      typeof max !== 'number' ||
      isNaN(min) ||
      isNaN(max)
    ) {
      errors.push({
        message: `${fieldName} range bounds must be valid numbers.`,
        field: fieldName,
        severity: 'error',
      });
      return errors;
    }
    if (min <= 0 || max <= 0) {
      errors.push({
        message: `${fieldName} range bounds must be strictly greater than 0.`,
        field: fieldName,
        severity: 'error',
      });
    }
    if (min >= max) {
      errors.push({
        message: `${fieldName} range min (${min}) must be strictly less than max (${max}).`,
        field: fieldName,
        severity: 'error',
      });
    }
  } else {
    if (typeof qty !== 'number' || isNaN(qty)) {
      errors.push({
        message: `${fieldName} must be a valid number.`,
        field: fieldName,
        severity: 'error',
      });
      return errors;
    }
    if (qty <= 0) {
      errors.push({
        message: `${fieldName} must be strictly greater than 0.`,
        field: fieldName,
        severity: 'error',
      });
    }
  }
  return errors;
}

function validateStringField(
  val: string | undefined,
  fieldName: string,
  required: boolean,
): ValidationError[] {
  const errors: ValidationError[] = [];
  if (val === undefined) {
    if (required) {
      errors.push({
        message: `${fieldName} is a required field.`,
        field: fieldName,
        severity: 'error',
      });
    }
    return errors;
  }

  if (typeof val !== 'string') {
    errors.push({
      message: `${fieldName} must be a string.`,
      field: fieldName,
      severity: 'error',
    });
    return errors;
  }

  const trimmed = val.trim();
  if (trimmed.length === 0) {
    errors.push({
      message: `${fieldName} must not be empty or whitespace-only.`,
      field: fieldName,
      severity: 'error',
    });
  }

  if (/\babout\b/i.test(trimmed)) {
    errors.push({
      message: `${fieldName} must not contain the word "about". If specifying an approximate amount, use the alt block (alt.qty and alt.unit) instead.`,
      field: fieldName,
      severity: 'error',
    });
  }
  return errors;
}

function validateUnitField(
  unit: string | undefined,
  fieldName: string,
): ValidationError[] {
  const errors: ValidationError[] = [];
  if (unit === undefined) {
    return errors;
  }

  const stringErrors = validateStringField(unit, fieldName, false);
  if (stringErrors.length > 0) {
    return stringErrors;
  }

  if (unit !== unit.toLowerCase()) {
    errors.push({
      message: `${fieldName} "${unit}" must be entirely lowercase.`,
      field: fieldName,
      severity: 'error',
    });
  }

  if (PLURAL_UNITS_SET.has(unit.toLowerCase().trim())) {
    errors.push({
      message: `${fieldName} "${unit}" is plural. Prefer standard singular form (e.g., "cup" instead of "cups").`,
      field: fieldName,
      severity: 'warning',
    });
  }

  return errors;
}

function getCanonicalName(itemName: string): string {
  const lower = itemName.toLowerCase().trim();
  const rule = ITEM_RULES.find((r) => r.items.includes(lower));
  return rule && rule.items.length > 0 ? rule.items[0] : lower;
}

export function validateIngredient(ing: IngredientInput): ValidationError[] {
  const errors: ValidationError[] = [];

  // Q2. Required item and string fields checks
  errors.push(...validateStringField(ing.item, 'item', true));
  errors.push(...validateStringField(ing.desc, 'desc', false));
  errors.push(...validateStringField(ing.prep, 'prep', false));

  // "or" and parentheses are not allowed in item name
  if (ing.item) {
    if (/\bor\b/i.test(ing.item) || /[()]/.test(ing.item)) {
      errors.push({
        message: `Item name "${ing.item}" must not contain "or" or parentheses. Use the alt block (alt.item) to specify alternative items instead.`,
        field: 'item',
        severity: 'error',
      });
    }
  }

  // divided is a prep term, not a desc term
  if (ing.desc && /\bdivided\b/i.test(ing.desc)) {
    errors.push({
      message:
        '"divided" is a preparation term, not a descriptor. Move it to the prep field.',
      field: 'desc',
      severity: 'error',
    });
  }

  // Q5. Unit checking
  errors.push(...validateUnitField(ing.unit, 'unit'));

  // Q4. Quantity checking
  errors.push(...validateQuantity(ing.qty, 'qty'));

  if (ing.alt !== undefined) {
    const alt = ing.alt;
    if (typeof alt !== 'object' || alt === null) {
      errors.push({
        message: 'alt must be a valid object.',
        field: 'alt',
        severity: 'error',
      });
      return errors;
    }

    // Q3. Non-empty alt check
    const altKeys = Object.keys(alt) as (keyof typeof alt)[];
    const hasAtLeastOneField = altKeys.some((k) => alt[k] !== undefined);
    if (!hasAtLeastOneField) {
      errors.push({
        message: 'alt block must contain at least one field (cannot be empty).',
        field: 'alt',
        severity: 'error',
      });
    }

    // Validate alt fields
    errors.push(...validateStringField(alt.item, 'alt.item', false));
    errors.push(...validateStringField(alt.desc, 'alt.desc', false));
    errors.push(...validateStringField(alt.prep, 'alt.prep', false));
    errors.push(...validateUnitField(alt.unit, 'alt.unit'));
    errors.push(...validateQuantity(alt.qty, 'alt.qty'));

    // "or" and parentheses are not allowed in alt.item name
    if (alt.item) {
      if (/\bor\b/i.test(alt.item) || /[()]/.test(alt.item)) {
        errors.push({
          message: `Alternative item name "${alt.item}" must not contain "or" or parentheses.`,
          field: 'alt.item',
          severity: 'error',
        });
      }
    }

    // divided is a prep term, not a desc term (in alt)
    if (alt.desc && /\bdivided\b/i.test(alt.desc)) {
      errors.push({
        message:
          '"divided" is a preparation term, not a descriptor. Move it to the prep field.',
        field: 'alt.desc',
        severity: 'error',
      });
    }

    // Q1. Uniqueness of item and alt.item
    if (ing.item !== undefined && alt.item !== undefined) {
      const mainItemNormalized = ing.item.toLowerCase().trim();
      const altItemNormalized = alt.item.toLowerCase().trim();
      if (
        mainItemNormalized === altItemNormalized &&
        mainItemNormalized.length > 0
      ) {
        errors.push({
          message: `alt.item "${alt.item}" is identical to main item "${ing.item}". The redundant alt.item can be removed.`,
          field: 'alt.item',
          severity: 'error',
        });
      } else {
        const mainCanonical = getCanonicalName(ing.item);
        const altCanonical = getCanonicalName(alt.item);
        if (mainCanonical === altCanonical) {
          errors.push({
            message: `alt.item "${alt.item}" resolves to the same canonical item "${mainCanonical}" as the main item "${ing.item}".`,
            field: 'alt.item',
            severity: 'error',
          });
        }
      }
    }

    // Q3. Redundancy check: check if ALL defined fields in alt match main ingredient
    let isDifferent = false;
    if (hasAtLeastOneField) {
      if (alt.qty !== undefined && !isQtyEqual(alt.qty, ing.qty)) {
        isDifferent = true;
      }
      if (
        alt.unit !== undefined &&
        alt.unit.toLowerCase().trim() !== (ing.unit || '').toLowerCase().trim()
      ) {
        isDifferent = true;
      }
      if (
        alt.item !== undefined &&
        alt.item.toLowerCase().trim() !== (ing.item || '').toLowerCase().trim()
      ) {
        isDifferent = true;
      }
      if (
        alt.desc !== undefined &&
        alt.desc.toLowerCase().trim() !== (ing.desc || '').toLowerCase().trim()
      ) {
        isDifferent = true;
      }
      if (
        alt.prep !== undefined &&
        alt.prep.toLowerCase().trim() !== (ing.prep || '').toLowerCase().trim()
      ) {
        isDifferent = true;
      }
      if (alt.each !== undefined) {
        isDifferent = true; // Main ingredient doesn't have 'each'
      }

      if (!isDifferent) {
        errors.push({
          message:
            'alt block is completely redundant with the main ingredient properties.',
          field: 'alt',
          severity: 'error',
        });
      }
    }

    // alt unit must not be same as unit, prefer range syntax
    // Only run if not redundant and alt.item is not defined
    if (
      isDifferent &&
      alt.item === undefined &&
      (alt.qty !== undefined || alt.unit !== undefined)
    ) {
      const mainUnitNormalized = getSingularUnit(ing.unit || '');
      const altUnitNormalized = getSingularUnit(alt.unit || '');
      if (mainUnitNormalized === altUnitNormalized) {
        errors.push({
          message: `alt unit must not be same as unit, prefer range syntax.`,
          field: 'alt.unit',
          severity: 'error',
        });
      }
    }
  }

  return errors;
}

export interface IngredientSection {
  category: string;
  items: IngredientInput[];
}

export function validateRecipe(recipe: {
  title: string;
  ingredients: IngredientSection[];
  instructions?: string;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  // Collect all unique ingredient item names (and their alt items) in the recipe
  const allItems = new Set<string>();
  for (const section of recipe.ingredients) {
    for (const ing of section.items) {
      if (ing.item) {
        allItems.add(ing.item.toLowerCase().trim());
      }
      if (ing.alt?.item) {
        allItems.add(ing.alt.item.toLowerCase().trim());
      }
    }
  }

  // 1. Validate each individual ingredient in the recipe
  for (const section of recipe.ingredients) {
    for (const ing of section.items) {
      const ingErrors = validateIngredient(ing);
      for (const err of ingErrors) {
        errors.push({
          ...err,
          message: `In section "${section.category}", ingredient "${ing.item}": ${err.message}`,
        });
      }
    }
  }

  // 2. Check for duplicate items in the same section, suggest combining
  for (const section of recipe.ingredients) {
    const seenItems = new Map<string, string[]>();
    for (const ing of section.items) {
      if (!ing.item) {
        continue;
      }
      const normalized = ing.item.toLowerCase().trim();
      let list = seenItems.get(normalized);
      if (!list) {
        list = [];
        seenItems.set(normalized, list);
      }
      list.push(ing.item);
    }

    for (const [normalized, list] of seenItems.entries()) {
      if (list.length > 1) {
        errors.push({
          message: `Duplicate item "${normalized}" found in section "${section.category}" (items: ${list.map((i) => `"${i}"`).join(', ')}). Suggest combining them.`,
          field: `ingredients.${section.category}`,
          severity: 'error',
        });
      }
    }
  }

  // 3. Instructions should reference each item, otherwise the item is redundant
  if (recipe.instructions && recipe.instructions.trim().length > 0) {
    const instructionsText = recipe.instructions;
    for (const section of recipe.ingredients) {
      for (const ing of section.items) {
        if (!ing.item) {
          continue;
        }

        // Get all other items in the recipe that contain this item name as a substring
        const normalizedItem = ing.item.toLowerCase().trim();
        const longerItems = Array.from(allItems).filter(
          (other) => other !== normalizedItem && other.includes(normalizedItem),
        );

        // Check if main item or alt item is referenced
        let referenced = isItemReferenced(
          ing.item,
          instructionsText,
          longerItems,
        );
        if (!referenced && ing.alt?.item) {
          const normalizedAlt = ing.alt.item.toLowerCase().trim();
          const longerAltItems = Array.from(allItems).filter(
            (other) => other !== normalizedAlt && other.includes(normalizedAlt),
          );
          referenced = isItemReferenced(
            ing.alt.item,
            instructionsText,
            longerAltItems,
          );
        }

        if (!referenced) {
          errors.push({
            message: `Ingredient "${ing.item}" is not referenced in the instructions and may be redundant.`,
            field: 'instructions',
            severity: 'error',
          });
        }
      }
    }
  }

  return errors;
}

function isItemReferenced(
  itemName: string,
  instructionsText: string,
  longerItems: string[],
): boolean {
  let text = instructionsText.toLowerCase();

  // Replace longer items that contain this item name with a placeholder
  // to avoid false substring matches
  for (const longer of longerItems) {
    const escaped = longer.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    text = text.replace(regex, '___');
  }

  const item = itemName.toLowerCase().trim();

  // 1. Direct match of the full item name
  if (text.includes(item)) {
    return true;
  }

  // 2. Singular/plural variations of the full item name
  const variants = new Set<string>();
  variants.add(item);

  // Plurals
  variants.add(item + 's');
  if (item.endsWith('y')) {
    variants.add(item.slice(0, -1) + 'ies');
  }
  if (item.endsWith('o')) {
    variants.add(item + 'es');
  }

  // Singulars
  if (item.endsWith('s')) {
    variants.add(item.slice(0, -1));
  }
  if (item.endsWith('ies')) {
    variants.add(item.slice(0, -3) + 'y');
  }
  if (item.endsWith('oes')) {
    variants.add(item.slice(0, -2));
  }

  for (const variant of variants) {
    if (text.includes(variant)) {
      return true;
    }
  }

  // 3. Check individual significant words
  const words = item.split(/\s+/).filter((w) => w.length > 0);
  const stopWords = new Set([
    'ground',
    'fresh',
    'clove',
    'cloves',
    'powder',
    'zest',
    'juice',
    'extract',
    'oil',
    'sauce',
    'sliced',
    'diced',
    'finely',
    'chopped',
    'whole',
    'large',
    'medium',
    'small',
    'can',
    'canned',
    'paste',
    'dried',
    'crushed',
    'grated',
    'shredded',
    'peeled',
    'toasted',
    'raw',
    'cooked',
    'unsalted',
    'salted',
    'low-sodium',
    'low',
    'sodium',
    'organic',
    'and',
    'or',
    'with',
    'in',
    'of',
  ]);

  const sigWords = words.filter((w) => !stopWords.has(w));
  for (const w of sigWords) {
    if (w.length > 2 && text.includes(w)) {
      return true;
    }
  }

  // 4. Fallback: check the last word of the item name
  if (words.length > 1) {
    const lastWord = words[words.length - 1];
    if (lastWord.length > 2 && text.includes(lastWord)) {
      return true;
    }
  }

  return false;
}
