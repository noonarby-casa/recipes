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
    convert: ({ scaledQty, unit, rest, isStaple }) => {
      const count = Math.ceil(scaledQty);
      return {
        qty: count,
        unit: getAdaptiveUnit(count, unit),
        rest,
        notes: {},
        note: [],
        isStaple,
      };
    },
  },

  // Volume to Package
  {
    name: "VolumeToPackage",
    matches: ({ unitLower, isStaple }) => !isStaple && isVolumeUnit(unitLower),
    convert: ({ scaledQty, unit, restLower, rest, isStaple }) => {
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
      };
    },
  },
];

/**
 * Converts a recipe ingredient item to its commercial shopping package representation
 * by running it through the custom and generic conversion rules.
 */
export function convertIngredient(item: Ingredient): ShoppingItem {
  const isStaple = checkIsStaple(
    item.rest,
    item.isScalable ? item.prep : "",
    item.isScalable ? item.unit : "",
  );

  if (!item.isScalable) {
    return {
      qty: null,
      unit: "",
      rest: item.rest,
      notes: {},
      note: [],
      isStaple,
    };
  }

  const { scaledQty, unit, rest, prep } = item;
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
  };

  // 1. Try Custom Rules
  for (const rule of INGREDIENT_RULES) {
    if (
      rule.convert &&
      matchesIngredient(
        { rest: restLower, prep: prepLower, unit: unitLower },
        rule.match,
      )
    ) {
      const result = rule.convert(context);
      if (result) return result;
    }
  }

  // 2. Try Fallbacks
  for (const strategy of fallbackConverters) {
    if (strategy.matches(context)) {
      const result = strategy.convert(context);
      if (result) return result;
    }
  }

  // 3. Default fallback
  return {
    qty: scaledQty,
    unit: getAdaptiveUnit(scaledQty, unit),
    rest,
    notes: {},
    note: [],
    isStaple,
  };
}
