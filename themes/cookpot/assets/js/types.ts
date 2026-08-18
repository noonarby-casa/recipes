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
  icon?: string;
  scale: number;
  date: string; // ISO 'YYYY-MM-DD' or 'supplemental'
  day?: string; // Legacy day string ('mon', 'tue', etc.) for migration fallback
  createdAt?: string; // ISO date string when created (useful for supplemental items)
  extraIngredients?: IngredientInput[];
}

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

  // Whether this alternate ingredient has been actively selected by the user.
  isSwapped?: boolean;
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
  // The shortId of the recipe this ingredient comes from.
  recipeShortId?: string;
  // The name of the recipe this ingredient comes from, populated in the
  // pipeline for combined shopping lists.
  recipe?: string;
}

export interface IngredientNote {
  recipe?: string;
  recipeShortId?: string;
  qty?: number | null;
  unit?: string;
  altItem?: string;
  descriptor?: string;
  isSwapped?: boolean;
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

export type UnitCategory = 'VOLUME' | 'WEIGHT' | 'PACKAGE' | 'COUNTABLE';

export type ItemCategory =
  | 'fresh-produce'
  | 'fresh-herbs'
  | 'tofu-tempeh'
  | 'poultry'
  | 'meat'
  | 'seafood'
  | 'milk-cream'
  | 'butter-cheese'
  | 'eggs'
  | 'deli'
  | 'bakery'
  | 'frozen'
  | 'pasta-grains'
  | 'canned-tomatoes'
  | 'canned-beans'
  | 'canned-other'
  | 'condiments'
  | 'baking'
  | 'oils-vinegars'
  | 'spices-seasonings'
  | 'snacks'
  | 'beverages'
  | 'other';

export interface ItemForm {
  singular: string;
  plural: string;
  aliases?: string[];
}

export interface UnitDefinition {
  singular: string;
  plural: string;
  category: UnitCategory;
  base?: string;
  factor?: number;
  aliases?: string[];
}

// An ItemRule matches an ingredient to a shopping item.
export interface ItemRule {
  // Canonical display name for items under this rule.
  canonicalName: string;
  // Store category for this item.
  category: ItemCategory;
  // Exact item names, plurals, and aliases matching this rule.
  items: (string | ItemForm)[];
  // Whether items under this rule are pantry staples.
  staple?: boolean;
  // Whether this item is a collection item that stays plural when measured by container/volume units.
  pluralByDefault?: boolean;
  // Item-specific unit conversions. Helps map between the amounts specified in
  // a recipe and the amounts you can purchase in a store.
  unitEquivalences?: Record<string, { base: string; factor: number }>;
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

export interface ParsedQty {
  qty: number | null;
  unit: string;
}

export interface TimerState {
  recipeTitle: string;
  recipeUrl: string;
  timerIndex: number;
  durationLabel: string;
  minSeconds: number;
  maxSeconds: number;
  startedAt: number | null;
  elapsedBeforeStart: number;
  status: 'running' | 'paused';
  lowerChimePlayed: boolean;
  upperChimePlayed: boolean;
  updatedAt?: number;
}

export interface FiltersState {
  searchQuery: string;
  favoritesOnly: boolean;
  includedTags: string[];
  excludedTags: string[];
  includedSources: string[];
  excludedSources: string[];
}

export interface PlannerState {
  plan: PlannedItem[];
  localPlan: PlannedItem[];
  sharedPlan: PlannedItem[];
  hasConflict: boolean;
  isPreviewing: boolean;
  previewMode: 'local' | 'shared';
  lastRemovedRecipe: PlannedItem | null;
  lastRemovedIndex: number | null;
}

export interface DateRange {
  startDate: string; // ISO 'YYYY-MM-DD'
  durationDays: number; // 1 to 21
}

export interface SettingsState {
  activeTab: 'edit' | 'view' | 'shop' | 'history';
  startDate: string; // ISO 'YYYY-MM-DD'
  durationDays: number; // 1 to 21
  workWeekOnly: boolean;
}

export type FontSizeOption = 'smaller' | 'default' | 'larger';

export interface StoreSection {
  id: string;
  name: string;
  order: number;
  categories: string[];
}

export interface StoreLayout {
  id: string;
  name: string;
  sections: StoreSection[];
  itemSizes?: Record<string, [number, string][]>;
}

export interface ValidationError {
  message: string;
  field?: string;
  severity: 'error' | 'warning';
}

export interface IngredientSection {
  category: string;
  items: IngredientInput[];
}
