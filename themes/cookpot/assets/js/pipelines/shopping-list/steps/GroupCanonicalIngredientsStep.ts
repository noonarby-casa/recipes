import type { RuleStep } from '../../core/RulePipeline';
import type { IngredientInput } from '../../../types';
import { getItemCanonicalInfo } from '../utils';

export interface IngredientGroup {
  key: string;
  name: string;
  ingredients: IngredientInput[];
  optional: boolean;
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
