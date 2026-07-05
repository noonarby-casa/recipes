import { StringMatchConfig, RuleConfig } from "./types";

export const STAPLES: StringMatchConfig[] = [
  { terms: "salt" },
  {
    terms: "pepper",
    excludeIf: [
      "bell",
      "jalapeno",
      "serrano",
      "habanero",
      "poblano",
      "banana",
      "chili",
      "chilli",
      "red",
      "green",
      "yellow",
      "orange",
      "roasted",
      "sweet",
    ],
    keepIf: ["powder", "flakes", "ground", "cayenne"],
  },
  { terms: "olive oil" },
  { terms: "vegetable oil" },
  { terms: "canola oil" },
  { terms: "cooking spray" },
  { terms: "sugar" },
  { terms: "flour" },
  { terms: "baking powder" },
  { terms: "baking soda" },
  { terms: "vanilla extract" },
  { terms: "cornstarch" },
  { terms: "yeast" },
  { terms: "paprika" },
  { terms: "cumin" },
  { terms: "garlic powder" },
  { terms: "onion powder" },
  { terms: "oregano" },
  { terms: "thyme" },
  { terms: "rosemary" },
  { terms: "cayenne" },
  { terms: "chili powder" },
  { terms: "cinnamon" },
  { terms: "nutmeg" },
  { terms: "ginger powder" },
  { terms: "ground ginger" },
  { terms: "turmeric" },
  { terms: "coriander" },
  { terms: "cardamom" },
  { terms: "cloves powder" },
  { terms: "allspice" },
  { terms: "mustard powder" },
  { terms: "parsley" },
  { terms: "basil" },
  {
    terms: "sage",
    excludeIf: ["sausage"],
  },
  {
    terms: "lemon juice",
    excludeIf: ["fresh", "squeezed"],
  },
  {
    terms: "lime juice",
    excludeIf: ["fresh", "squeezed"],
  },
  { terms: "water" },
];

export const VOLUME_UNITS: string[] = [
  "cup",
  "cups",
  "tablespoon",
  "tablespoons",
  "tbsp",
  "teaspoon",
  "teaspoons",
  "tsp",
  "ounce",
  "ounces",
  "oz",
  "ml",
];

export const OTHER_UNITS: string[] = [
  "pound",
  "pounds",
  "lb",
  "lbs",
  "clove",
  "cloves",
  "can",
  "cans",
  "gram",
  "grams",
  "g",
  "small",
  "large",
  "medium",
  "head",
  "heads",
  "bulb",
  "bulbs",
  "package",
  "packages",
  "container",
  "containers",
];

export const TO_TEASPOONS: Record<string, number> = {
  teaspoon: 1,
  tsp: 1,
  tablespoon: 3,
  tbsp: 3,
  ounce: 6,
  oz: 6,
  cup: 48,
  ml: 0.202884,
};

export const PREP_KEYWORDS: string[] = [
  "minced",
  "diced",
  "chopped",
  "sliced",
  "grated",
  "crushed",
  "shredded",
  "toasted",
  "melted",
  "softened",
  "beaten",
  "mashed",
  "julienned",
  "drained",
  "wedge",
  "wedges",
  "divided",
  "grate",
  "thinly",
  "finely",
  "coarsely",
  "room temperature",
  "finely crushed",
];

export const SKIP_TERMS: string[] = [
  "pasta water",
  "cooking water",
  "reserved water",
];

export const VOLUME_TO_PACKAGE_MAPPINGS: [string[], string][] = [
  [
    [
      "paste",
      "sauce",
      "jam",
      "jelly",
      "spread",
      "mayo",
      "mustard",
      "curry",
      "pesto",
      "tahini",
      "jar",
    ],
    "jar",
  ],
  [
    [
      "aminos",
      "oil",
      "vinegar",
      "syrup",
      "honey",
      "juice",
      "extract",
      "liquid",
      "bottle",
    ],
    "bottle",
  ],
  [["crumb", "cracker"], "box"],
  [
    [
      "flour",
      "sugar",
      "chip",
      "seed",
      "nut",
      "rice",
      "pasta",
      "noodle",
      "oat",
      "meal",
      "powder",
      "bag",
      "box",
    ],
    "package",
  ],
  [
    ["cream", "sour cream", "yogurt", "cheese", "tub", "container"],
    "container",
  ],
];

export const RULE_CONFIGS: RuleConfig[] = [
  // 1. Minced Garlic (Staple, isolated key)
  {
    name: "minced garlic",
    match: {
      rest: { terms: "garlic", excludeIf: ["powder", "salt"] },
      prep: { terms: "minced" },
    },
    isStaple: true,
    conversions: [
      {
        output: {
          rest: "minced garlic",
        },
      },
    ],
  },

  // 2. Whole Garlic Heads / Bulbs (Pass-through)
  {
    name: "garlic head",
    match: {
      rest: { terms: "garlic", excludeIf: ["powder", "salt"] },
      unit: { terms: ["head", "bulb"] },
    },
    isStaple: false,
    conversions: [
      {
        unitMultiplier: 1,
        output: {
          unit: "head",
          rest: "garlic",
        },
      },
    ],
  },

  // 3. Garlic Cloves (Convert to heads)
  {
    name: "garlic cloves",
    match: {
      rest: { terms: "garlic", excludeIf: ["powder", "salt"] },
    },
    isStaple: false,
    conversions: [
      {
        units: "clove",
        unitMultiplier: 1 / 10,
        output: {
          unit: "head",
          rest: "garlic",
        },
      },
    ],
  },

  // 4. Butter (Convert volume/weights to sticks, conditional staple status)
  {
    name: "butter",
    match: {
      rest: {
        terms: "butter",
        excludeIf: [
          "peanut",
          "almond",
          "beans",
          "milk",
          "squash",
          "butternut",
          "lettuce",
          "pickles",
        ],
      },
    },
    isStaple: (qty, unit) => {
      if (unit === "stick" || unit === "sticks") {
        return qty !== null && qty < 4;
      }
      return true;
    },
    conversions: [
      {
        units: [
          "tablespoon",
          "tbsp",
          "teaspoon",
          "tsp",
          "pound",
          "lb",
          "ounce",
          "oz",
          "cup",
        ],
        unitMultiplier: {
          tablespoon: 1 / 8,
          tbsp: 1 / 8,
          teaspoon: 1 / 24,
          tsp: 1 / 24,
          pound: 4,
          lb: 4,
          ounce: 1 / 4,
          oz: 1 / 4,
          cup: 2,
        },
        output: { unit: "stick", rest: "butter" },
      },
    ],
  },

  // 5. Egg Yolks (Convert to whole eggs)
  {
    name: "egg yolks",
    match: { rest: { terms: "egg yolk" } },
    isStaple: false,
    conversions: [
      {
        unitMultiplier: 1,
        output: {
          unit: "egg",
          rest: "egg",
        },
        note: {
          defaultUnit: "large",
        },
      },
    ],
  },

  // 6. Lemons
  {
    name: "lemon",
    match: {
      rest: { terms: "lemon", excludeIf: ["extract", "grass", "pepper"] },
    },
    groupKey: "_lemons",
    conversions: [
      {
        matchPattern: { terms: "zest" },
        unitMultiplier: {
          tablespoon: 1,
          tbsp: 1,
          teaspoon: 1 / 3,
          tsp: 1 / 3,
        },
        output: {
          unit: "",
          rest: "lemon",
        },
        note: {
          defaultUnit: "tablespoon",
        },
        partName: "zest",
      },
      {
        units: "*volume*",
        unitMultiplier: {
          cup: 16 / 3,
          teaspoon: 1 / 9,
          tsp: 1 / 9,
          ounce: 2 / 3,
          oz: 2 / 3,
          ml: 0.067 / 3,
          default: 1 / 3,
        },
        output: {
          unit: "",
          rest: "lemon",
        },
        note: {
          explanation: "1 lemon = ~3 tbsp juice",
          defaultUnit: "cup",
        },
        partName: "juice",
      },
      {
        units: "lemon",
        unitMultiplier: 1,
        output: {
          unit: "",
        },
      },
    ],
  },

  // 7. Limes
  {
    name: "lime",
    match: {
      rest: { terms: "lime", excludeIf: ["leaf", "leaves", "extract"] },
    },
    groupKey: "_limes",
    conversions: [
      {
        matchPattern: { terms: "zest" },
        unitMultiplier: {
          tablespoon: 1,
          tbsp: 1,
          teaspoon: 1 / 3,
          tsp: 1 / 3,
        },
        output: {
          unit: "",
          rest: "lime",
        },
        note: {
          defaultUnit: "tablespoon",
        },
        partName: "zest",
      },
      {
        units: "*volume*",
        unitMultiplier: {
          cup: 16 / 2,
          teaspoon: 1 / 6,
          tsp: 1 / 6,
          ounce: 2 / 2,
          oz: 2 / 2,
          ml: 0.067 / 2,
          default: 1 / 2,
        },
        output: {
          unit: "",
          rest: "lime",
        },
        note: {
          explanation: "1 lime = ~2 tbsp juice",
          defaultUnit: "cup",
        },
        partName: "juice",
      },
      {
        units: "lime",
        unitMultiplier: 1,
        output: {
          unit: "",
        },
      },
    ],
  },

  // 8. Half-Pint Liquids
  {
    name: "half-pint liquids",
    match: { rest: { terms: ["sour cream", "ricotta"] } },
    conversions: [
      {
        units: "cup",
        packageSizes: [
          [1, "half-pint (8 oz)"],
          [2, "pint (16 oz)"],
          [4, "quart (32 oz)"],
        ],
      },
    ],
  },

  // 9. Pint-Minimum Liquids
  {
    name: "pint-minimum liquids",
    match: {
      rest: {
        terms: [
          "broth",
          "stock",
          "milk",
          "heavy cream",
          "whipping cream",
          "yogurt",
        ],
      },
    },
    conversions: [
      {
        units: "cup",
        packageSizes: [
          [2, "pint (16 fl oz)"],
          [4, "quart (32 fl oz)"],
        ],
      },
    ],
  },

  // 10. Ginger
  {
    name: "ginger",
    match: {
      rest: {
        terms: "ginger",
        excludeIf: ["powder", "ground", "dry", "dried"],
      },
    },
    conversions: [
      {
        units: [
          "teaspoon",
          "tsp",
          "tablespoon",
          "tbsp",
          "inch",
          "piece",
          "knob",
          "ounce",
          "oz",
        ],
        unitMultiplier: 1,
        output: {
          qty: 1,
          unit: "root",
          rest: "ginger",
        },
      },
    ],
  },

  // 11. Onion
  {
    name: "onion",
    match: {
      rest: {
        terms: "onion",
        excludeIf: ["powder", "salt", "green", "spring", "pearl"],
      },
    },
    conversions: [
      {
        units: "cup",
        unitMultiplier: 1,
        output: {
          unit: "onion",
        },
        note: {
          explanation: "1 onion = ~1 cup chopped",
        },
      },
    ],
  },

  // 12. Coconut Milk
  {
    name: "coconut milk",
    match: { rest: { terms: "coconut milk" } },
    conversions: [
      {
        units: ["cup", "ounce", "oz"],
        unitMultiplier: {
          cup: 1 / 1.7,
          ounce: 1 / 13.5,
          oz: 1 / 13.5,
          default: 1,
        },
        output: {
          unit: "can",
          rest: "coconut milk",
        },
      },
    ],
  },

  // 13. Cabbage
  {
    name: "cabbage",
    match: { rest: { terms: "cabbage" } },
    conversions: [
      {
        units: ["gram", "g", "ounce", "oz", "pound", "lb", "cup"],
        unitMultiplier: {
          gram: 1 / 900,
          g: 1 / 900,
          ounce: 1 / 32,
          oz: 1 / 32,
          pound: 1 / 2,
          lb: 1 / 2,
          cup: 1 / 8,
          default: 1,
        },
        output: {
          unit: "head",
        },
      },
    ],
  },

  // 14. Scallions
  {
    name: "scallions",
    match: {
      rest: { terms: ["scallion", "spring onion", "green onion"] },
    },
    conversions: [
      {
        units: ["cup", "gram", "g", "ounce", "oz"],
        unitMultiplier: {
          cup: 2,
          gram: 1 / 90,
          g: 1 / 90,
          ounce: 1 / 3,
          oz: 1 / 3,
          default: 1 / 6,
        },
        output: {
          unit: "bundle",
          rest: "scallions (green onions)",
        },
      },
    ],
  },

  // 15. Dry Pasta
  {
    name: "dry pasta",
    match: {
      rest: {
        terms: [
          "pasta",
          "macaroni",
          "spaghetti",
          "penne",
          "noodle",
          "noodles",
          "fettuccine",
          "linguine",
          "lasagna",
        ],
      },
    },
    conversions: [
      {
        units: ["ounce", "oz", "gram", "g", "pound", "lb"],
        unitMultiplier: {
          ounce: 1 / 16,
          oz: 1 / 16,
          gram: 1 / 453.592,
          g: 1 / 453.592,
          pound: 1,
          lb: 1,
          default: 1,
        },
        output: {
          unit: "box",
        },
      },
    ],
  },
];
