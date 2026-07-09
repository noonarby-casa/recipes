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
}

export const CATEGORY_KEYWORDS: { category: string; keywords: string[] }[] = [
  {
    category: 'fresh-herbs',
    keywords: [
      'herb',
      'basil',
      'cilantro',
      'parsley',
      'rosemary',
      'thyme',
      'dill',
      'chives',
      'mint',
      'oregano fresh',
      'fresh oregano',
    ],
  },
  {
    category: 'tofu-tempeh',
    keywords: ['tofu', 'tempeh'],
  },
  {
    category: 'fresh-produce',
    keywords: [
      'lettuce',
      'tomato',
      'onion',
      'garlic',
      'ginger',
      'lemon',
      'lime',
      'broccoli',
      'scallion',
      'green onion',
      'cabbage',
      'zucchini',
      'potato',
      'carrot',
      'celery',
      'mushroom',
      'bell pepper',
      'avocado',
      'banana',
      'apple',
      'berry',
      'raspberry',
      'blueberry',
      'strawberry',
      'spinach',
      'kale',
      'shallot',
      'squash',
      'cucumber',
      'cauliflower',
      'asparagus',
      'brussels sprout',
      'sweet potato',
      'corn',
      'aubergine',
      'eggplant',
    ],
  },
  {
    category: 'bakery',
    keywords: [
      'bread',
      'roll',
      'bun',
      'tortilla',
      'pita',
      'naan',
      'brioche',
      'bagel',
    ],
  },
  {
    category: 'poultry',
    keywords: ['chicken', 'turkey'],
  },
  {
    category: 'meat',
    keywords: [
      'beef',
      'pork',
      'sausage',
      'bacon',
      'ground',
      'steak',
      'meatball',
      'lamb',
    ],
  },
  {
    category: 'seafood',
    keywords: ['salmon', 'shrimp', 'fish', 'cod', 'halibut', 'trout', 'tuna'],
  },
  {
    category: 'milk-cream',
    keywords: [
      'milk',
      'cream',
      'heavy cream',
      'whipping cream',
      'half and half',
      'sour cream',
      'yogurt',
    ],
  },
  {
    category: 'butter-cheese',
    keywords: [
      'butter',
      'cheese',
      'ricotta',
      'mozzarella',
      'parmesan',
      'cheddar',
      'cream cheese',
      'feta',
      'goat cheese',
    ],
  },
  {
    category: 'eggs',
    keywords: ['egg', 'eggs'],
  },
  {
    category: 'deli',
    keywords: ['deli', 'hummus', 'pesto'],
  },
  {
    category: 'frozen',
    keywords: ['frozen', 'ice cream'],
  },
  {
    category: 'pasta-grains',
    keywords: [
      'pasta',
      'spaghetti',
      'penne',
      'fettuccine',
      'linguine',
      'noodle',
      'rice',
      'orzo',
      'couscous',
      'quinoa',
      'gnocchi',
      'lasagna',
      'macaroni',
      'panko',
      'barley',
      'farro',
      'oats',
      'oatmeal',
    ],
  },
  {
    category: 'canned-tomatoes',
    keywords: [
      'tomato paste',
      'tomato sauce',
      'crushed tomato',
      'diced tomato',
      'canned tomato',
      'fire roasted tomato',
    ],
  },
  {
    category: 'canned-beans',
    keywords: [
      'beans',
      'chickpea',
      'chickpeas',
      'black bean',
      'kidney bean',
      'cannellini bean',
      'pinto bean',
    ],
  },
  {
    category: 'canned-other',
    keywords: [
      'can',
      'canned',
      'coconut milk',
      'broth',
      'stock',
      'soup',
      'lentils canned',
    ],
  },
  {
    category: 'condiments',
    keywords: [
      'sauce',
      'soy sauce',
      'vinegar',
      'mustard',
      'ketchup',
      'mayo',
      'hot sauce',
      'sriracha',
      'tahini',
      'honey',
      'maple syrup',
      'jam',
      'jelly',
      'peanut butter',
      'almond butter',
      'salad dressing',
      'marinade',
    ],
  },
  {
    category: 'baking',
    keywords: [
      'flour',
      'sugar',
      'baking powder',
      'baking soda',
      'vanilla',
      'cornstarch',
      'yeast',
      'chocolate chip',
      'cocoa',
      'confectioners',
      'granulated sugar',
      'brown sugar',
      'baking',
    ],
  },
  {
    category: 'oils-vinegars',
    keywords: [
      'oil',
      'olive oil',
      'vegetable oil',
      'canola oil',
      'sesame oil',
      'coconut oil',
      'avocado oil',
    ],
  },
  {
    category: 'spices-seasonings',
    keywords: [
      'salt',
      'pepper',
      'paprika',
      'cumin',
      'oregano',
      'cinnamon',
      'nutmeg',
      'turmeric',
      'coriander',
      'cardamom',
      'cloves',
      'allspice',
      'chili powder',
      'cayenne',
      'garlic powder',
      'onion powder',
      'ginger powder',
      'red pepper flakes',
      'italian seasoning',
      'kosher salt',
      'seasoning',
    ],
  },
  {
    category: 'snacks',
    keywords: [
      'chip',
      'cracker',
      'pretzel',
      'nut',
      'almond',
      'peanut',
      'walnut',
      'pecan',
      'cashew',
    ],
  },
  {
    category: 'beverages',
    keywords: ['water', 'juice', 'soda', 'wine', 'beer', 'coffee', 'tea'],
  },
];

export function classifyItemToCategory(itemName: string): string {
  const lower = itemName.toLowerCase().trim();
  for (const group of CATEGORY_KEYWORDS) {
    if (group.keywords.some((kw) => lower.includes(kw))) {
      return group.category;
    }
  }
  return 'other';
}

export const STANDARD_SECTIONS: StoreSection[] = [
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
    categories: ['canned-tomatoes', 'canned-beans', 'canned-other'],
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
    categories: ['beverages'],
  },
  {
    id: 'other',
    name: '📦 Other',
    order: 99,
    categories: ['other'],
  },
];

// Alternate Layout: Dairy first (e.g. for grab-and-go dairy runs)
export const DAIRY_FIRST_SECTIONS: StoreSection[] = STANDARD_SECTIONS.map(
  (sec) => {
    let order = sec.order;
    if (sec.id === 'dairy') {
      order = 1;
    } else if (sec.id === 'produce') {
      order = 4;
    } // swap dairy and produce
    return { ...sec, order };
  },
);

// Alternate Layout: Meat first
export const MEAT_FIRST_SECTIONS: StoreSection[] = STANDARD_SECTIONS.map(
  (sec) => {
    let order = sec.order;
    if (sec.id === 'meat') {
      order = 1;
    } else if (sec.id === 'produce') {
      order = 3;
    } // swap meat and produce
    return { ...sec, order };
  },
);

export const STORE_LAYOUTS: StoreLayout[] = [
  {
    id: 'standard',
    name: 'Standard Layout (Produce First)',
    sections: STANDARD_SECTIONS,
  },
  {
    id: 'dairy-first',
    name: 'Dairy First Layout',
    sections: DAIRY_FIRST_SECTIONS,
  },
  {
    id: 'meat-first',
    name: 'Meat First Layout',
    sections: MEAT_FIRST_SECTIONS,
  },
];

export const STORAGE_KEY_STORE_LAYOUT = 'noonarby-store-layout';

export function getActiveStoreLayoutId(): string {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem(STORAGE_KEY_STORE_LAYOUT) || 'standard';
  }
  return 'standard';
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

export function getSectionForCategory(category: string): StoreSection {
  const layout = getActiveStoreLayout();
  const section = layout.sections.find((s) => s.categories.includes(category));
  if (section) {
    return section;
  }
  return (
    layout.sections.find((s) => s.id === 'other') ||
    layout.sections[layout.sections.length - 1]
  );
}

export function getStoreSection(
  itemRestOrName: string,
  itemItem?: string,
): StoreSection {
  const category = classifyItemToCategory(itemItem || itemRestOrName);
  return getSectionForCategory(category);
}
