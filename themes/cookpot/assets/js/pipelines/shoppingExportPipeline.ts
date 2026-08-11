import type { ShoppingItem, IngredientNote } from '../types';
import { formatItemQuantity, abbreviateUnit } from '../units';
import {
  getSectionForCategory,
  getActiveStoreLayout,
} from '../data/store-sections';
import { RulePipeline } from './RulePipeline';
import { FilterExportItemsStep } from './steps/FilterExportItemsStep';
import { GroupExportByAisleStep } from './steps/GroupExportByAisleStep';

export type ExportFormat = 'google-keep' | 'markdown';
export type ItemFilter = 'unchecked' | 'all' | 'checked';

export interface ExportItem extends ShoppingItem {
  isChecked: boolean;
  isOptional?: boolean;
}

export interface GroupedNote {
  descriptor?: string;
  altItem?: string;
  recipes: string[];
}

export function getGroupedNotes(item: ShoppingItem): {
  sizeNote?: string;
  details: GroupedNote[];
  fallbackRecipes: string[];
} {
  const details: GroupedNote[] = [];
  const fallbackRecipes: string[] = [];

  if (!item.note) {
    return { details, fallbackRecipes };
  }

  const sizeNote = item.note.sizeNote;
  const groups: Record<string, GroupedNote> = {};

  (item.note.ingredientNotes || []).forEach((n: IngredientNote) => {
    const desc = n.descriptor || '';
    const alt = n.altItem || '';
    const recipe = n.recipe;

    if (!desc && !alt) {
      if (recipe && !fallbackRecipes.includes(recipe)) {
        fallbackRecipes.push(recipe);
      }
    } else {
      const key = `${desc}|${alt}`;
      if (!groups[key]) {
        groups[key] = {
          descriptor: n.descriptor,
          altItem: n.altItem,
          recipes: [],
        };
      }
      if (recipe && !groups[key].recipes.includes(recipe)) {
        groups[key].recipes.push(recipe);
      }
    }
  });

  return {
    sizeNote,
    details: Object.values(groups),
    fallbackRecipes,
  };
}

export function formatShoppingItemNotes(
  item: ShoppingItem,
  includeRecipes = true,
): string {
  const { sizeNote, details, fallbackRecipes } = getGroupedNotes(item);
  const parts: string[] = [];

  if (sizeNote) {
    parts.push(sizeNote);
  }

  details.forEach((group) => {
    const descPart = group.descriptor || '';
    const altPart = group.altItem ? `or ${group.altItem}` : '';
    const noteText = [descPart, altPart].filter(Boolean).join(' ');

    let recipePart = '';
    if (includeRecipes && group.recipes.length > 0) {
      recipePart = `for ${group.recipes.join(', ')}`;
    }

    const fullPart = [noteText, recipePart].filter(Boolean).join(' ');
    if (fullPart) {
      parts.push(fullPart);
    }
  });

  if (includeRecipes && fallbackRecipes.length > 0) {
    parts.push(`for ${fallbackRecipes.join(', ')}`);
  }

  if (parts.length === 0) {
    return '';
  }

  return ` (${parts.join('; ')})`;
}

export function filterExportItems(
  items: ExportItem[],
  filter: ItemFilter,
): ExportItem[] {
  const pipeline = new RulePipeline<ExportItem>().use(
    new FilterExportItemsStep(filter),
  );
  return pipeline.execute(items);
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
    const sortStep = new GroupExportByAisleStep(activeLayout);
    const sortedBuy = sortStep.process(buyItems);

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
      text += `- ${checkMarker} ${qtyStr ? qtyStr + ' ' : ''}${itemStr}\n`;
      if (item.note?.sizeNote) {
        text += `  - Note: ${item.note.sizeNote}\n`;
      }
      (item.note?.ingredientNotes || []).forEach((n) => {
        if (n.recipe) {
          const abbrev = n.unit ? abbreviateUnit(n.unit) : '';
          const qtyPart =
            n.qty !== null && n.qty !== undefined
              ? `${n.qty} ${abbrev}`.trim() + ' '
              : '';
          const descPart = n.descriptor ? `[${n.descriptor}] ` : '';
          const altPart = n.altItem ? `(alt: ${n.altItem}) ` : '';
          text += `  - ${qtyPart}${descPart}${altPart}— ${n.recipe}\n`;
        }
      });
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
      text += `- ${checkMarker} ${qtyStr ? qtyStr + ' ' : ''}${itemStr}\n`;
      if (item.note?.sizeNote) {
        text += `  - Note: ${item.note.sizeNote}\n`;
      }
      (item.note?.ingredientNotes || []).forEach((n) => {
        if (n.recipe) {
          const abbrev = n.unit ? abbreviateUnit(n.unit) : '';
          const qtyPart =
            n.qty !== null && n.qty !== undefined
              ? `${n.qty} ${abbrev}`.trim() + ' '
              : '';
          const descPart = n.descriptor ? `[${n.descriptor}] ` : '';
          const altPart = n.altItem ? `(alt: ${n.altItem}) ` : '';
          text += `  - ${qtyPart}${descPart}${altPart}— ${n.recipe}\n`;
        }
      });
    }
  }

  return text.trim();
}
