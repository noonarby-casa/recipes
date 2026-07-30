import type { RuleStep } from '../RulePipeline';
import type { ExportItem, ItemFilter } from '../shoppingExportPipeline';

export class FilterExportItemsStep implements RuleStep<ExportItem> {
  readonly name = 'FilterExportItemsStep';
  private filterMode: ItemFilter;

  constructor(filterMode: ItemFilter = 'all') {
    this.filterMode = filterMode;
  }

  process(items: ExportItem[]): ExportItem[] {
    if (this.filterMode === 'unchecked') {
      return items.filter((item) => !item.isChecked);
    }
    if (this.filterMode === 'checked') {
      return items.filter((item) => item.isChecked);
    }
    return items;
  }
}
