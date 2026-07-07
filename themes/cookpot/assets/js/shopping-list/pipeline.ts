import { STAPLE_ITEMS, ITEM_RULES } from "./config";
import { convertQty } from "./utils";
import { getStoreSection } from "./store-sections";
import {
  IngredientInput,
  ShoppingItem,
  ProcessedShoppingList,
  ItemRule,
  ShoppingItemNote,
} from "./types";

function getRuleForItem(itemName: string): ItemRule | undefined {
  const lower = itemName.toLowerCase().trim();
  return ITEM_RULES.find((rule) => rule.items.includes(lower));
}

function isStaple(itemName: string): boolean {
  return STAPLE_ITEMS.has(itemName.toLowerCase().trim());
}

function getAverageQty(qty?: number | [number, number]): number | null {
  if (qty === undefined) return null;
  if (Array.isArray(qty)) return (qty[0] + qty[1]) / 2;
  return qty;
}

/**
 * Runs the complete processing pipeline on the recipe ingredients.
 * Groups by item, converts units to a common base, matches package sizes, and sorts.
 */
export function processShoppingList(
  ingredients: IngredientInput[],
): ProcessedShoppingList {
  const map = new Map<
    string,
    {
      baseQty: number;
      baseUnit: string;
      unquantified: boolean;
      notes: ShoppingItemNote[];
      item: string;
      isStaple: boolean;
      optional: boolean;
    }
  >();

  for (const ing of ingredients) {
    const itemName = ing.item.toLowerCase().trim();
    const rule = getRuleForItem(itemName);
    const qty = getAverageQty(ing.qty);
    const unit = ing.unit || "";

    let targetUnit = unit;
    if (rule?.unitEquivalences) {
      const firstEq = Object.values(rule.unitEquivalences)[0];
      if (firstEq) {
        targetUnit = firstEq.base;
      }
    } else if (unit) {
      if (convertQty(1, unit, "teaspoon") > 0) targetUnit = "teaspoon";
      else if (convertQty(1, unit, "ounce") > 0) targetUnit = "ounce";
    }

    let convertedQty = qty;
    if (qty !== null && unit !== targetUnit) {
      convertedQty = convertQty(qty, unit, targetUnit, rule);
    }

    let existing = map.get(itemName);
    if (!existing) {
      existing = {
        baseQty: 0,
        baseUnit: targetUnit,
        unquantified: false,
        notes: [],
        item: ing.item,
        isStaple: isStaple(itemName),
        optional: !!ing.optional,
      };
      map.set(itemName, existing);
    }

    if (convertedQty !== null) {
      existing.baseQty += convertedQty;
    } else {
      existing.unquantified = true;
    }

    if (!ing.optional) {
      existing.optional = false;
    }

    if (ing.category || ing.alt?.item) {
      existing.notes.push({
        recipe: ing.category || "",
        altItem: ing.alt?.item,
      });
    }
  }

  const buyItems: ShoppingItem[] = [];
  const optionalItems: ShoppingItem[] = [];
  const stapleItems: ShoppingItem[] = [];

  for (const [itemName, group] of map.entries()) {
    const rule = getRuleForItem(itemName);
    let finalQty: number | null = group.unquantified ? null : group.baseQty;
    let finalUnit = group.baseUnit;

    if (finalQty !== null && rule?.itemSizes && rule.itemSizes.length > 0) {
      let matched = false;
      for (const [limit, sizeUnit] of rule.itemSizes) {
        const sizeInBase = convertQty(limit, sizeUnit, finalUnit, rule);
        if (sizeInBase >= finalQty) {
          finalQty = limit;
          finalUnit = sizeUnit;
          matched = true;
          break;
        }
      }
      if (!matched) {
        const largest = rule.itemSizes[rule.itemSizes.length - 1];
        const sizeInBase = convertQty(largest[0], largest[1], finalUnit, rule);
        if (sizeInBase > 0) {
          finalQty = Math.ceil(finalQty / sizeInBase) * largest[0];
          finalUnit = largest[1];
        }
      }
    } else if (finalQty !== null) {
      if (finalUnit === "teaspoon") {
        if (finalQty >= 48) {
          finalQty = finalQty / 48;
          finalUnit = "cup";
        } else if (finalQty >= 3) {
          finalQty = finalQty / 3;
          finalUnit = "tablespoon";
        }
      } else if (finalUnit === "ounce") {
        if (finalQty >= 16) {
          finalQty = finalQty / 16;
          finalUnit = "pound";
        }
      }
    }

    const section = getStoreSection(group.item, group.item);

    const shopItem: ShoppingItem = {
      qty: finalQty !== null ? Math.ceil(finalQty * 100) / 100 : null,
      unit: finalUnit,
      item: group.item,
      rest: group.item,
      notes: group.notes,
      isStaple: group.isStaple,
      optional: group.optional,
      section: section.id,
    };

    if (group.isStaple) stapleItems.push(shopItem);
    else if (group.optional) optionalItems.push(shopItem);
    else buyItems.push(shopItem);
  }

  const sorter = (a: ShoppingItem, b: ShoppingItem) => {
    const secA = getStoreSection(a.rest, a.item);
    const secB = getStoreSection(b.rest, b.item);
    if (secA.order !== secB.order) return secA.order - secB.order;
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
      if (rawQty.includes("-") || rawQty.includes(",")) {
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

    let alt: IngredientInput["alt"] = undefined;
    if (el.dataset.altItem) {
      let altQty: number | [number, number] | undefined = undefined;
      const rawAltQty = el.dataset.altQty;
      if (rawAltQty) {
        if (rawAltQty.includes("-") || rawAltQty.includes(",")) {
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
      item: el.dataset.item || el.textContent?.trim() || "",
      qty,
      unit: el.dataset.unit,
      desc: el.dataset.desc,
      prep: el.dataset.prep,
      optional: el.dataset.optional === "true",
      alt,
      category:
        document.querySelector(".recipe-title-bar h1")?.textContent ||
        undefined,
    });
  });

  return ingredients;
}
