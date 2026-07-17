/** A quantity value: either a scalar or a [min, max] range tuple. */
export type QtyValue = number | [number, number];

/** Alternate structure: handles secondary measurements AND alternative ingredients. */
export interface IngredientInputAlt {
  // An alternate quantity for the ingredient, usually expressed with an
  // alternate unit.
  qty?: QtyValue;
  // Alternate unit for the ingredient, e.g. 'oz' in "1 can (15 oz) chickpeas"
  unit?: string;
  // Whether the quantitiy applies to individual items for a count or not, e.g.
  // '2 packages (3 oz each) ramen noodles'.
  each?: boolean;

  // If an ingredient can be substituted with another, this item provides that
  // other option, e.g. 'Sriracha or hot chili sauce'
  item?: string;

  // If an ingredient can be described multiple ways, this desc provides the
  // alternate, e.g. 'fresh' or 'freeze-dried' scallions.
  desc?: string;

  // If an ingredient can be prepared multiple ways, this prep provides the
  // alternate, e.g. 'fresh baby spinach' or 'spinach, chopped'.
  prep?: string;
}

/** Fully structured recipe ingredient — no runtime parsing needed. */
export interface IngredientInput {
  // Numeric value or range for the ingredient.
  qty?: QtyValue;
  // Unit of the ingredient.
  unit?: string;
  // Base name of the ingredient.
  item: string;
  // Description, prepended to the item
  desc?: string;
  // Preparation details, appended to the item with ', '.
  prep?: string;
  // Whether the ingredient is optional for the recipe.
  optional?: boolean;
  // Alternate information about the ingredient.
  alt?: IngredientInputAlt;
  // The name of the recipe this ingreident comes from, populated in the
  // pipeline for combined shopping lists.
  recipe?: string;
}

export interface IngredientNote {
  recipe?: string;
  altItem?: string;
  descriptor?: string;
}

export interface ShoppingItemNote {
  ingredientNotes: IngredientNote[];
  sizeNote?: string;
}

// A ShoppingItem represents a purchasable item in a grocery store.
export interface ShoppingItem {
  // Numeric value of the shoping item. At this point it's not a range, since
  // the pipeline determines the exact numeric amount needed.
  qty: number | null;
  // Unit of the shopping item (e.g. the type of purchasable unit: can, package,
  // box, etc.)
  unit: string;
  // Base name of the shopping item.
  item: string;
  // The detailed category this shopping item belongs to, used to sort the
  // shopping list, e.g. 'fresh-produce'.
  category: string;
  // Whether the item is a "Pantry Staple". Pantry staples don't usually need to
  // be purchased each time a recipe is cooked; these items are on hand.
  // However, a staple may need to be purchased when running low.
  // - 'in-pantry' = the staple is stocked
  // - undefined = the shopping item is not a pantry staple
  staple?: 'in-pantry';
  // Structured notes for the item to provide additional information about it in
  // the shopping list.
  note?: ShoppingItemNote;
}

// An ItemRule matches an ingredient to a shopping item.
export interface ItemRule {
  // Exact item name(s) this rule applies to.
  items: string[];
  // Canonical display name if items under this rule should be merged into a single name.
  canonicalName?: string;
  // Item-specific unit conversions. Helps map between the amounts specified in
  // a recipe and the amounts you can purchase in a store.
  unitEquivalences?: Record<string, { base: string; factor: number }>;
  // Default quantity to assume when an ingredient of this item has no quantity.
  defaultQty?: number;
}

// The output of the pipeline, containing categorized shopping items
// corresponding to all of the ingredient inputs.
export interface ProcessedShoppingList {
  // Items and pantry staples that need to be bought.
  buyItems: ShoppingItem[];
  // Optional items.
  optionalItems: ShoppingItem[];
  // Items that are pantry staples and are in stock. Staples that are out of
  // stock appear in the `buyItems` list.
  stapleItems: ShoppingItem[];
}
