import type { RuleStep } from '../RulePipeline';
import type {
  ShoppingItem,
  ShoppingItemNote,
  IngredientNote,
  QtyValue,
  ItemRule,
  UnitCategory,
} from '../../types';
import type { IngredientGroup } from './GroupCanonicalIngredientsStep';
import { ITEM_RULES } from '../../data/rules';
import {
  getSingularUnit,
  getConversionFactor,
  pluralizeUnit,
} from '../../units';
import { classifyItemToCategory } from '../../data/store-sections';
import { UNIT_LOOKUP } from '../../constants';

export interface AggregatedShoppingItem {
  item: ShoppingItem;
  isOptional: boolean;
}

function getUnitCategory(unit: string, rule?: ItemRule): UnitCategory {
  const sing = getSingularUnit(unit);
  if (!sing) {
    return 'COUNTABLE';
  }
  if (rule?.unitEquivalences?.[sing]) {
    const eq = rule.unitEquivalences[sing];
    const baseSing = getSingularUnit(eq.base);
    return UNIT_LOOKUP[baseSing]?.category || 'VOLUME';
  }
  const info = UNIT_LOOKUP[sing];
  if (info) {
    return info.category;
  }
  return 'COUNTABLE';
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

  const normalizedSingulars = uniqueUnits.map((u) => getSingularUnit(u));
  const uniqueSingulars = Array.from(new Set(normalizedSingulars));
  if (uniqueSingulars.length === 1) {
    return uniqueUnits[0];
  }

  return uniqueUnits[0] || '';
}

function convertQtyValue(
  val: QtyValue,
  fromUnit: string,
  toUnit: string,
  rule?: ItemRule,
): QtyValue {
  if (fromUnit === toUnit) {
    return val;
  }
  const factor = getConversionFactor(fromUnit, toUnit, rule);
  if (factor <= 0) {
    return val;
  }
  if (Array.isArray(val)) {
    return [val[0] * factor, val[1] * factor];
  }
  return val * factor;
}

function addQtyValues(a: QtyValue | undefined, b: QtyValue): QtyValue {
  if (a === undefined) {
    return b;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return [a[0] + b[0], a[1] + b[1]];
  }
  if (Array.isArray(a)) {
    return [a[0] + (b as number), a[1] + (b as number)];
  }
  if (Array.isArray(b)) {
    return [a + b[0], a + b[1]];
  }
  return (a as number) + (b as number);
}

export class AggregateQuantityStep implements RuleStep<IngredientGroup> {
  readonly name = 'AggregateQuantityStep';

  aggregate(groups: IngredientGroup[]): AggregatedShoppingItem[] {
    const shoppingItems: AggregatedShoppingItem[] = [];

    for (const group of groups) {
      const rule = ITEM_RULES.find(
        (r) => r.canonicalName.toLowerCase() === group.key,
      );
      const units = group.ingredients
        .map((ing) => {
          if (ing.alt?.qty !== undefined && ing.alt.unit) {
            return ing.alt.unit;
          }
          return ing.unit || '';
        })
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
          const targetCategory = getUnitCategory(targetUnit, rule);
          if (
            ing.alt?.qty !== undefined &&
            ing.alt.unit &&
            (getSingularUnit(ing.alt.unit) === getSingularUnit(targetUnit) ||
              (targetCategory === 'COUNTABLE' &&
                getUnitCategory(ing.alt.unit, rule) === 'COUNTABLE'))
          ) {
            converted = ing.alt.qty;
          } else if (
            unit === targetUnit ||
            getSingularUnit(unit) === getSingularUnit(targetUnit)
          ) {
            converted = ing.qty;
          } else {
            converted = convertQtyValue(ing.qty, unit, targetUnit, rule);
          }
          totalQty = addQtyValues(totalQty, converted);
        }
      }

      const finalQty: number | null =
        unquantified || totalQty === undefined
          ? null
          : Array.isArray(totalQty)
            ? totalQty[1]
            : totalQty;
      const finalUnit = targetUnit;
      const canonicalName = rule?.canonicalName || group.name;

      const category = rule?.category || classifyItemToCategory(group.name);
      const itemIsStaple = rule?.staple === true;
      const stapleState: 'in-pantry' | undefined = itemIsStaple
        ? 'in-pantry'
        : undefined;

      const note: ShoppingItemNote = {
        ingredientNotes,
      };

      const finalUnitPlural =
        finalQty !== null ? pluralizeUnit(finalUnit, finalQty) : finalUnit;
      const shopItem: ShoppingItem = {
        qty: finalQty,
        unit: finalUnitPlural,
        item: canonicalName,
        category,
        staple: stapleState,
        note,
      };

      shoppingItems.push({
        item: shopItem,
        isOptional: group.optional,
      });
    }

    return shoppingItems;
  }

  process(items: IngredientGroup[]): IngredientGroup[] {
    return items;
  }
}
