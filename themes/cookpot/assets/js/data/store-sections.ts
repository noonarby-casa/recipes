import categoryKeywordsJson from '../../data/category-keywords.json';
import usGrocerySizes from '../../data/stores/us-grocery.json';
import type { ShoppingItem, StoreLayout, StoreSection } from '../types';

export const CATEGORY_KEYWORDS: { category: string; keywords: string[] }[] =
  categoryKeywordsJson;

import { ITEM_RULES } from './rules';
import { singularizeWord, pluralizeWord } from '../units';

export function classifyItemToCategory(itemName: string): string {
  const lower = itemName.toLowerCase().trim();
  const sing = singularizeWord(lower);
  const plur = pluralizeWord(lower);

  const rule = ITEM_RULES.find(
    (r) =>
      r.canonicalName.toLowerCase() === lower ||
      r.canonicalName.toLowerCase() === sing ||
      r.items.some((item) => {
        if (typeof item === 'string') {
          const itemLower = item.toLowerCase();
          return (
            itemLower === lower || itemLower === sing || itemLower === plur
          );
        }
        const s = item.singular.toLowerCase();
        const p = item.plural.toLowerCase();
        return (
          s === lower ||
          p === lower ||
          s === sing ||
          p === plur ||
          item.aliases?.some(
            (a) => a.toLowerCase() === lower || a.toLowerCase() === sing,
          )
        );
      }),
  );
  if (rule) {
    return rule.category;
  }
  return 'other';
}

const STANDARD_SECTIONS: StoreSection[] = [
  {
    id: 'produce',
    name: '🥬 Produce',
    order: 1,
    categories: ['fresh-produce', 'fresh-herbs', 'tofu-tempeh'],
  },
  {
    id: 'bakery',
    name: '🍞 Bakery',
    order: 2,
    categories: ['bakery'],
  },
  {
    id: 'meat',
    name: '🥩 Meat & Seafood',
    order: 3,
    categories: ['poultry', 'meat', 'seafood'],
  },
  {
    id: 'dairy',
    name: '🧀 Dairy & Eggs',
    order: 4,
    categories: ['milk-cream', 'butter-cheese', 'eggs'],
  },
  {
    id: 'deli',
    name: '🥪 Deli',
    order: 5,
    categories: ['deli'],
  },
  {
    id: 'frozen',
    name: '❄️ Frozen',
    order: 6,
    categories: ['frozen'],
  },
  {
    id: 'pasta-grains',
    name: '🍝 Pasta & Grains',
    order: 7,
    categories: ['pasta-grains'],
  },
  {
    id: 'canned',
    name: '🥫 Canned & Jarred',
    order: 8,
    categories: [
      'canned-tomatoes',
      'canned-beans',
      'canned-fruit',
      'canned-other',
    ],
  },
  {
    id: 'condiments',
    name: '🫙 Condiments & Sauces',
    order: 9,
    categories: ['condiments'],
  },
  {
    id: 'baking',
    name: '🧁 Baking',
    order: 10,
    categories: ['baking'],
  },
  {
    id: 'oils',
    name: '🫒 Oils & Vinegars',
    order: 11,
    categories: ['oils-vinegars'],
  },
  {
    id: 'spices',
    name: '🌶️ Spices & Seasonings',
    order: 12,
    categories: ['spices-seasonings'],
  },
  {
    id: 'snacks',
    name: '🍿 Snacks',
    order: 13,
    categories: ['snacks'],
  },
  {
    id: 'beverages',
    name: '🥤 Beverages',
    order: 14,
    categories: ['beverages', 'alcohol', 'coffee-tea'],
  },
  {
    id: 'other',
    name: '📦 Other',
    order: 99,
    categories: ['other', 'household-paper'],
  },
];

const MARKET_BASKET_PNH_SECTIONS: StoreSection[] = [
  {
    id: 'left-wall',
    name: '🧀 Left Wall: Dairy & Cheese',
    order: 1,
    categories: ['milk-cream', 'butter-cheese', 'eggs'],
  },
  {
    id: 'deli-seafood',
    name: '🥪 Back Left: Deli & Seafood',
    order: 2,
    categories: ['deli', 'seafood'],
  },
  {
    id: 'aisle-1',
    name: '🥓 Aisle 1: Breakfast Meats',
    order: 3,
    categories: [],
  },
  {
    id: 'aisle-2',
    name: '🫙 Aisle 2: Condiments, Oils & Ethnic Foods',
    order: 4,
    categories: ['condiments', 'oils-vinegars'],
  },
  {
    id: 'aisle-3',
    name: '🥣 Aisle 3: Cereal & Breakfast',
    order: 5,
    categories: [],
  },
  {
    id: 'aisle-4',
    name: '🍝 Aisle 4: Pasta, Sauce, Soup & Tomatoes',
    order: 6,
    categories: ['pasta-grains', 'canned-tomatoes'],
  },
  {
    id: 'aisle-5',
    name: '☕ Aisle 5: Coffee, Tea, Baking & Spices',
    order: 7,
    categories: ['baking', 'spices-seasonings'],
  },
  {
    id: 'aisle-6',
    name: '🥫 Aisle 6: Canned Vegetables & Beans',
    order: 8,
    categories: ['canned-beans', 'canned-other'],
  },
  {
    id: 'aisle-7',
    name: '🍿 Aisle 7: Snacks & Soda',
    order: 9,
    categories: ['snacks'],
  },
  {
    id: 'back-wall',
    name: '🥩 Back Wall: Fresh Meat & Poultry',
    order: 10,
    categories: ['meat', 'poultry'],
  },
  {
    id: 'aisle-8',
    name: '💊 Aisle 8: Health & Personal Care',
    order: 11,
    categories: [],
  },
  {
    id: 'aisle-9',
    name: '🧻 Aisle 9: Paper Goods & Stationary',
    order: 12,
    categories: [],
  },
  {
    id: 'aisle-10',
    name: '🧹 Aisle 10: Cleaning & Household',
    order: 13,
    categories: [],
  },
  {
    id: 'aisle-11',
    name: '🐾 Aisle 11: Pet Needs, Foils & Storage',
    order: 14,
    categories: ['household-paper'],
  },
  {
    id: 'aisle-12',
    name: '🥤 Aisle 12: Water, Seltzer & Beverages',
    order: 15,
    categories: ['beverages', 'alcohol'],
  },
  {
    id: 'aisle-13',
    name: '🍷 Aisle 13: Wine, Beer & Spirits',
    order: 16,
    categories: [],
  },
  {
    id: 'aisle-14',
    name: '🍞 Aisle 14: Bread, Rolls & Spreads',
    order: 17,
    categories: ['bread-spreads'],
  },
  {
    id: 'aisle-15',
    name: '❄️ Aisle 15: Frozen Entrees, Pizza & Veggies',
    order: 18,
    categories: ['frozen'],
  },
  {
    id: 'aisle-16',
    name: '🥬 Aisle 16: Produce, Herbs, Tofu & Nuts',
    order: 19,
    categories: ['fresh-produce', 'fresh-herbs', 'tofu-tempeh'],
  },
  {
    id: 'front-bakery',
    name: '🎂 Front Right: Bakery & Ice',
    order: 20,
    categories: ['bakery'],
  },
  {
    id: 'other',
    name: '📦 Other',
    order: 99,
    categories: ['other'],
  },
];

// Alternate Layout: Dairy first (e.g. for grab-and-go dairy runs)
const DAIRY_FIRST_SECTIONS: StoreSection[] = STANDARD_SECTIONS.map((sec) => {
  let order = sec.order;
  if (sec.id === 'dairy') {
    order = 1;
  } else if (sec.id === 'produce') {
    order = 4;
  } // swap dairy and produce
  return { ...sec, order };
});

// Alternate Layout: Meat first
const MEAT_FIRST_SECTIONS: StoreSection[] = STANDARD_SECTIONS.map((sec) => {
  let order = sec.order;
  if (sec.id === 'meat') {
    order = 1;
  } else if (sec.id === 'produce') {
    order = 3;
  } // swap meat and produce
  return { ...sec, order };
});

export const STORE_LAYOUTS: StoreLayout[] = [
  {
    id: 'market-basket-pnh',
    name: 'Market Basket PNH',
    sections: MARKET_BASKET_PNH_SECTIONS,
    itemSizes: usGrocerySizes as unknown as Record<string, [number, string][]>,
  },
  {
    id: 'standard',
    name: 'Standard Layout (Produce First)',
    sections: STANDARD_SECTIONS,
    itemSizes: usGrocerySizes as unknown as Record<string, [number, string][]>,
  },
  {
    id: 'dairy-first',
    name: 'Dairy First Layout',
    sections: DAIRY_FIRST_SECTIONS,
    itemSizes: usGrocerySizes as unknown as Record<string, [number, string][]>,
  },
  {
    id: 'meat-first',
    name: 'Meat First Layout',
    sections: MEAT_FIRST_SECTIONS,
    itemSizes: usGrocerySizes as unknown as Record<string, [number, string][]>,
  },
];

const STORAGE_KEY_STORE_LAYOUT = 'noonarby-store-layout';

export function getActiveStoreLayoutId(): string {
  if (typeof window !== 'undefined' && window.localStorage) {
    return (
      localStorage.getItem(STORAGE_KEY_STORE_LAYOUT) || 'market-basket-pnh'
    );
  }
  return 'market-basket-pnh';
}

export function setActiveStoreLayoutId(id: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(STORAGE_KEY_STORE_LAYOUT, id);
  }
}

export function getActiveStoreLayout(): StoreLayout {
  const activeId = getActiveStoreLayoutId();
  return STORE_LAYOUTS.find((l) => l.id === activeId) || STORE_LAYOUTS[0];
}

export function getSectionForCategory(
  category: string,
  layout?: StoreLayout,
): StoreSection {
  const activeLayout = layout || getActiveStoreLayout();
  const section = activeLayout.sections.find((s) =>
    s.categories.includes(category),
  );
  if (section) {
    return section;
  }
  return (
    activeLayout.sections.find((s) => s.id === 'other') ||
    activeLayout.sections[activeLayout.sections.length - 1]
  );
}

export function compareShoppingItems(
  a: ShoppingItem,
  b: ShoppingItem,
  layout?: StoreLayout,
): number {
  const secA = getSectionForCategory(a.category, layout);
  const secB = getSectionForCategory(b.category, layout);
  const orderA = secA?.order ?? 999;
  const orderB = secB?.order ?? 999;
  if (orderA !== orderB) {
    return orderA - orderB;
  }
  const idxA = secA ? secA.categories.indexOf(a.category) : -1;
  const idxB = secB ? secB.categories.indexOf(b.category) : -1;
  const catOrderA = idxA !== -1 ? idxA : 999;
  const catOrderB = idxB !== -1 ? idxB : 999;
  if (catOrderA !== catOrderB) {
    return catOrderA - catOrderB;
  }
  return a.item.localeCompare(b.item);
}
