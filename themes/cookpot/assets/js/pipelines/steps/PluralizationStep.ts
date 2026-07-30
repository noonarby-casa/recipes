import type { RuleStep } from '../RulePipeline';
import { pluralizeWord, pluralizeUnit } from '../../units';

export interface PluralizableItem {
  qty: number | null;
  unit: string;
  item: string;
  formattedItem?: string;
  formattedUnit?: string;
}

export class PluralizationStep<
  T extends PluralizableItem,
> implements RuleStep<T> {
  readonly name = 'PluralizationStep';

  process(items: T[]): T[] {
    return items.map((itemObj) => {
      const qtyNum = itemObj.qty ?? 1;
      const formattedItem =
        qtyNum > 1 ? pluralizeWord(itemObj.item) : itemObj.item;
      const formattedUnit = pluralizeUnit(itemObj.unit, qtyNum);

      return {
        ...itemObj,
        formattedItem,
        formattedUnit,
      };
    });
  }
}
