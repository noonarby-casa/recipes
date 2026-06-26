import { cleanPrepTerms, getSingularUnit, parseNoteToArray, abbreviateNote, isVolumeUnit, getPluralizedUnit, getButterExplanation, convertVolume, NoteItem, shouldSkipIngredient, Ingredient, ScalableIngredient, getIngredientKey, getShoppingItemKey, formatNotesArray } from './utils';
import { convertIngredient, ShoppingItem } from './converters';
import { TO_TEASPOONS } from './config';

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
 * Combines two converted commercial package items of matching types, aggregating quantities,
 * correcting pluralized units, and merging explanation notes.
 */
export function mergeShoppingItems(item1: ShoppingItem, item2: ShoppingItem): ShoppingItem {
  let qty: number | null = null;
  let parts: { [key: string]: number | undefined } | undefined = undefined;

  if (item1.parts || item2.parts) {
    parts = {};
    const keys = new Set([
      ...Object.keys(item1.parts || {}),
      ...Object.keys(item2.parts || {})
    ]);
    for (const key of keys) {
      const q1 = item1.parts?.[key] ?? 0;
      const q2 = item2.parts?.[key] ?? 0;
      parts[key] = q1 + q2;
    }

    const maxParts1 = item1.parts && Object.keys(item1.parts).length > 0
      ? Math.max(...Object.values(item1.parts).map(v => v ?? 0))
      : 0;
    const diff1 = Math.max(0, (item1.qty ?? 0) - maxParts1);

    const maxParts2 = item2.parts && Object.keys(item2.parts).length > 0
      ? Math.max(...Object.values(item2.parts).map(v => v ?? 0))
      : 0;
    const diff2 = Math.max(0, (item2.qty ?? 0) - maxParts2);

    const totalDiff = diff1 + diff2;
    const maxMergedParts = Object.keys(parts).length > 0
      ? Math.max(...Object.values(parts).map(v => v ?? 0))
      : 0;
    qty = maxMergedParts + totalDiff;
  } else {
    if (item1.qty !== null && item2.qty !== null) {
      qty = item1.qty + item2.qty;
    } else if (item1.qty !== null) {
      qty = item1.qty;
    } else if (item2.qty !== null) {
      qty = item2.qty;
    }
  }

  let unit = item1.unit;
  if (qty !== null && qty > 1) {
    unit = getPluralizedUnit(unit);
  } else if (qty !== null && qty <= 1) {
    unit = getSingularUnit(unit);
  }

  const isItem1Lemon = item1.rest.toLowerCase().includes('lemon') || item1.unit.toLowerCase().includes('lemon');
  const isItem2Lemon = item2.rest.toLowerCase().includes('lemon') || item2.unit.toLowerCase().includes('lemon');
  const isItem1Lime = item1.rest.toLowerCase().includes('lime') || item1.unit.toLowerCase().includes('lime');
  const isItem2Lime = item2.rest.toLowerCase().includes('lime') || item2.unit.toLowerCase().includes('lime');

  let rest = item1.rest;
  if (isItem1Lemon && isItem2Lemon) {
    if (item1.rest !== item2.rest) {
      rest = item1.rest === 'for juice' ? item2.rest : item1.rest;
      unit = '';
    }
  } else if (isItem1Lime && isItem2Lime) {
    if (item1.rest !== item2.rest) {
      rest = item1.rest === 'for juice' ? item2.rest : item1.rest;
      unit = '';
    }
  }

  if (unit === '') {
    if (qty !== null && qty > 1) {
      rest = rest.replace(/\blemon\b/gi, 'lemons').replace(/\blime\b/gi, 'limes');
    } else if (qty !== null) {
      rest = rest.replace(/\blemons\b/gi, 'lemon').replace(/\blimes\b/gi, 'lime');
    }
  }

  let note: NoteItem[] = [];
  if (item1.note.length && item2.note.length) {
    note = mergeNotesArrays(item1.note, item2.note);
  } else {
    note = [...item1.note, ...item2.note];
  }

  let isStaple = item1.isStaple && item2.isStaple;
  if (rest.toLowerCase() === 'butter' && (unit === 'stick' || unit === 'sticks')) {
    isStaple = qty !== null && qty < 4;
  }

  return {
    qty,
    unit,
    rest,
    note,
    isStaple,
    parts
  };
}

/**
 * Combines note collections by grouping matching text tags, normalizing units to the smallest unit,
 * and aggregating numeric values.
 */
function mergeNotesArrays(arr1: NoteItem[], arr2: NoteItem[]): NoteItem[] {
  const merged: NoteItem[] = [];
  const temp = [...arr1, ...arr2];

  const groups = new Map<string, NoteItem[]>();
  temp.forEach(item => {
    const key = `${item.rest.trim()}`;
    const existing = groups.get(key);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(key, [item]);
    }
  });

  for (const [key, items] of groups.entries()) {
    if (items.length === 1) {
      merged.push(items[0]);
    } else {
      const firstUnit = getSingularUnit(items[0].unit);
      const sameUnit = items.every(it => getSingularUnit(it.unit) === firstUnit);
      const allVolume = items.every(it => it.unit && isVolumeUnit(it.unit) && it.qty !== null);

      if (sameUnit) {
        let totalQty = 0;
        items.forEach(it => {
          if (it.qty !== null) totalQty += it.qty;
        });

        let explanation = '';
        const isButter = items.some(it => it.explanation && (it.explanation.includes('stick') || it.explanation.includes('lb')));
        if (isButter) {
          explanation = getButterExplanation(firstUnit);
        } else {
          const found = items.find(it => it.explanation);
          if (found) explanation = found.explanation;
        }

        merged.push({
          prefix: '',
          qty: totalQty,
          unit: totalQty > 1 ? getPluralizedUnit(firstUnit) : firstUnit,
          rest: items[0].rest,
          explanation: explanation
        });
      } else if (allVolume) {
        let smallestUnit = items[0].unit;
        let smallestFactor = TO_TEASPOONS[getSingularUnit(smallestUnit)] || 999999;

        items.forEach(it => {
          const sing = getSingularUnit(it.unit);
          const factor = TO_TEASPOONS[sing] || 999999;
          if (factor < smallestFactor) {
            smallestFactor = factor;
            smallestUnit = it.unit;
          }
        });

        const targetSingular = getSingularUnit(smallestUnit);
        let totalQty = 0;
        items.forEach(it => {
          if (it.qty !== null) {
            totalQty += convertVolume(it.qty, it.unit, targetSingular);
          }
        });

        let explanation = '';
        const isButter = items.some(it => it.explanation && (it.explanation.includes('stick') || it.explanation.includes('lb')));
        if (isButter) {
          explanation = getButterExplanation(targetSingular);
        } else {
          const found = items.find(it => it.explanation);
          if (found) explanation = found.explanation;
        }

        merged.push({
          prefix: '',
          qty: totalQty,
          unit: totalQty > 1 ? getPluralizedUnit(targetSingular) : targetSingular,
          rest: items[0].rest,
          explanation: explanation
        });
      } else {
        items.forEach(it => merged.push(it));
      }
    }
  }

  return merged;
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

  const stapleItems = mergedShoppingItems.filter(item => item.isStaple);
  const buyItems = mergedShoppingItems.filter(item => !item.isStaple);

  return { buyItems, stapleItems };
}
