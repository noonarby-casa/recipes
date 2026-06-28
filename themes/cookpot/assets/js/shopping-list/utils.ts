import { formatCookingNumber, getAdaptiveUnit } from "../scaler";
import { SINGULAR_TO_PLURAL, PLURAL_TO_SINGULAR } from "../constants";
import {
  VOLUME_UNITS,
  TO_TEASPOONS,
  PREP_KEYWORDS,
  SKIP_TERMS,
  StringMatchConfig,
} from "./config";
export { StringMatchConfig };

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
  notes?: Record<string, NoteItem[]>;
  note?: NoteItem[];
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

export interface ParsedMeas {
  qty: number | null;
  unit: string;
  rest: string;
}

export interface CleanedPrepResult {
  rest: string;
  prep: string;
}

/**
 * Returns the singular form of a given unit, or the unit itself if not found.
 */
export function getSingularUnit(unit: string): string {
  if (!unit) return "";
  const lower = unit.toLowerCase().trim();
  return PLURAL_TO_SINGULAR[lower] || lower;
}

/**
 * Returns the pluralized form of a given unit, or the unit itself if not found.
 */
export function getPluralizedUnit(unit: string): string {
  const lower = unit.toLowerCase().trim();
  return SINGULAR_TO_PLURAL[lower] || unit;
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
export function cleanPrepTerms(text: string): CleanedPrepResult {
  if (!text) return { rest: "", prep: "" };

  const textLower = text.toLowerCase();
  const prep = PREP_KEYWORDS.find((k) => textLower.includes(k)) || "";

  // Remove "for serving" or "plus more for serving" phrases
  text = text.replace(/,?\s+(?:plus\s+more\s+)?for\s+serving\b/gi, "").trim();

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
  const sortedKeywords = [...PREP_KEYWORDS].sort((a, b) => b.length - a.length);
  const pattern = sortedKeywords
    .map((k) => k.replace(/\s+/g, "\\s+"))
    .join("|");
  const midPrepRegex = new RegExp(`\\b(${pattern})\\b(?:\\s+|$)`, "gi");
  let cleaned = text.replace(midPrepRegex, "").trim();

  // Clean up double spaces
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return { rest: cleaned, prep };
}

/**
 * Parses a combined note string into structured measurement objects separated by '+'.
 */
export function parseNoteToArray(note: string): NoteItem[] {
  if (!note) return [];

  let cleaned = note.trim();

  // 1. Check for prefix style (need ...) pattern first to prevent splitting on inner '+'
  const match = cleaned.match(/^(.*?)\(need\s+([^)]+)\)$/i);
  if (match) {
    const prefix = match[1].trim();
    const measString = match[2].trim();
    const innerParsed = parseNoteToArray("need " + measString);
    innerParsed.forEach((item) => {
      item.explanation = prefix;
      item.prefix = "";
    });
    return innerParsed;
  }

  // 2. Handle 'need ' prefix and splitting by '+'
  if (cleaned.toLowerCase().startsWith("need ")) {
    cleaned = cleaned.substring(5).trim();
  }

  if (cleaned.includes(" + ")) {
    const parts = cleaned.split(" + ");
    let result: NoteItem[] = [];
    parts.forEach((p) => {
      result = result.concat(parseNoteToArray(p));
    });
    return result;
  }

  // 3. Match any parenthesized explanation at the end, e.g. need 9 tablespoons juice (1 lemon = ~3 tbsp juice)
  let explanation = "";
  const expMatch = cleaned.match(/\s*\((?!need\s+)([^)]+)\)$/i);
  if (expMatch) {
    explanation = expMatch[1].trim();
    const matchIndex = expMatch.index !== undefined ? expMatch.index : 0;
    cleaned = cleaned.substring(0, matchIndex).trim();
  }

  // 4. Plain measurement
  const parsedMeas = parseMeasString(cleaned);
  return [
    {
      prefix: "",
      qty: parsedMeas.qty,
      unit: parsedMeas.unit,
      rest: parsedMeas.rest,
      explanation: explanation,
    },
  ];
}

/**
 * Parses numeric quantities (including fractions) and units from a raw measurement string.
 */
export function parseMeasString(str: string): ParsedMeas {
  const match = str.match(
    /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)(?:\s+([a-zA-Z\-()]+))?(?:\s+(.*))?$/,
  );
  if (match) {
    const qtyStr = match[1];
    let qty = parseFloat(qtyStr);
    if (qtyStr.includes("/")) {
      const parts = qtyStr.split(/\s+/);
      if (parts.length === 2) {
        const whole = parseFloat(parts[0]);
        const fracParts = parts[1].split("/");
        qty = whole + parseFloat(fracParts[0]) / parseFloat(fracParts[1]);
      } else {
        const fracParts = parts[0].split("/");
        qty = parseFloat(fracParts[0]) / parseFloat(fracParts[1]);
      }
    }
    const unit = match[2] || "";
    const rest = match[3] || "";
    return { qty, unit, rest };
  }
  return { qty: null, unit: "", rest: str };
}

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
    if (target.includes("tablespoon") || target.includes("tbsp"))
      return "1 stick = 8 tbsp";
    if (target.includes("teaspoon") || target.includes("tsp"))
      return "1 stick = 24 tsp";
    if (target.includes("pound") || target.includes("lb"))
      return "1 stick = 1/4 lb";
    if (target.includes("ounce") || target.includes("oz"))
      return "1 stick = 4 oz";
    return "1 stick = 1/2 cup";
  }

  if (pack.includes("box")) {
    if (target.includes("ounce") || target.includes("oz"))
      return "1 box = 16 oz";
    if (target.includes("gram") || target.includes("g")) return "1 box = 454 g";
    return "1 box = 1 lb";
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

  const matchArray = Array.isArray(config.match)
    ? config.match
    : [config.match];
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

  let singularWord = lowerWord;
  let pluralWord = lowerWord;

  if (SINGULAR_TO_PLURAL[lowerWord]) {
    pluralWord = SINGULAR_TO_PLURAL[lowerWord];
  } else if (PLURAL_TO_SINGULAR[lowerWord]) {
    singularWord = PLURAL_TO_SINGULAR[lowerWord];
  }

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

/**
 * Replaces occurrences of terms specified in a key-value mapping within the given text.
 * The keys are matched case-insensitively using word boundaries.
 */
export function replaceTerms(
  text: string,
  replacements: Record<string, string>,
): string {
  let result = text;
  for (const [pattern, replacement] of Object.entries(replacements)) {
    const regex = new RegExp(`\\b${pattern}\\b`, "gi");
    result = result.replace(regex, replacement);
  }
  return result;
}
