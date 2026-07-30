import type { RuleStep } from '../RulePipeline';
import type { IngredientInput, ItemRule } from '../../types';
import { ITEM_RULES } from '../../data/rules';

export interface IngredientGroup {
  key: string;
  name: string;
  ingredients: IngredientInput[];
  optional: boolean;
}

function getRuleForItem(itemName: string): ItemRule | undefined {
  const lower = itemName.toLowerCase().trim();
  return ITEM_RULES.find(
    (rule) =>
      rule.canonicalName.toLowerCase() === lower ||
      rule.items.some((item) =>
        typeof item === 'string'
          ? item.toLowerCase() === lower
          : item.singular.toLowerCase() === lower ||
            item.plural.toLowerCase() === lower ||
            item.aliases?.some((a) => a.toLowerCase() === lower),
      ),
  );
}

function getItemCanonicalInfo(itemName: string): { key: string; name: string } {
  const lower = itemName.toLowerCase().trim();
  const rule = getRuleForItem(lower);
  if (rule?.canonicalName) {
    return { key: rule.canonicalName.toLowerCase(), name: rule.canonicalName };
  }
  return { key: lower, name: itemName };
}

export class GroupCanonicalIngredientsStep implements RuleStep<IngredientInput> {
  readonly name = 'GroupCanonicalIngredientsStep';

  group(ingredients: IngredientInput[]): IngredientGroup[] {
    const groupsMap = new Map<string, IngredientGroup>();

    for (const ing of ingredients) {
      const itemName = ing.item.toLowerCase().trim();
      const info = getItemCanonicalInfo(itemName);
      let existing = groupsMap.get(info.key);
      if (!existing) {
        existing = {
          key: info.key,
          name: info.name,
          ingredients: [],
          optional: true,
        };
        groupsMap.set(info.key, existing);
      }
      existing.ingredients.push(ing);
      if (!ing.optional) {
        existing.optional = false;
      }
    }

    return Array.from(groupsMap.values());
  }

  process(items: IngredientInput[]): IngredientInput[] {
    return items;
  }
}
