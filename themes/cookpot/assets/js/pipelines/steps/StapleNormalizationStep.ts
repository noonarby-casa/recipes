import type { RuleStep } from '../core/RulePipeline';
import type { ShoppingItem, ItemRule, ItemForm } from '../../types';
import { ITEM_RULES } from '../shopping-list/rules';

export class StapleNormalizationStep implements RuleStep<ShoppingItem> {
  readonly name = 'StapleNormalizationStep';

  process(items: ShoppingItem[]): ShoppingItem[] {
    return items.map((shoppingItem) => {
      const lowerName = shoppingItem.item.toLowerCase().trim();
      const matchingRule = ITEM_RULES.find(
        (r: ItemRule) =>
          r.canonicalName.toLowerCase() === lowerName ||
          r.items.some((i: ItemForm | string) => {
            if (typeof i === 'string') {
              return i.toLowerCase() === lowerName;
            }
            return (
              i.singular.toLowerCase() === lowerName ||
              i.plural.toLowerCase() === lowerName ||
              i.aliases?.some((a) => a.toLowerCase() === lowerName)
            );
          }),
      );

      if (matchingRule?.staple && !shoppingItem.staple) {
        return { ...shoppingItem, staple: 'in-pantry' };
      }

      return shoppingItem;
    });
  }
}
