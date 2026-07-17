import { STAPLE_ITEMS, ITEM_RULES } from './rules';
import {
  convertQty,
  getConversionFactor,
  pluralizeUnit,
  isVolumeUnit,
  isWeightUnit,
  formatQtyValueWithUnit,
} from './utils';
import {
  getSectionForCategory,
  classifyItemToCategory,
  StoreLayout,
} from './store-sections';
import {
  IngredientInput,
  ShoppingItem,
  ProcessedShoppingList,
  ItemRule,
  ShoppingItemNote,
  IngredientNote,
  QtyValue,
} from './types';

function getRuleForItem(itemName: string): ItemRule | undefined {
  const lower = itemName.toLowerCase().trim();
  return ITEM_RULES.find((rule) => rule.items.includes(lower));
}

function isStaple(itemName: string): boolean {
  const lower = itemName.toLowerCase().trim();
  if (STAPLE_ITEMS.has(lower)) {
    return true;
  }
  if (lower.endsWith(' salt') || lower === 'salt') {
    const nonStapleSalts = ['pork', 'cod'];
    if (!nonStapleSalts.some((ns) => lower.includes(ns))) {
      return true;
    }
  }
  if (lower.includes('pepper')) {
    const staplePeppers = [
      'black',
      'white',
      'cayenne',
      'lemon',
      'sichuan',
      'crushed',
      'flake',
      'flakes',
    ];
    if (staplePeppers.some((sp) => lower.includes(sp)) || lower === 'pepper') {
      return true;
    }
  }
  return false;
}

function getItemCanonicalInfo(itemName: string): { key: string; name: string } {
  const lower = itemName.toLowerCase().trim();
  const rule = getRuleForItem(lower);
  if (rule?.canonicalName) {
    return { key: rule.canonicalName.toLowerCase(), name: rule.canonicalName };
  }
  return { key: lower, name: itemName };
}

function determineTargetUnit(units: string[], rule?: ItemRule): string {
  const uniqueUnits = Array.from(
    new Set(units.map((u) => u.trim().toLowerCase())),
  );
  if (
    uniqueUnits.length === 0 ||
    (uniqueUnits.length === 1 && uniqueUnits[0] === '')
  ) {
    return '';
  }

  if (rule?.unitEquivalences) {
    const firstEq = Object.values(rule.unitEquivalences)[0];
    if (firstEq) {
      const canConvertAll = uniqueUnits.every(
        (u) => u === '' || getConversionFactor(u, firstEq.base, rule) > 0,
      );
      if (canConvertAll) {
        return firstEq.base;
      }
    }
  }

  if (uniqueUnits.length === 1) {
    return units[0];
  }

  const hasVolume = uniqueUnits.some(
    (u) => getConversionFactor(u, 'teaspoon') > 0,
  );
  const hasWeight = uniqueUnits.some(
    (u) => getConversionFactor(u, 'ounce') > 0,
  );

  if (hasVolume && !hasWeight) {
    if (uniqueUnits.includes('cup')) {
      return 'cup';
    }
    if (uniqueUnits.includes('tablespoon') || uniqueUnits.includes('tbsp')) {
      return 'tablespoon';
    }
    return 'teaspoon';
  }
  if (hasWeight && !hasVolume) {
    if (uniqueUnits.includes('pound') || uniqueUnits.includes('lb')) {
      return 'pound';
    }
    return 'ounce';
  }
  return units[0];
}

function addQtyValues(
  a: QtyValue | undefined,
  b: QtyValue | undefined,
): QtyValue | undefined {
  if (a === undefined) {
    return b;
  }
  if (b === undefined) {
    return a;
  }
  const aMin = Array.isArray(a) ? a[0] : a;
  const aMax = Array.isArray(a) ? a[1] : a;
  const bMin = Array.isArray(b) ? b[0] : b;
  const bMax = Array.isArray(b) ? b[1] : b;
  if (Array.isArray(a) || Array.isArray(b)) {
    return [aMin + bMin, aMax + bMax];
  }
  return a + b;
}

function convertQtyValue(
  qty: QtyValue,
  fromUnit: string,
  toUnit: string,
  rule?: ItemRule,
): QtyValue {
  if (Array.isArray(qty)) {
    return [
      convertQty(qty[0], fromUnit, toUnit, rule),
      convertQty(qty[1], fromUnit, toUnit, rule),
    ];
  }
  return convertQty(qty, fromUnit, toUnit, rule);
}

/**
 * Runs the complete processing pipeline on the recipe ingredients.
 * Groups by item, converts units to a common base, matches package sizes, and sorts.
 */
export function processShoppingList(
  ingredients: IngredientInput[],
  layout?: StoreLayout,
): ProcessedShoppingList {
  const groupsMap = new Map<
    string,
    {
      key: string;
      name: string;
      ingredients: IngredientInput[];
      optional: boolean;
    }
  >();

  for (const ing of ingredients) {
    const itemName = ing.item.toLowerCase().trim();
    if (itemName === 'water') {
      continue;
    }
    const info = getItemCanonicalInfo(itemName);
    let existing = groupsMap.get(info.key);
    if (!existing) {
      existing = {
        key: info.key,
        name: info.name,
        ingredients: [],
        optional: true,
      };
      groupsMap.set(info.key, existing);
    }
    existing.ingredients.push(ing);
    if (!ing.optional) {
      existing.optional = false;
    }
  }

  const buyItems: ShoppingItem[] = [];
  const optionalItems: ShoppingItem[] = [];
  const stapleItems: ShoppingItem[] = [];

  for (const group of groupsMap.values()) {
    const rule = getRuleForItem(group.key);
    const units = group.ingredients
      .map((ing) => ing.unit || '')
      .filter(Boolean);
    const targetUnit = determineTargetUnit(units, rule);

    let totalQty: QtyValue | undefined = undefined;
    let unquantified = false;
    const ingredientNotes: IngredientNote[] = [];

    for (const ing of group.ingredients) {
      if (ing.recipe || ing.alt?.item || ing.desc) {
        ingredientNotes.push({
          recipe: ing.recipe || undefined,
          altItem: ing.alt?.item || undefined,
          descriptor: ing.desc || undefined,
        });
      }

      if (ing.qty === undefined) {
        if (rule?.defaultQty !== undefined) {
          const unit = ing.unit || '';
          let converted: QtyValue = rule.defaultQty;
          if (unit !== targetUnit) {
            converted = convertQtyValue(
              rule.defaultQty,
              unit,
              targetUnit,
              rule,
            );
          }
          totalQty = addQtyValues(totalQty, converted);
        } else {
          unquantified = true;
        }
      } else {
        const unit = ing.unit || '';
        let converted: QtyValue;
        if (unit === targetUnit) {
          converted = ing.qty;
        } else {
          converted = convertQtyValue(ing.qty, unit, targetUnit, rule);
        }
        totalQty = addQtyValues(totalQty, converted);
      }
    }

    let finalQty: number | null =
      unquantified || totalQty === undefined
        ? null
        : Array.isArray(totalQty)
          ? totalQty[1]
          : totalQty;
    let finalUnit = targetUnit;
    let sizeNote: string | undefined = undefined;

    const canonicalName = rule?.canonicalName || group.name;
    const sizeLookupKey =
      rule && rule.items.length > 0 ? rule.items[0] : canonicalName;
    const itemSizes =
      layout?.itemSizes?.[sizeLookupKey.toLowerCase()] ||
      layout?.itemSizes?.[group.key];

    let matched = false;
    const originalQty = totalQty;
    const originalUnit = targetUnit;

    if (finalQty !== null && itemSizes && itemSizes.length > 0) {
      for (const [limit, sizeUnit] of itemSizes) {
        const factor = getConversionFactor(sizeUnit, finalUnit, rule);
        if (factor > 0) {
          const sizeInBase = limit * factor;
          if (sizeInBase >= finalQty) {
            finalQty = limit;
            finalUnit = sizeUnit;
            matched = true;
            break;
          }
        }
      }
      if (!matched) {
        const largest = itemSizes[itemSizes.length - 1];
        const factor = getConversionFactor(largest[1], finalUnit, rule);
        if (factor > 0) {
          const sizeInBase = largest[0] * factor;
          finalQty = Math.ceil(finalQty / sizeInBase) * largest[0];
          finalUnit = largest[1];
          matched = true;
        }
      }
    }

    if (finalQty !== null) {
      if (matched) {
        finalQty = Math.ceil(finalQty);
        sizeNote = `${formatQtyValueWithUnit(originalQty!, originalUnit)} needed`;
      } else {
        if (isVolumeUnit(finalUnit)) {
          sizeNote = `${formatQtyValueWithUnit(totalQty!, finalUnit)} needed`;
          finalQty = null;
          finalUnit = '';
        } else if (isWeightUnit(finalUnit)) {
          finalQty = Math.ceil(finalQty * 100) / 100;
        } else {
          // Countable/package items round up to integers
          finalQty = Math.ceil(finalQty);
        }
      }
    }

    const category = classifyItemToCategory(group.name);
    const itemIsStaple = isStaple(group.key);
    const stapleState: 'in-pantry' | undefined = itemIsStaple
      ? 'in-pantry'
      : undefined;

    const note: ShoppingItemNote = {
      ingredientNotes,
    };
    if (sizeNote) {
      note.sizeNote = sizeNote;
    }

    const finalUnitPlural =
      finalQty !== null ? pluralizeUnit(finalUnit, finalQty) : finalUnit;
    const shopItem: ShoppingItem = {
      qty: finalQty,
      unit: finalUnitPlural,
      item: group.name,
      category,
      staple: stapleState,
      note,
    };

    if (shopItem.staple === 'in-pantry') {
      stapleItems.push(shopItem);
    } else if (group.optional) {
      optionalItems.push(shopItem);
    } else {
      buyItems.push(shopItem);
    }
  }

  const sorter = (a: ShoppingItem, b: ShoppingItem) => {
    const secA = getSectionForCategory(a.category);
    const secB = getSectionForCategory(b.category);
    if (secA.order !== secB.order) {
      return secA.order - secB.order;
    }
    return a.item.localeCompare(b.item);
  };

  buyItems.sort(sorter);
  optionalItems.sort(sorter);
  stapleItems.sort(sorter);

  return { buyItems, optionalItems, stapleItems };
}

export function extractIngredientsFromDOM(
  scale: number,
  elements: NodeListOf<HTMLElement>,
): IngredientInput[] {
  const ingredients: IngredientInput[] = [];

  elements.forEach((el) => {
    const rawQty = el.dataset.qty;
    let qty: number | [number, number] | undefined = undefined;
    if (rawQty) {
      if (rawQty.includes('-') || rawQty.includes(',')) {
        const parts = rawQty.split(/[-,]/).map((p) => parseFloat(p.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          qty = [parts[0] * scale, parts[1] * scale];
        } else {
          qty = (parseFloat(rawQty) || 0) * scale;
        }
      } else {
        qty = (parseFloat(rawQty) || 0) * scale;
      }
    }

    let alt: IngredientInput['alt'] = undefined;
    if (el.dataset.altItem) {
      let altQty: number | [number, number] | undefined = undefined;
      const rawAltQty = el.dataset.altQty;
      if (rawAltQty) {
        if (rawAltQty.includes('-') || rawAltQty.includes(',')) {
          const parts = rawAltQty
            .split(/[-,]/)
            .map((p) => parseFloat(p.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            altQty = [parts[0] * scale, parts[1] * scale];
          } else {
            altQty = (parseFloat(rawAltQty) || 0) * scale;
          }
        } else {
          altQty = (parseFloat(rawAltQty) || 0) * scale;
        }
      }
      alt = {
        item: el.dataset.altItem,
        qty: altQty,
        unit: el.dataset.altUnit,
        desc: el.dataset.altDesc,
        prep: el.dataset.altPrep,
      };
    }

    ingredients.push({
      item: el.dataset.item || el.textContent?.trim() || '',
      qty,
      unit: el.dataset.unit,
      desc: el.dataset.desc,
      prep: el.dataset.prep,
      optional: el.dataset.optional === 'true',
      alt,
      recipe:
        document.querySelector('.recipe-title-bar h1')?.textContent ||
        undefined,
    });
  });

  return ingredients;
}
