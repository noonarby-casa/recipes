export interface StoreSection {
  id: string;
  name: string;
  order: number;
  keywords: string[];
}

export interface StoreLayout {
  id: string;
  name: string;
  sections: StoreSection[];
}

export const STANDARD_SECTIONS: StoreSection[] = [
  {
    id: 'produce',
    name: '🥬 Produce',
    order: 1,
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
      'pepper',
      'herb',
      'basil',
      'cilantro',
      'parsley',
      'rosemary',
      'thyme',
      'avocado',
      'banana',
      'apple',
      'berry',
      'raspberry',
      'blueberry',
      'strawberry',
      'parsley',
      'dill',
      'chives',
    ],
  },
  {
    id: 'bakery',
    name: '🍞 Bakery',
    order: 2,
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
    id: 'meat',
    name: '🥩 Meat & Seafood',
    order: 3,
    keywords: [
      'chicken',
      'beef',
      'pork',
      'sausage',
      'bacon',
      'turkey',
      'ground',
      'steak',
      'salmon',
      'shrimp',
      'fish',
      'meatball',
    ],
  },
  {
    id: 'dairy',
    name: '🧀 Dairy & Eggs',
    order: 4,
    keywords: [
      'milk',
      'cream',
      'butter',
      'cheese',
      'yogurt',
      'egg',
      'sour cream',
      'cream cheese',
      'ricotta',
      'mozzarella',
      'parmesan',
      'cheddar',
    ],
  },
  {
    id: 'deli',
    name: '🥪 Deli',
    order: 5,
    keywords: ['deli', 'hummus', 'pesto'],
  },
  {
    id: 'frozen',
    name: '❄️ Frozen',
    order: 6,
    keywords: ['frozen', 'ice cream'],
  },
  {
    id: 'pasta-grains',
    name: '🍝 Pasta & Grains',
    order: 7,
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
    ],
  },
  {
    id: 'canned',
    name: '🥫 Canned & Jarred',
    order: 8,
    keywords: [
      'can',
      'canned',
      'tomato paste',
      'tomato sauce',
      'beans',
      'chickpea',
      'coconut milk',
      'broth',
      'stock',
      'chickpeas',
      'soup',
    ],
  },
  {
    id: 'condiments',
    name: '🫙 Condiments & Sauces',
    order: 9,
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
    ],
  },
  {
    id: 'baking',
    name: '🧁 Baking',
    order: 10,
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
    ],
  },
  {
    id: 'oils',
    name: '🫒 Oils & Vinegars',
    order: 11,
    keywords: [
      'oil',
      'olive oil',
      'vegetable oil',
      'canola oil',
      'sesame oil',
      'coconut oil',
    ],
  },
  {
    id: 'spices',
    name: '🌶️ Spices & Seasonings',
    order: 12,
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
    ],
  },
  {
    id: 'snacks',
    name: '🍿 Snacks',
    order: 13,
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
    id: 'beverages',
    name: '🥤 Beverages',
    order: 14,
    keywords: ['water', 'juice', 'soda', 'wine', 'beer'],
  },
  {
    id: 'other',
    name: '📦 Other',
    order: 99,
    keywords: [],
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

export function getStoreSection(
  itemRestOrName: string,
  itemItem?: string,
): StoreSection {
  const layout = getActiveStoreLayout();
  const searchText = (itemItem || itemRestOrName).toLowerCase().trim();

  for (const section of layout.sections) {
    if (section.keywords.some((kw) => searchText.includes(kw))) {
      return section;
    }
  }

  // Fallback to "Other"
  return (
    layout.sections.find((s) => s.id === 'other') ||
    layout.sections[layout.sections.length - 1]
  );
}
