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

export interface QuantitySegment {
  quantity: number;
  unit: string;
  text: string;
}

export interface Ingredient {
  quantity: number | null;
  unit: string;
  item: string;
  rest: string;
  prep: string;
  optional: boolean;
  secondarySegments: QuantitySegment[];
  category: string | null;
  sizeNote?: string; // For parenthetical size descriptors
}

export interface ConverterContext {
  scaledQty: number;
  unit: string;
  unitLower: string;
  item: string;
  itemLower: string;
  rest: string;
  restLower: string;
  prep: string;
  prepLower: string;
  isStaple: boolean;
  optional: boolean;
}

export interface ShoppingItem {
  qty: number | null;
  unit: string;
  item?: string;
  rest: string;
  notes: Record<string, NoteItem[]>;
  note: NoteItem[];
  isStaple: boolean;
  parts?: { [partName: string]: number };
  optional?: boolean;
  section?: string;
  sizeNote?: string;
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
  optionalItems: ShoppingItem[];
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
