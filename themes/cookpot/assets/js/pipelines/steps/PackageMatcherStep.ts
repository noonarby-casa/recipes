import type { RuleStep } from '../RulePipeline';
import type { ShoppingItem, StoreLayout, ShoppingItemNote } from '../../types';
import { ITEM_RULES } from '../rules';
import {
  getSingularUnit,
  getConversionFactor,
  formatQtyValueWithUnit,
  isVolumeUnit,
  isWeightUnit,
  pluralizeUnit,
} from '../utils';

export class PackageMatcherStep implements RuleStep<ShoppingItem> {
  readonly name = 'PackageMatcherStep';
  private layout?: StoreLayout;

  constructor(layout?: StoreLayout) {
    this.layout = layout;
  }

  process(items: ShoppingItem[]): ShoppingItem[] {
    return items.map((shopItem) => {
      if (shopItem.qty === null) {
        return shopItem;
      }

      const rule = ITEM_RULES.find(
        (r) => r.canonicalName.toLowerCase() === shopItem.item.toLowerCase(),
      );

      const itemSizes =
        this.layout?.itemSizes?.[shopItem.item.toLowerCase()] ||
        (rule
          ? rule.items
              .map((i) =>
                typeof i === 'string'
                  ? this.layout?.itemSizes?.[i.toLowerCase()]
                  : this.layout?.itemSizes?.[i.singular.toLowerCase()],
              )
              .find(Boolean)
          : undefined);

      if (!itemSizes || itemSizes.length === 0) {
        if (isVolumeUnit(shopItem.unit)) {
          const note: ShoppingItemNote = {
            ingredientNotes: shopItem.note?.ingredientNotes || [],
            sizeNote: `${formatQtyValueWithUnit(shopItem.qty, shopItem.unit)} needed`,
          };

          return {
            ...shopItem,
            qty: null,
            unit: '',
            note,
          };
        }

        const roundedQty = isWeightUnit(shopItem.unit)
          ? Math.ceil(shopItem.qty * 100) / 100
          : Math.ceil(shopItem.qty);

        return {
          ...shopItem,
          qty: roundedQty,
          unit: pluralizeUnit(shopItem.unit, roundedQty),
        };
      }

      const originalQty = shopItem.qty;
      const originalUnit = shopItem.unit;
      const targetUnitSingular = getSingularUnit(originalUnit);

      const isAlreadyExactPackage = itemSizes.some(
        ([_, sizeUnit]) => getSingularUnit(sizeUnit) === targetUnitSingular,
      );

      if (isAlreadyExactPackage) {
        const roundedQty = Math.ceil(originalQty);
        return {
          ...shopItem,
          qty: roundedQty,
          unit: pluralizeUnit(originalUnit, roundedQty),
        };
      }

      interface PackageCandidate {
        count: number;
        sizeUnit: string;
        sizeInBase: number;
        waste: number;
      }
      const candidates: PackageCandidate[] = [];

      for (const [limit, sizeUnit] of itemSizes) {
        const factor = getConversionFactor(sizeUnit, originalUnit, rule);
        if (factor > 0) {
          const sizeInBase = limit * factor;
          const count = Math.ceil(originalQty / sizeInBase);
          const waste = count * sizeInBase - originalQty;
          candidates.push({
            count,
            sizeUnit,
            sizeInBase,
            waste,
          });
        }
      }

      if (candidates.length === 0) {
        return shopItem;
      }

      candidates.sort((a, b) => {
        if (Math.abs(a.waste - b.waste) > 0.001) {
          return a.waste - b.waste;
        }
        if (a.count !== b.count) {
          return a.count - b.count;
        }
        return b.sizeInBase - a.sizeInBase;
      });

      const best = candidates[0];
      const finalQty = Math.ceil(best.count);
      const finalUnit = pluralizeUnit(best.sizeUnit, finalQty);

      let sizeNote = shopItem.note?.sizeNote;
      if (
        !getSingularUnit(originalUnit) ||
        getSingularUnit(originalUnit) !== getSingularUnit(best.sizeUnit)
      ) {
        sizeNote = `${formatQtyValueWithUnit(originalQty, originalUnit)} needed`;
      }

      const note: ShoppingItemNote = {
        ingredientNotes: shopItem.note?.ingredientNotes || [],
        ...(sizeNote ? { sizeNote } : {}),
      };

      return {
        ...shopItem,
        qty: finalQty,
        unit: finalUnit,
        note,
      };
    });
  }
}
