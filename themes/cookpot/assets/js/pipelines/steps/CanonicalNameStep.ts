import type { RuleStep } from '../RulePipeline';
import type { ItemRule, ItemForm } from '../../types';
import { ITEM_RULES } from '../rules';

export interface NamedItem {
  item: string;
  canonicalName?: string;
}

export class CanonicalNameStep<T extends NamedItem> implements RuleStep<T> {
  readonly name = 'CanonicalNameStep';

  process(items: T[]): T[] {
    return items.map((itemObj) => {
      const lower = itemObj.item.toLowerCase().trim();
      const rule = ITEM_RULES.find(
        (r: ItemRule) =>
          r.canonicalName.toLowerCase() === lower ||
          r.items.some((i: ItemForm | string) => {
            if (typeof i === 'string') {
              return i.toLowerCase() === lower;
            }
            return (
              i.singular.toLowerCase() === lower ||
              i.plural.toLowerCase() === lower ||
              i.aliases?.some((a) => a.toLowerCase() === lower)
            );
          }),
      );

      return {
        ...itemObj,
        canonicalName: rule?.canonicalName || itemObj.item,
      };
    });
  }
}
