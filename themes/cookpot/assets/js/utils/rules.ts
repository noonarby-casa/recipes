import type { ItemRule, ItemForm } from '../types';
import { ITEM_RULES } from '../data/rules';

/**
 * Finds the matching ItemRule for a given item name by checking its
 * canonicalName, singular, plural, and alias names.
 */
export function findItemRule(itemName: string): ItemRule | undefined {
  const lower = itemName.toLowerCase().trim();
  return ITEM_RULES.find(
    (rule) =>
      rule.canonicalName.toLowerCase() === lower ||
      rule.items.some((item: ItemForm | string) => {
        if (typeof item === 'string') {
          return item.toLowerCase() === lower;
        }
        return (
          item.singular.toLowerCase() === lower ||
          item.plural.toLowerCase() === lower ||
          item.aliases?.some((alias) => alias.toLowerCase() === lower)
        );
      }),
  );
}

/**
 * Resolves a given ingredient item name to its canonical name from the rule database.
 * Falls back to the trimmed lowercase original name if no matching rule is found.
 */
export function getCanonicalName(itemName: string): string {
  const lower = itemName.toLowerCase().trim();
  const rule = findItemRule(lower);
  return rule ? rule.canonicalName : lower;
}

/**
 * Returns canonical key and display name info for grouping ingredients.
 */
export function getItemCanonicalInfo(itemName: string): {
  key: string;
  name: string;
} {
  const lower = itemName.toLowerCase().trim();
  const rule = findItemRule(lower);
  if (rule?.canonicalName) {
    return { key: rule.canonicalName.toLowerCase(), name: rule.canonicalName };
  }
  return { key: lower, name: itemName };
}
