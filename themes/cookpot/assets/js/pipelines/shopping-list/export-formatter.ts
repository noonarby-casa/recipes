import type { ShoppingItem } from '../../types';
import { formatItemQuantity } from '../../units';
import { getSectionForCategory, getActiveStoreLayout } from './store-sections';
import { formatShoppingItemNotes } from './utils';

export type ExportFormat = 'google-keep' | 'markdown';
export type ItemFilter = 'unchecked' | 'all' | 'checked';

export interface ExportItem extends ShoppingItem {
  isChecked: boolean;
  isOptional?: boolean;
}

export function filterExportItems(
  items: ExportItem[],
  filter: ItemFilter,
): ExportItem[] {
  if (filter === 'unchecked') {
    return items.filter((item) => !item.isChecked);
  }
  if (filter === 'checked') {
    return items.filter((item) => item.isChecked);
  }
  return items;
}

export function formatShoppingListExport(
  items: ExportItem[],
  title: string,
  format: ExportFormat,
  filter: ItemFilter,
): string {
  const filtered = filterExportItems(items, filter);
  const buyItems = filtered.filter((i) => !i.isOptional);
  const optionalItems = filtered.filter((i) => i.isOptional);

  if (format === 'google-keep') {
    const lines = [
      ...buyItems.map((item) => {
        const { qtyStr, itemStr } = formatItemQuantity(
          item.qty,
          item.unit,
          item.item,
        );
        return `${qtyStr ? qtyStr + ' ' : ''}${itemStr}${formatShoppingItemNotes(item, false)}`;
      }),
      ...optionalItems.map((item) => {
        const { qtyStr, itemStr } = formatItemQuantity(
          item.qty,
          item.unit,
          item.item,
        );
        return `${qtyStr ? qtyStr + ' ' : ''}${itemStr}${formatShoppingItemNotes(item, false)} (optional)`;
      }),
    ];
    return lines.join('\n');
  }

  // Markdown format
  let text = `## SHOPPING LIST: ${title}\n`;
  if (buyItems.length > 0) {
    text += '\n### Need to Buy\n';
    const activeLayout = getActiveStoreLayout();
    const sortedBuy = [...buyItems].sort((a, b) => {
      const secA = getSectionForCategory(a.category, activeLayout);
      const secB = getSectionForCategory(b.category, activeLayout);
      if (secA.order !== secB.order) {
        return secA.order - secB.order;
      }
      return a.item.localeCompare(b.item);
    });

    let currentSectionId = '';
    for (const item of sortedBuy) {
      const section = getSectionForCategory(item.category, activeLayout);
      if (section.id !== currentSectionId) {
        currentSectionId = section.id;
        text += `\n[ ${section.name} ]\n`;
      }
      const { qtyStr, itemStr } = formatItemQuantity(
        item.qty,
        item.unit,
        item.item,
      );
      const checkMarker = item.isChecked ? '[x]' : '[ ]';
      text += `- ${checkMarker} ${qtyStr ? qtyStr + ' ' : ''}${itemStr}${formatShoppingItemNotes(item, false)}\n`;
    }
  }

  if (optionalItems.length > 0) {
    text += '\n### Optional\n';
    for (const item of optionalItems) {
      const { qtyStr, itemStr } = formatItemQuantity(
        item.qty,
        item.unit,
        item.item,
      );
      const checkMarker = item.isChecked ? '[x]' : '[ ]';
      text += `- ${checkMarker} ${qtyStr ? qtyStr + ' ' : ''}${itemStr}${formatShoppingItemNotes(item, false)}\n`;
    }
  }

  return text.trim();
}
