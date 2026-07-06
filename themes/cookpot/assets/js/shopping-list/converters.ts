import { getAdaptiveUnit } from "../units";
import { matchesIngredient, createNote, match, isVolumeUnit } from "./utils";
import { Ingredient, ShoppingItem, ConverterContext } from "./types";
import { INGREDIENT_RULES, checkIsStaple } from "./rules";
import { VOLUME_TO_PACKAGE_MAPPINGS } from "./config";

export interface ConverterStrategy {
  name: string;
  matches: (ctx: ConverterContext) => boolean;
  convert: (ctx: ConverterContext) => ShoppingItem | null;
}

// Fallback / Generic converters
const fallbackConverters: ConverterStrategy[] = [
  // Count-based items (Cans, cloves, sizes)
  {
    name: "CountItems",
    matches: ({ unitLower }) =>
      ["can", "clove", "small", "large", "medium"].some((u) =>
        unitLower.includes(u),
      ),
    convert: ({ scaledQty, unit, rest, isStaple, optional, item }) => {
      const count = Math.ceil(scaledQty);
      return {
        qty: count,
        unit: getAdaptiveUnit(count, unit),
        rest,
        notes: {},
        note: [],
        isStaple,
        optional,
        item,
      };
    },
  },

  // Volume to Package
  {
    name: "VolumeToPackage",
    matches: ({ unitLower, isStaple }) => !isStaple && isVolumeUnit(unitLower),
    convert: ({
      scaledQty,
      unit,
      restLower,
      rest,
      isStaple,
      optional,
      item,
    }) => {
      const purchaseUnit = match(
        restLower,
        VOLUME_TO_PACKAGE_MAPPINGS,
        "package",
      );

      return {
        qty: 1,
        unit: purchaseUnit,
        rest,
        notes: createNote(scaledQty, unit),
        note: [],
        isStaple,
        optional,
        item,
      };
    },
  },
];

/**
 * Converts a recipe ingredient item to its commercial shopping package representation
 * by running it through the custom and generic conversion rules.
 */
export function convertIngredient(item: Ingredient): ShoppingItem {
  const isStaple = checkIsStaple(item.rest, item.prep, item.unit);

  let result: ShoppingItem;

  if (item.quantity === null) {
    result = {
      qty: null,
      unit: "",
      rest: item.rest,
      notes: {},
      note: [],
      isStaple,
      optional: item.optional,
      item: item.item,
    };
  } else {
    const scaledQty = item.quantity;
    const { unit, rest, prep } = item;
    const restLower = rest.toLowerCase();
    const unitLower = unit.toLowerCase();
    const prepLower = prep.toLowerCase();
    const context: ConverterContext = {
      scaledQty,
      unit,
      unitLower,
      rest,
      restLower,
      prep,
      prepLower,
      isStaple,
      optional: item.optional,
      item: item.item,
      itemLower: item.item.toLowerCase(),
    };

    let converted: ShoppingItem | null = null;

    // 1. Try Custom Rules
    for (const rule of INGREDIENT_RULES) {
      if (
        rule.convert &&
        matchesIngredient(
          { rest: restLower, prep: prepLower, unit: unitLower },
          rule.match,
        )
      ) {
        converted = rule.convert(context);
        if (converted) {
          converted.optional = item.optional;
          converted.item = item.item;
          break;
        }
      }
    }

    // 2. Try Fallbacks
    if (!converted) {
      for (const strategy of fallbackConverters) {
        if (strategy.matches(context)) {
          converted = strategy.convert(context);
          if (converted) break;
        }
      }
    }

    // 3. Default fallback
    if (!converted) {
      converted = {
        qty: scaledQty,
        unit: getAdaptiveUnit(scaledQty, unit),
        rest,
        notes: {},
        note: [],
        isStaple,
        optional: item.optional,
        item: item.item,
      };
    }

    result = converted;
  }

  // Preserve category context (recipe title or category name) as a note source (Edge Case 5)
  if (item.category) {
    const catKey = item.category.toLowerCase().trim();
    if (!result.notes[catKey]) {
      result.notes[catKey] = [
        {
          prefix: "",
          qty: item.quantity,
          unit: item.unit,
          rest: item.rest,
          explanation: item.category,
        },
      ];
    }
  }

  // Keep sizeNote if available (Edge Case 1)
  if (item.sizeNote) {
    result.sizeNote = item.sizeNote;
  }

  return result;
}
