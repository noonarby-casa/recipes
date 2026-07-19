import type { IngredientInput } from './shopping-list/types';

export interface Recipe {
  title: string;
  permalink: string;
  shortId?: string;
  date: string;
  times: { step: string; time: string }[];
  recipeSource?: string;
  tags?: string[];
  ingredients: (string | IngredientInput)[];
  servings: number;
  summary: string;
  image90?: string;
  image130?: string;
  image180?: string;
  image260?: string;
  dateHuman?: string;
  dateMachine?: string;
}

export interface PlannedItem {
  instanceId: string;
  permalink?: string;
  customTitle?: string;
  scale: number;
  day: string; // 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', or 'supplemental'
  extraIngredients?: IngredientInput[];
}
