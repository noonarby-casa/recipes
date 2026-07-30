import type { RuleStep } from '../RulePipeline';
import type { ShoppingItem } from '../../types';
import {
  getSectionForCategory,
  getActiveStoreLayout,
  STORE_LAYOUTS,
} from '../../data/store-sections';

export class StoreCategorizationStep implements RuleStep<ShoppingItem> {
  readonly name = 'StoreCategorizationStep';
  private layoutId?: string;

  constructor(layoutId?: string) {
    this.layoutId = layoutId;
  }

  process(items: ShoppingItem[]): ShoppingItem[] {
    const layout =
      (this.layoutId && STORE_LAYOUTS.find((l) => l.id === this.layoutId)) ||
      getActiveStoreLayout();

    return items.map((shoppingItem) => {
      const section = getSectionForCategory(shoppingItem.category, layout);
      if (section && shoppingItem.category !== section.id) {
        return { ...shoppingItem, category: section.id };
      }
      return shoppingItem;
    });
  }
}
