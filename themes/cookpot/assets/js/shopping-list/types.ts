/**
 * Configuration options for text matching. All pattern strings (terms, excludeIf, keepIf)
 * MUST be defined in lowercase.
 */
export interface StringMatchConfig {
  terms: string | string[];
  excludeIf?: string[];
  keepIf?: string[];
}

export interface IngredientMatchConfig {
  rest?: StringMatchConfig;
  prep?: StringMatchConfig;
  unit?: StringMatchConfig;
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
  notes: Record<string, NoteItem[]>;
  note: NoteItem[];
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

export interface ConversionOutput {
  qty?: number;
  unit?: string;
  rest?: string;
}

export interface NoteOutput {
  explanation?: string;
  defaultUnit?: string;
}

export interface ConversionProps {
  // Matching criteria:
  units?: string | string[];
  matchPattern?: StringMatchConfig;

  // Conversion properties:
  unitMultiplier?: number | Record<string, number>;
  packageSizes?: [number, string][];
  output?: ConversionOutput;
  note?: NoteOutput;
  partName?: string;
}

export interface RuleConfig {
  name: string;
  match: IngredientMatchConfig;
  groupKey?: string;
  isStaple?: boolean | ((qty: number | null, unit: string) => boolean);
  conversions: ConversionProps[];
}
