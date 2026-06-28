import { cleanPrepTerms, getSingularUnit, parseNoteToArray, abbreviateNote, isVolumeUnit, getPackExplanation, convertVolume, NoteItem, shouldSkipIngredient, Ingredient, ScalableIngredient, formatNotesArray } from './utils';
import { convertIngredient, ShoppingItem } from './converters';
import { TO_TEASPOONS } from './config';
import { getAdaptiveUnit } from '../scaler';
import { getIngredientKey, getShoppingItemKey, findRule } from './rules';

/**
 * Extracts raw ingredients from DOM element attributes or text content, cleans preparation
 * terms, scales their amounts, and aggregates items with matching name/unit.
 */
export function getIngredients(
  scale: number,
  elements: NodeListOf<HTMLElement> | HTMLElement[]
): Ingredient[] {
  const parsedMap = new Map<string, ScalableIngredient>();
  const unquantified: Ingredient[] = [];

  scale = Number.isFinite(scale) ? scale : 1.0;

  elements.forEach(el => {
    const rawText = (el.textContent || '').trim();

    if (shouldSkipIngredient(rawText)) {
      return; // skip completely
    }

    const baseQty = el.dataset.baseQty ? parseFloat(el.dataset.baseQty) : null;
    const unit = el.dataset.unit || '';
    const rawRest = el.dataset.rest || '';

    const { rest, prep } = cleanPrepTerms(rawRest || rawText);

    if (baseQty === null || isNaN(baseQty)) {
      unquantified.push({
        isScalable: false,
        rest,
        prep
      });
      return;
    }

    const key = getIngredientKey(unit, rest, prep);
    const scaledQty = baseQty * scale;

    const item = parsedMap.get(key);
    if (item) {
      item.scaledQty += scaledQty;
      item.prep = prep || item.prep;
    } else {
      parsedMap.set(key, { isScalable: true, scaledQty, unit, rest, prep });
    }
  });

  return [...parsedMap.values(), ...unquantified];
}

/**
 * Calculates the quantity of a shopping item that is not used for parts.
 */
function getWholeQty(item: ShoppingItem): number {
  const parts = Object.values(item.parts || {});
  const maxPart = Math.max(...parts, 0);
  return Math.max(0, (item.qty ?? 0) - maxPart);
}

/**
 * Combines two converted commercial package items of matching types, aggregating quantities,
 * correcting pluralized units, and merging explanation notes.
 */
export function mergeShoppingItems(item1: ShoppingItem, item2: ShoppingItem): ShoppingItem {
  let qty: number | null = null;
  let parts: { [key: string]: number } | undefined = undefined;

  if (item1.parts || item2.parts) {
    parts = {};
    for (const [key, val] of Object.entries(item1.parts || {})) {
      parts[key] = (parts[key] ?? 0) + val;
    }
    for (const [key, val] of Object.entries(item2.parts || {})) {
      parts[key] = (parts[key] ?? 0) + val;
    }

    const whole1 = getWholeQty(item1);
    const whole2 = getWholeQty(item2);
    const maxFromParts = Math.max(...Object.values(parts), 0);
    qty = maxFromParts + whole1 + whole2;
  } else {
    qty = (item1.qty !== null || item2.qty !== null)
      ? (item1.qty ?? 0) + (item2.qty ?? 0)
      : null;
  }

  let unit = getAdaptiveUnit(qty, item1.unit);
  let rest = item1.rest;
  if (unit === '') {
    rest = getAdaptiveUnit(qty, rest);
  }

  const notes: Record<string, NoteItem[]> = { ...(item1.notes || {}) };
  for (const [key, arr2] of Object.entries(item2.notes || {})) {
    notes[key] = [...(notes[key] || []), ...arr2];
  }

  const isStaple = item1.isStaple && item2.isStaple;

  return {
    qty,
    unit,
    rest,
    notes,
    isStaple,
    parts
  };
}

/**
 * Normalizes and aggregates note items of the same sub-ingredient/purpose,
 * converting units to the smallest compatible unit.
 */
function normalizeNotesGroup(items: NoteItem[]): NoteItem[] {
  if (items.length === 0) return [];
  if (items.length === 1) return [items[0]];

  const firstSingular = getSingularUnit(items[0].unit);
  const sameUnit = items.every(it => getSingularUnit(it.unit) === firstSingular);
  const allVolume = items.every(it => it.unit && isVolumeUnit(it.unit) && it.qty !== null);

  if (sameUnit || allVolume) {
    let targetSingular = firstSingular;
    if (!sameUnit && allVolume) {
      items.forEach(it => {
        const sing = getSingularUnit(it.unit);
        if ((TO_TEASPOONS[sing] || 999999) < (TO_TEASPOONS[targetSingular] || 999999)) {
          targetSingular = sing;
        }
      });
    }

    let totalQty = 0;
    items.forEach(it => {
      if (it.qty !== null) {
        totalQty += sameUnit ? it.qty : convertVolume(it.qty, it.unit, targetSingular);
      }
    });

    let explanation = '';
    const foundExp = items.find(it => it.explanation);
    if (foundExp && foundExp.explanation) {
      const match = foundExp.explanation.match(/^1\s+(\w+)\b/);
      const packUnit = match ? match[1] : '';
      explanation = getPackExplanation(packUnit, targetSingular) || foundExp.explanation;
    }

    return [{
      prefix: '',
      qty: totalQty,
      unit: getAdaptiveUnit(totalQty, targetSingular),
      rest: items[0].rest,
      explanation
    }];
  }

  return items;
}

/**
 * Finalizes a shopping item by re-evaluating staple status and flattening notes for rendering.
 */
function finalizeItem(item: ShoppingItem): ShoppingItem {
  // 1. Re-evaluate staple status using rules
  let isStaple = item.isStaple;
  const rule = findRule(item.rest);
  if (rule && typeof rule.isStaple === 'function') {
    isStaple = rule.isStaple(item.qty, item.unit);
  }

  // 2. Flatten notes
  const note: NoteItem[] = [];
  if (item.notes) {
    for (const notesArray of Object.values(item.notes)) {
      note.push(...normalizeNotesGroup(notesArray));
    }
  }

  return {
    qty: item.qty,
    unit: item.unit,
    rest: item.rest,
    note,
    isStaple,
    parts: item.parts
  };
}

/**
 * Deduplicates and aggregates converted shopping items by their package keys,
 * merging quantities and notes for duplicates.
 */
export function getMergedShoppingItems(items: ShoppingItem[]): ShoppingItem[] {
  const mergedMap = new Map<string, ShoppingItem>();

  items.forEach(item => {
    const key = getShoppingItemKey(item.unit, item.rest);

    const existing = mergedMap.get(key);
    if (existing) {
      mergedMap.set(key, mergeShoppingItems(existing, item));
    } else {
      mergedMap.set(key, item);
    }
  });

  return [...mergedMap.values()];
}

export interface ProcessedShoppingList {
  buyItems: ShoppingItem[];
  stapleItems: ShoppingItem[];
}

/**
 * Runs the complete processing pipeline on the recipe ingredients. Merges inputs,
 * converts units, aggregates package duplicates, and splits results into buy list and staple list.
 */
export function processShoppingList(
  scale: number,
  elements: NodeListOf<HTMLElement> | HTMLElement[]
): ProcessedShoppingList {
  const ingredients = getIngredients(scale, elements);
  const shoppingItems = ingredients.map(item => convertIngredient(item));
  const mergedShoppingItems = getMergedShoppingItems(shoppingItems);
  const finalizedItems = mergedShoppingItems.map(finalizeItem);

  const stapleItems = finalizedItems.filter(item => item.isStaple);
  const buyItems = finalizedItems.filter(item => !item.isStaple);

  return { buyItems, stapleItems };
}
