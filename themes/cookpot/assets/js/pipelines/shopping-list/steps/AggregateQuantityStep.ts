import type { RuleStep } from '../../core/RulePipeline';
import type {
  ShoppingItem,
  ShoppingItemNote,
  IngredientNote,
  QtyValue,
} from '../../../types';
import type { IngredientGroup } from './GroupCanonicalIngredientsStep';
import { ITEM_RULES } from '../rules';
import {
  determineTargetUnit,
  convertQtyValue,
  addQtyValues,
  getUnitCategory,
  getSingularUnit,
  pluralizeUnit,
} from '../utils';
import { classifyItemToCategory } from '../store-sections';

export interface AggregatedShoppingItem {
  item: ShoppingItem;
  isOptional: boolean;
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
