import {
  getSingularUnit,
  isVolumeUnit,
  getPackExplanation,
  convertVolume,
  shouldSkipIngredient,
} from "./utils";
import { convertIngredient } from "./converters";
import { TO_TEASPOONS } from "./config";
import { getAdaptiveUnit } from "../units";
import { getIngredientKey, getShoppingItemKey, findRule } from "./rules";
import { scaleTextQuantities, parseIngredient } from "../scaler";
import { getStoreSection } from "./store-sections";
import {
  Ingredient,
  ShoppingItem,
  NoteItem,
  ProcessedShoppingList,
} from "./types";

const TO_OUNCES: Record<string, number> = {
  ounce: 1,
  oz: 1,
  ounces: 1,
  pound: 16,
  lb: 16,
  lbs: 16,
  pounds: 16,
  gram: 0.03527396,
  g: 0.03527396,
  grams: 0.03527396,
};

function isWeightUnit(unit: string): boolean {
  if (!unit) return false;
  const singular = getSingularUnit(unit);
  return ["ounce", "oz", "pound", "lb", "gram", "g"].includes(singular);
}

function convertWeight(qty: number, fromUnit: string, toUnit: string): number {
  const fromSing = getSingularUnit(fromUnit);
  const toSing = getSingularUnit(toUnit);

  const fromFactor = TO_OUNCES[fromSing];
  const toFactor = TO_OUNCES[toSing];

  if (fromFactor && toFactor) {
    return qty * (fromFactor / toFactor);
  }
  return qty;
}

/**
 * Runs the complete processing pipeline on the recipe ingredients. Merges inputs,
 * converts units, aggregates package duplicates, and splits results into buy list, optional list, and staples list.
 */
export function processShoppingList(
  ingredients: Ingredient[],
): ProcessedShoppingList {
  const aggregatedIngredients = getAggregatedIngredients(ingredients);
  const shoppingItems = aggregatedIngredients.map((item) =>
    convertIngredient(item),
  );
  const mergedShoppingItems = getMergedShoppingItems(shoppingItems);
  const finalizedItems = mergedShoppingItems.map(finalizeItem);

  const sortedItems = sortShoppingItemsByStoreSection(finalizedItems);

  const stapleItems = sortedItems.filter((item) => item.isStaple);
  const buyItems = sortedItems.filter(
    (item) => !item.isStaple && !item.optional,
  );
  const optionalItems = sortedItems.filter(
    (item) => !item.isStaple && item.optional,
  );

  return { buyItems, optionalItems, stapleItems };
}

/**
 * Extracts raw ingredients from DOM element attributes or text content, cleans preparation
 * terms, scales their amounts, and returns structured Ingredient objects.
 */
export function extractIngredientsFromDOM(
  scale: number,
  elements: NodeListOf<HTMLElement> | HTMLElement[],
): Ingredient[] {
  scale = Number.isFinite(scale) ? scale : 1.0;
  const list: Ingredient[] = [];

  elements.forEach((el) => {
    const rawText = (el.textContent || "").trim();
    if (shouldSkipIngredient(rawText)) {
      return;
    }

    const baseQty = el.dataset.baseQty ? parseFloat(el.dataset.baseQty) : null;
    const rawRest = el.dataset.rest || "";
    const overrideItem = el.dataset.item || "";
    const overrideOptional = el.dataset.optional === "true";
    const sizeNote = el.dataset.sizeNote || undefined;

    const parsed = parseIngredient(
      rawRest || rawText,
      null,
      overrideItem,
      overrideOptional,
    );
    if (baseQty !== null && !isNaN(baseQty)) {
      parsed.quantity = baseQty * scale;
      // Also scale secondarySegments
      parsed.secondarySegments = parsed.secondarySegments.map((seg) => ({
        ...seg,
        quantity: seg.quantity * scale,
      }));
    }

    parsed.rest = scaleTextQuantities(parsed.rest, scale);
    if (sizeNote) {
      parsed.sizeNote = sizeNote;
    }

    list.push(parsed);
  });

  return list;
}

/**
 * Legacy wrapper function for backward compatibility.
 */
export function getIngredients(
  scale: number,
  elements: NodeListOf<HTMLElement> | HTMLElement[],
): Ingredient[] {
  return extractIngredientsFromDOM(scale, elements);
}

/**
 * Deduplicates and aggregates ingredients by their cleaned names and units.
 */
export function getAggregatedIngredients(
  ingredients: Ingredient[],
): Ingredient[] {
  const parsedMap = new Map<string, Ingredient>();
  const unquantified: Ingredient[] = [];

  ingredients.forEach((item) => {
    if (item.quantity === null) {
      unquantified.push(item);
      return;
    }

    // Use item field as primary key, fallback to rest
    const key = getIngredientKey(item.unit, item.item || item.rest, item.prep);
    const existing = parsedMap.get(key);
    if (existing) {
      existing.quantity = (existing.quantity ?? 0) + item.quantity;
      existing.prep = item.prep || existing.prep;

      // Merge secondary segments
      item.secondarySegments.forEach((seg) => {
        const match = existing.secondarySegments.find(
          (s) => s.unit === seg.unit,
        );
        if (match) {
          match.quantity += seg.quantity;
        } else {
          existing.secondarySegments.push({ ...seg });
        }
      });
    } else {
      parsedMap.set(key, {
        ...item,
        secondarySegments: item.secondarySegments.map((s) => ({ ...s })),
      });
    }
  });

  return [...parsedMap.values(), ...unquantified];
}

/**
 * Deduplicates and aggregates converted shopping items by their package keys,
 * merging quantities and notes for duplicates, with weight normalization.
 */
export function getMergedShoppingItems(items: ShoppingItem[]): ShoppingItem[] {
  // Normalize weight units to oz (ounces) before merging to allow cross-unit merging
  const normalizedItems = items.map((item) => {
    if (item.qty !== null && item.unit && isWeightUnit(item.unit)) {
      const convertedQty = convertWeight(item.qty, item.unit, "oz");
      const normalizedNotes: Record<string, NoteItem[]> = {};
      for (const [key, notesArr] of Object.entries(item.notes)) {
        normalizedNotes[key] = notesArr.map((n) => {
          if (n.qty !== null && n.unit && isWeightUnit(n.unit)) {
            return {
              ...n,
              qty: convertWeight(n.qty, n.unit, "oz"),
              unit: "oz",
            };
          }
          return n;
        });
      }
      return {
        ...item,
        qty: convertedQty,
        unit: "oz",
        notes: normalizedNotes,
      };
    }
    return item;
  });

  const mergedMap = new Map<string, ShoppingItem>();

  normalizedItems.forEach((item) => {
    // Descriptor Collisions: Use item field as primary merge key
    const key = getShoppingItemKey(item.unit, item.item || item.rest);

    const existing = mergedMap.get(key);
    if (existing) {
      mergedMap.set(key, mergeShoppingItems(existing, item));
    } else {
      mergedMap.set(key, item);
    }
  });

  return [...mergedMap.values()];
}

/**
 * Combines two converted commercial package items of matching types, aggregating quantities,
 * correcting pluralized units, and merging explanation notes.
 */
export function mergeShoppingItems(
  item1: ShoppingItem,
  item2: ShoppingItem,
): ShoppingItem {
  let qty: number | null;
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
    qty =
      item1.qty !== null || item2.qty !== null
        ? (item1.qty ?? 0) + (item2.qty ?? 0)
        : null;
  }

  const unit = getAdaptiveUnit(qty, item1.unit);
  let rest = item1.rest;
  if (unit === "") {
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
    note: [],
    isStaple,
    parts,
    optional: item1.optional || item2.optional,
    item: item1.item || item2.item,
  };
}

/**
 * Finalizes a shopping item by re-evaluating staple status, flattening notes,
 * converting weights back to lb if >= 16 oz, and assigning store section.
 */
function finalizeItem(item: ShoppingItem): ShoppingItem {
  // 1. Re-evaluate staple status using rules
  let isStaple = item.isStaple;
  const rule = findRule(item.item || item.rest, "", item.unit);
  if (rule && typeof rule.isStaple === "function") {
    isStaple = rule.isStaple(item.qty, item.unit);
  }

  // 2. Flatten notes
  const note = Object.values(item.notes).flatMap(normalizeNotesGroup);

  let finalQty = item.qty;
  let finalUnit = item.unit;

  // Weight normalization: if unit is oz and qty >= 16, convert to lb
  if (finalUnit === "oz" && finalQty !== null && finalQty >= 16) {
    finalQty = finalQty / 16;
    finalUnit = getAdaptiveUnit(finalQty, "lb");
  }

  // 3. Assign store section
  const section = getStoreSection(item.rest, item.item);

  return {
    qty: finalQty,
    unit: finalUnit,
    rest: item.rest,
    notes: item.notes,
    note,
    isStaple,
    parts: item.parts,
    optional: item.optional,
    item: item.item,
    section: section.id,
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
  const sameUnit = items.every(
    (it) => getSingularUnit(it.unit) === firstSingular,
  );
  const allVolume = items.every(
    (it) => it.unit && isVolumeUnit(it.unit) && it.qty !== null,
  );

  if (sameUnit || allVolume) {
    const targetSingular =
      !sameUnit && allVolume
        ? items.reduce((minUnit, it) => {
            const sing = getSingularUnit(it.unit);
            return (TO_TEASPOONS[sing] || 999999) <
              (TO_TEASPOONS[minUnit] || 999999)
              ? sing
              : minUnit;
          }, firstSingular)
        : firstSingular;

    const totalQty = items.reduce((sum, it) => {
      if (it.qty === null) return sum;
      return (
        sum +
        (sameUnit ? it.qty : convertVolume(it.qty, it.unit, targetSingular))
      );
    }, 0);

    let explanation = "";
    const foundExp = items.find((it) => it.explanation);
    if (foundExp && foundExp.explanation) {
      const match = foundExp.explanation.match(/^1\s+(\w+)\b/);
      const packUnit = match ? match[1] : "";
      explanation =
        getPackExplanation(packUnit, targetSingular) || foundExp.explanation;
    }

    return [
      {
        prefix: "",
        qty: totalQty,
        unit: getAdaptiveUnit(totalQty, targetSingular),
        rest: items[0].rest,
        explanation,
      },
    ];
  }

  return items;
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
 * Sorts shopping items by the order of their store section.
 */
function sortShoppingItemsByStoreSection(
  items: ShoppingItem[],
): ShoppingItem[] {
  return [...items].sort((a, b) => {
    const secA = getStoreSection(a.rest, a.item);
    const secB = getStoreSection(b.rest, b.item);
    if (secA.order !== secB.order) {
      return secA.order - secB.order;
    }
    return (a.item || a.rest).localeCompare(b.item || b.rest);
  });
}
