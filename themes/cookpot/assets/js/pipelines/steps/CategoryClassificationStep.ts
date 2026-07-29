import type { RuleStep } from '../core/RulePipeline';
import { classifyItemToCategory } from '../shopping-list/store-sections';

export interface CategorizedItem {
  item: string;
  category?: string;
}

export class CategoryClassificationStep<
  T extends CategorizedItem,
> implements RuleStep<T> {
  readonly name = 'CategoryClassificationStep';

  process(items: T[]): T[] {
    return items.map((itemObj) => {
      const category = classifyItemToCategory(itemObj.item);
      return {
        ...itemObj,
        category: itemObj.category || category,
      };
    });
  }
}
