import {
  formatCookingNumber,
  getAdaptiveUnit,
  SINGULAR_TO_PLURAL,
  PLURAL_TO_SINGULAR,
} from "../units";
import {
  VOLUME_UNITS,
  TO_TEASPOONS,
  PREP_KEYWORDS,
  SKIP_TERMS,
} from "./config";
import {
  StringMatchConfig,
  IngredientMatchConfig,
  Ingredient,
  ConverterContext,
  ShoppingItem,
  NoteItem,
  CleanedPrepResult,
} from "./types";
export {
  StringMatchConfig,
  Ingredient,
  ConverterContext,
  ShoppingItem,
  NoteItem,
  CleanedPrepResult,
};

/**
 * Returns the singular form of a given unit, or the unit itself if not found.
 */
export function getSingularUnit(unit: string): string {
  if (!unit) return "";
  const lower = unit.toLowerCase().trim();
  return PLURAL_TO_SINGULAR[lower] || lower;
}

/**
 * Checks if the unit is a known cooking volume unit (e.g. cup, tbsp, tsp, oz, ml).
 */
export function isVolumeUnit(unit: string): boolean {
  if (!unit) return false;
  return VOLUME_UNITS.includes(getSingularUnit(unit));
}

/**
 * Converts a quantity from one volume unit to another using standard conversion factors.
 */
export function convertVolume(
  qty: number,
  fromUnit: string,
  toUnit: string,
): number {
  const fromSing = getSingularUnit(fromUnit);
  const toSing = getSingularUnit(toUnit);

  const fromFactor = TO_TEASPOONS[fromSing];
  const toFactor = TO_TEASPOONS[toSing];

  if (fromFactor && toFactor) {
    return qty * (fromFactor / toFactor);
  }
  return qty;
}

/**
 * Removes preparation keywords (e.g. sliced, chopped, minced) and serving suffixes from ingredient names.
 * Returns both the cleaned name (as 'rest') and the matched preparation term.
 */
const PREP_KEYWORDS_PATTERN = [...PREP_KEYWORDS]
  .sort((a, b) => b.length - a.length)
  .map((k) => k.replace(/\s+/g, "\\s+"))
  .join("|");
const MID_PREP_REGEX = new RegExp(
  `\\b(${PREP_KEYWORDS_PATTERN})\\b(?:\\s+|$)`,
  "gi",
);

/**
 * Removes preparation keywords (e.g. sliced, chopped, minced) and serving suffixes from ingredient names.
 * Returns both the cleaned name (as 'rest') and the matched preparation term.
 */
export function cleanPrepTerms(text: string): CleanedPrepResult {
  if (!text) return { rest: "", prep: "" };

  const textLower = text.toLowerCase();
  const prep = PREP_KEYWORDS.find((k) => textLower.includes(k)) || "";

  // Remove suffixes like "for serving", "to taste", "for garnish", etc.
  text = text
    .replace(
      /,?\s+(?:plus\s+more\s+)?(?:for\s+(?:serving|garnish|topping|dipping|drizzling)|to\s+taste|as\s+needed)\b/gi,
      "",
    )
    .trim();

  // 1. Remove suffixes (comma-separated instructions at the end) if they contain prep words
  const parts = text.split(",");
  if (parts.length > 1) {
    const suffix = parts.slice(1).join(",").toLowerCase();
    if (PREP_KEYWORDS.some((k) => suffix.includes(k))) {
      text = parts[0].trim();
    }
  }

  // 1.5. Remove any remaining standalone "room temperature" or "at room temperature" phrases
  text = text.replace(/\b(?:at\s+)?room\s+temperature\b/gi, "").trim();

  // 2. Remove prep terms as standalone words in the middle/start of the text (e.g. minced garlic)
  let cleaned = text.replace(MID_PREP_REGEX, "").trim();

  // Clean up double spaces
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return { rest: cleaned, prep };
}

/**
 * Returns a pack conversion explanation note (e.g. stick or box conversions) depending on the target unit.
 */
const STICK_EXPLANATIONS: Record<string, string> = {
  tablespoon: "1 stick = 8 tbsp",
  tbsp: "1 stick = 8 tbsp",
  teaspoon: "1 stick = 24 tsp",
  tsp: "1 stick = 24 tsp",
  pound: "1 stick = 1/4 lb",
  lb: "1 stick = 1/4 lb",
  ounce: "1 stick = 4 oz",
  oz: "1 stick = 4 oz",
};

const BOX_EXPLANATIONS: Record<string, string> = {
  ounce: "1 box = 16 oz",
  oz: "1 box = 16 oz",
  gram: "1 box = 454 g",
  g: "1 box = 454 g",
};

/**
 * Returns a pack conversion explanation note (e.g. stick or box conversions) depending on the target unit.
 */
export function getPackExplanation(
  packUnit: string,
  targetUnit: string,
): string {
  const pack = packUnit.toLowerCase().trim();
  const target = targetUnit.toLowerCase().trim();

  if (pack.includes("stick")) {
    return STICK_EXPLANATIONS[target] || "1 stick = 1/2 cup";
  }

  if (pack.includes("box")) {
    return BOX_EXPLANATIONS[target] || "1 box = 1 lb";
  }

  return "";
}

/**
 * Abbreviates full unit names (e.g. tablespoons -> tbsp) within note strings.
 */
export function abbreviateNote(note: string): string {
  if (!note) return "";
  return note
    .replace(/\btablespoons?\b/gi, "tbsp")
    .replace(/\bteaspoons?\b/gi, "tsp")
    .replace(/\bounces?\b/gi, "oz")
    .replace(/\bpounds?\b/gi, "lb")
    .replace(/\bgrams?\b/gi, "g");
}

/**
 * Helper to match a text or array of texts against a StringMatchConfig.
 * Assumes the StringMatchConfig fields (match, excludeIf, keepIf) are already lowercase.
 */
export function matchesConfig(
  text: string | string[],
  config: StringMatchConfig,
): boolean {
  const texts = Array.isArray(text) ? text : [text];
  const textLowers = texts.map((t) => t.toLowerCase());

  const matchArray = Array.isArray(config.terms)
    ? config.terms
    : [config.terms];
  const hasMatch = matchArray.some((pattern) =>
    textLowers.some((t) => t.includes(pattern)),
  );

  if (!hasMatch) {
    return false;
  }

  const hasExclusion =
    config.excludeIf?.some((term) =>
      textLowers.some((t) => t.includes(term)),
    ) ?? false;

  if (hasExclusion) {
    const hasKeep =
      config.keepIf?.some((term) => textLowers.some((t) => t.includes(term))) ??
      false;
    if (!hasKeep) {
      return false;
    }
  }

  return true;
}

/**
 * Checks if an ingredient should be skipped from the shopping list completely.
 */
export function shouldSkipIngredient(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return SKIP_TERMS.some((term) => lower.includes(term));
}

/**
 * Formats a standardized map key from a unit and name.
 */
export function buildMapKey(unit: string, name: string): string {
  return `${getSingularUnit(unit)}_${name.toLowerCase().trim()}`;
}

/**
 * Serializes merged note arrays back into formatted, abbreviated instruction strings prefixing 'need'.
 * Conditionally includes parenthetical explanations depending on showExplanations flag.
 */
export function formatNotesArray(
  arr: NoteItem[],
  showExplanations = true,
): string {
  const measParts = arr.map((item) => {
    if (item.qty === null) return item.rest;
    const formattedQty = formatCookingNumber(item.qty);
    const displayUnit = item.unit ? " " + item.unit : "";
    const displayRest = item.rest ? " " + item.rest : "";
    const displayExp =
      item.explanation && showExplanations ? ` (${item.explanation})` : "";
    return `${formattedQty}${displayUnit}${displayRest}${displayExp}`;
  });

  return abbreviateNote("need " + measParts.join(" + "));
}

/**
 * Adjusts the singular or plural spelling of a specific base word within a description string
 * based on the quantity, leveraging central mapping constants.
 */
export function adjustDescriptionPlurality(
  qty: number,
  rest: string,
  baseWord: string,
): string {
  let finalRest = rest.trim();
  const lowerWord = baseWord.toLowerCase();

  const singularWord = PLURAL_TO_SINGULAR[lowerWord] || lowerWord;
  const pluralWord = SINGULAR_TO_PLURAL[singularWord] || singularWord;

  if (qty > 1) {
    const regex = new RegExp(`\\b${singularWord}\\b`, "gi");
    finalRest = finalRest.replace(regex, pluralWord);
  } else {
    const regex = new RegExp(`\\b${pluralWord}\\b`, "gi");
    finalRest = finalRest.replace(regex, singularWord);
  }

  if (!finalRest) {
    return getAdaptiveUnit(qty, singularWord);
  }

  return finalRest;
}

/**
 * Helper to construct structured note arrays in strategy converters.
 */
export function createNote(
  qty: number | null,
  unit: string,
  explanation = "",
  rest = "",
): Record<string, NoteItem[]> {
  const adaptiveUnit = getAdaptiveUnit(qty, unit);
  const adaptiveRest = getAdaptiveUnit(qty, rest);
  const key = rest.toLowerCase().trim() || "default";
  return {
    [key]: [
      { prefix: "", qty, unit: adaptiveUnit, rest: adaptiveRest, explanation },
    ],
  };
}

/**
 * Searches a list of keyword groups and returns the mapped value for the first group
 * that has any keyword as a substring of the target string. Returns defaultValue if no match is found.
 */
export function match<T>(
  str: string,
  mappings: [string[], T][],
  defaultValue: T,
): T {
  for (const [keywords, value] of mappings) {
    if (keywords.some((k) => str.includes(k))) {
      return value;
    }
  }
  return defaultValue;
}

/**
 * Checks if a unit matches any of the specified keywords.
 */
export function hasUnit(unitLower: string, keywords: string[]): boolean {
  return keywords.some((k) => unitLower.includes(k));
}

/**
 * Searches a list of numeric limit thresholds (ordered ascending) and returns the mapped value
 * for the first limit that is greater than or equal to the target value. Returns defaultValue if no limit matches.
 */
export function range<T>(
  val: number,
  mappings: [number, T][],
  defaultValue: T,
): T {
  for (const [limit, value] of mappings) {
    if (val <= limit) {
      return value;
    }
  }
  return defaultValue;
}

export function matchesIngredient(
  item: { rest: string; prep: string; unit: string },
  config: IngredientMatchConfig,
): boolean {
  if (config.rest && !matchesConfig(item.rest, config.rest)) {
    return false;
  }
  if (config.prep && !matchesConfig(item.prep, config.prep)) {
    return false;
  }
  if (config.unit && !matchesConfig(item.unit, config.unit)) {
    return false;
  }
  return true;
}
