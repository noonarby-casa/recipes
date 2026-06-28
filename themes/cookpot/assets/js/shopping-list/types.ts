/**
 * Configuration options for text matching. All pattern strings (match, excludeIf, keepIf)
 * MUST be defined in lowercase.
 */
export interface StringMatchConfig {
  match: string | string[];
  excludeIf?: string[];
  keepIf?: string[];
}

export interface BaseIngredient {
  rest: string;
  prep: string;
}

export interface ScalableIngredient extends BaseIngredient {
  isScalable: true;
  scaledQty: number;
  unit: string;
}

export interface FixedIngredient extends BaseIngredient {
  isScalable: false;
}

export type Ingredient = ScalableIngredient | FixedIngredient;

export interface ConverterContext {
  scaledQty: number;
  unit: string;
  unitLower: string;
  rest: string;
  restLower: string;
  prep: string;
  prepLower: string;
  isStaple: boolean;
}

export interface ShoppingItem {
  qty: number | null;
  unit: string;
  rest: string;
  notes?: Record<string, NoteItem[]>;
  note?: NoteItem[];
  isStaple: boolean;
  parts?: { [partName: string]: number };
}

export interface NoteItem {
  prefix: string;
  qty: number | null;
  unit: string;
  rest: string;
  explanation: string;
}

export interface CleanedPrepResult {
  rest: string;
  prep: string;
}

export interface ProcessedShoppingList {
  buyItems: ShoppingItem[];
  stapleItems: ShoppingItem[];
}
