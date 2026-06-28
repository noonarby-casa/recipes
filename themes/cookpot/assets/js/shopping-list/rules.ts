import { getAdaptiveUnit, formatCookingNumber } from "../units";
import {
  matchesConfig,
  matchesIngredient,
  isVolumeUnit,
  adjustDescriptionPlurality,
  getSingularUnit,
  buildMapKey,
  createNote,
  range,
} from "./utils";
import {
  IngredientMatchConfig,
  ShoppingItem,
  ConverterContext,
  RuleConfig,
  ConversionProps,
} from "./types";
import { STAPLES, RULE_CONFIGS } from "./config";

export interface IngredientRule {
  name: string;
  match: IngredientMatchConfig;
  isStaple?: boolean | ((qty: number | null, unit: string) => boolean);
  getIngredientKey?: (unit: string, prep: string, baseKey: string) => string;
  getShoppingItemKey?: (unit: string, restLower: string) => string | undefined;
  convert?: (ctx: ConverterContext) => ShoppingItem | null;
}

/**
 * Factory to construct a unified conversion rule from a RuleConfig schema.
 * Supports flat configs (ginger, onion, half-pint/pint containers) as well as
 * nested conversions arrays (lemon/lime zest vs juice vs counts).
 */
function createConversionRule(config: RuleConfig): IngredientRule {
  return {
    name: config.name,
    match: config.match,
    isStaple: config.isStaple ?? false,

    getShoppingItemKey: config.groupKey
      ? (unit, restLower) => {
          const normUnit = getSingularUnit(unit);
          if (
            normUnit === config.name ||
            matchesIngredient({ rest: restLower, prep: "", unit }, config.match)
          ) {
            return config.groupKey;
          }
          return undefined;
        }
      : undefined,

    convert: (ctx) => {
      const { scaledQty, unit, unitLower, rest, restLower, isStaple } = ctx;

      const matchesBlock = (props: ConversionProps) => {
        if (props.units) {
          const unitsArr = Array.isArray(props.units)
            ? props.units
            : [props.units];
          const hasVolumeWildcard = unitsArr.includes("*volume*");
          const hasCatchallWildcard = unitsArr.includes("*");
          const matchesUnit =
            hasCatchallWildcard ||
            (hasVolumeWildcard && isVolumeUnit(unitLower)) ||
            unitsArr.some((u) => unitLower.includes(u));
          if (!matchesUnit) return false;
        }
        if (
          props.matchPattern &&
          !matchesConfig(restLower, props.matchPattern)
        ) {
          return false;
        }
        return true;
      };

      const conv = config.conversions.find(matchesBlock);

      if (!conv) {
        // Pass-through if the source unit already matches the target unit
        const targetUnit = config.conversions[0]?.output?.unit ?? "";
        if (targetUnit && unitLower.includes(targetUnit)) {
          const qty = Math.ceil(scaledQty);
          return {
            qty,
            unit: getAdaptiveUnit(qty, targetUnit),
            rest: rest,
            notes: {},
            note: [],
            isStaple,
          };
        }
        return null;
      }

      // 1. Calculate factor (can be a flat number or a map of multipliers)
      let factor = 1;
      if (conv.unitMultiplier !== undefined) {
        if (typeof conv.unitMultiplier === "number") {
          factor = conv.unitMultiplier;
        } else {
          const matchingFactorEntry = Object.entries(conv.unitMultiplier).find(
            ([u]) => unitLower.includes(u),
          );
          factor = matchingFactorEntry
            ? matchingFactorEntry[1]
            : (conv.unitMultiplier.default ?? 1);
        }
      }

      // 2. Calculate quantity
      let qty = conv.output?.qty ?? Math.ceil(scaledQty * factor);

      // 3. Handle threshold packaging sizes (Liquid containers)
      let targetUnit = conv.output?.unit ?? "";
      if (conv.packageSizes && conv.packageSizes.length > 0) {
        const rangeConfig: [number, { qty: number; unit: string }][] =
          conv.packageSizes.map(([limit, unitName]) => [
            limit,
            { qty: 1, unit: unitName },
          ]);
        const maxLimit = conv.packageSizes[conv.packageSizes.length - 1][0];
        const fallbackUnit = conv.packageSizes[conv.packageSizes.length - 1][1];
        const fallbackCount = Math.ceil(scaledQty / maxLimit);
        const matchedRange = range(scaledQty, rangeConfig, {
          qty: fallbackCount,
          unit: getAdaptiveUnit(fallbackCount, fallbackUnit),
        });
        qty = matchedRange.qty;
        targetUnit = matchedRange.unit;
      } else {
        targetUnit = getAdaptiveUnit(qty, targetUnit);
      }

      // 4. Construct rest description
      let finalRest = conv.output?.rest ?? rest;
      if (targetUnit === "" && config.name) {
        finalRest = adjustDescriptionPlurality(qty, finalRest, config.name);
      }

      // 5. Construct parts
      const parts = conv.partName ? { [conv.partName]: qty } : undefined;

      // 6. Construct notes
      const noteUnit =
        unit ||
        conv.note?.defaultUnit ||
        (config.name ? getSingularUnit(config.name) : "");
      let noteExplanation = conv.note?.explanation ?? "";
      if (!noteExplanation && factor !== 1 && targetUnit && noteUnit) {
        const singTarget = getSingularUnit(targetUnit);
        const singNoteUnit = getSingularUnit(noteUnit);
        if (singTarget !== singNoteUnit) {
          noteExplanation = `1 ${singTarget} = ${formatCookingNumber(1 / factor)} ${singNoteUnit}`;
        }
      }
      const notes = createNote(
        scaledQty,
        noteUnit,
        noteExplanation,
        conv.partName ?? "",
      );

      return {
        qty,
        unit: targetUnit,
        rest: finalRest,
        notes: noteExplanation || conv.partName ? notes : {},
        note: [],
        isStaple,
        parts,
      };
    },
  };
}

export const INGREDIENT_RULES: IngredientRule[] = [
  ...RULE_CONFIGS.map(createConversionRule),
];

export function findRule(
  rest: string,
  prep: string = "",
  unit: string = "",
): IngredientRule | undefined {
  const item = {
    rest: rest.toLowerCase(),
    prep: prep.toLowerCase(),
    unit: unit.toLowerCase(),
  };
  return INGREDIENT_RULES.find((rule) => matchesIngredient(item, rule.match));
}

export function checkIsStaple(
  rest: string,
  prep: string = "",
  unit: string = "",
): boolean {
  const rule = findRule(rest, prep, unit);
  if (rule && rule.isStaple !== undefined) {
    if (typeof rule.isStaple === "function") {
      return rule.isStaple(null, unit);
    }
    return rule.isStaple;
  }
  return STAPLES.some((entry) => matchesConfig(rest, entry));
}

export function getIngredientKey(
  unit: string,
  rest: string,
  prep: string,
): string {
  const baseKey = buildMapKey(unit, rest);
  const rule = findRule(rest, prep, unit);
  if (rule && rule.getIngredientKey) {
    return rule.getIngredientKey(unit, prep, baseKey);
  }
  return baseKey;
}

export function getShoppingItemKey(unit: string, rest: string): string {
  const rule = findRule(rest, "", unit);
  if (rule && rule.getShoppingItemKey) {
    const key = rule.getShoppingItemKey(unit, rest.toLowerCase().trim());
    if (key !== undefined) {
      return key;
    }
  }
  return buildMapKey(unit, rest);
}
