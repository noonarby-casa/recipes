/** A quantity value: either a scalar or a [min, max] range tuple. */
export type QtyValue = number | [number, number];

/** Alternate structure: handles secondary measurements AND alternative ingredients. */
export interface IngredientInputAlt {
  qty?: QtyValue;
  unit?: string;
  each?: boolean;
  item?: string;
  desc?: string;
  prep?: string;
}

/** Fully structured recipe ingredient — no runtime parsing needed. */
export interface IngredientInput {
  qty?: QtyValue;
  unit?: string;
  item: string;
  desc?: string;
  prep?: string;
  optional?: boolean;
  alt?: IngredientInputAlt;
  category?: string; // added dynamically by meal planner to track recipe attribution
}

export interface ShoppingItemNote {
  recipe: string;
  altItem?: string;
}

export interface ShoppingItem {
  qty: number | null;
  unit: string;
  item: string; // Made required since we always merge by item
  rest: string; // The display name
  notes: ShoppingItemNote[];
  isStaple: boolean;
  optional?: boolean;
  section?: string;
  sizeNote?: string;
}

export interface ItemRule {
  /** Exact item name(s) this rule applies to. */
  items: string[];
  /** Available package sizes at the store, ordered small → large. */
  itemSizes?: [number, string][];
  /** Item-specific unit conversions. */
  unitEquivalences?: Record<string, { base: string; factor: number }>;
}

export interface ProcessedShoppingList {
  buyItems: ShoppingItem[];
  optionalItems: ShoppingItem[];
  stapleItems: ShoppingItem[];
}
