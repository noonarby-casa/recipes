import { IngredientInput, QtyValue } from './types';
import { SINGULAR_TO_PLURAL } from '../constants';

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

export function validateIngredient(ing: IngredientInput): ValidationError[] {
  const errors: ValidationError[] = [];

  // Q2. Required item and string fields checks
  errors.push(...validateStringField(ing.item, 'item', true));
  errors.push(...validateStringField(ing.desc, 'desc', false));
  errors.push(...validateStringField(ing.prep, 'prep', false));

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
      }
    }

    // Q3. Redundancy check: check if ALL defined fields in alt match main ingredient
    if (hasAtLeastOneField) {
      let isDifferent = false;
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
  }

  return errors;
}
