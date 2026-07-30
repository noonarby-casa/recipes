import type { RuleStep } from '../RulePipeline';
import type { ExportItem } from '../shoppingExportPipeline';
import type { StoreLayout } from '../../types';
import { getSectionForCategory } from '../../data/store-sections';

export class GroupExportByAisleStep implements RuleStep<ExportItem> {
  readonly name = 'GroupExportByAisleStep';
  private layout?: StoreLayout;

  constructor(layout?: StoreLayout) {
    this.layout = layout;
  }

  process(items: ExportItem[]): ExportItem[] {
    return [...items].sort((a, b) => {
      const secA = getSectionForCategory(a.category, this.layout);
      const secB = getSectionForCategory(b.category, this.layout);
      const orderA = secA?.order ?? 999;
      const orderB = secB?.order ?? 999;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.item.localeCompare(b.item);
    });
  }
}
