import { formatCookingNumber } from '../scaler';
import { SINGULAR_TO_PLURAL, PLURAL_TO_SINGULAR, VOLUME_UNITS, TO_TEASPOONS, STAPLES } from './config';

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

/**
 * Returns the singular form of a given unit, or the unit itself if not found.
 */
export function getSingularUnit(unit: string): string {
  if (!unit) return '';
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
  return VOLUME_UNITS.includes(getSingularUnit(unit).toLowerCase());
}

/**
 * Converts a quantity from one volume unit to another using standard conversion factors.
 */
export function convertVolume(qty: number, fromUnit: string, toUnit: string): number {
  const fromSing = getSingularUnit(fromUnit).toLowerCase();
  const toSing = getSingularUnit(toUnit).toLowerCase();
  
  const fromFactor = TO_TEASPOONS[fromSing];
  const toFactor = TO_TEASPOONS[toSing];
  
  if (fromFactor && toFactor) {
    return qty * (fromFactor / toFactor);
  }
  return qty;
}

/**
 * Removes preparation keywords (e.g. sliced, chopped, minced) and serving suffixes from ingredient names.
 */
export function cleanPrepTerms(text: string): string {
  if (!text) return '';

  // Remove "for serving" or "plus more for serving" phrases
  text = text.replace(/,?\s+(?:plus\s+more\s+)?for\s+serving\b/gi, '').trim();

  const PREP_KEYWORDS = ['minced', 'diced', 'chopped', 'sliced', 'grated', 'crushed', 'shredded', 'toasted', 'melted', 'softened', 'beaten', 'mashed', 'julienned', 'drained', 'wedge', 'wedges', 'divided', 'grate', 'thinly', 'finely', 'coarsely', 'room temperature', 'finely crushed'];

  // 1. Remove suffixes (comma-separated instructions at the end) if they contain prep words
  const parts = text.split(',');
  if (parts.length > 1) {
    const suffix = parts.slice(1).join(',').toLowerCase();
    if (PREP_KEYWORDS.some(k => suffix.includes(k))) {
      text = parts[0].trim();
    }
  }

  // 1.5. Remove any remaining standalone "room temperature" or "at room temperature" phrases
  text = text.replace(/\b(?:at\s+)?room\s+temperature\b/gi, '').trim();

  // 2. Remove prep terms as standalone words in the middle/start of the text (e.g. minced garlic)
  const midPrepRegex = /\b(minced|diced|chopped|sliced|grated|crushed|shredded|toasted|melted|softened|beaten|mashed|julienned|drained|finely\s+(grated|chopped|diced|sliced|minced|crushed)|coarsely\s+(chopped|sliced))\b(?:\s+|$)/gi;
  let cleaned = text.replace(midPrepRegex, '').trim();

  // Clean up double spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
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
    const innerParsed = parseNoteToArray('need ' + measString);
    innerParsed.forEach(item => {
      item.explanation = prefix;
      item.prefix = '';
    });
    return innerParsed;
  }
  
  // 2. Handle 'need ' prefix and splitting by '+'
  if (cleaned.toLowerCase().startsWith('need ')) {
    cleaned = cleaned.substring(5).trim();
  }
  
  if (cleaned.includes(' + ')) {
    const parts = cleaned.split(' + ');
    let result: NoteItem[] = [];
    parts.forEach(p => {
      result = result.concat(parseNoteToArray(p));
    });
    return result;
  }
  
  // 3. Match any parenthesized explanation at the end, e.g. need 9 tablespoons juice (1 lemon = ~3 tbsp juice)
  let explanation = '';
  const expMatch = cleaned.match(/\s*\((?!need\s+)([^)]+)\)$/i);
  if (expMatch) {
    explanation = expMatch[1].trim();
    const matchIndex = expMatch.index !== undefined ? expMatch.index : 0;
    cleaned = cleaned.substring(0, matchIndex).trim();
  }
  
  // 4. Plain measurement
  const parsedMeas = parseMeasString(cleaned);
  return [{
    prefix: '',
    qty: parsedMeas.qty,
    unit: parsedMeas.unit,
    rest: parsedMeas.rest,
    explanation: explanation
  }];
}

/**
 * Parses numeric quantities (including fractions) and units from a raw measurement string.
 */
export function parseMeasString(str: string): ParsedMeas {
  const match = str.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)(?:\s+([a-zA-Z\-()]+))?(?:\s+(.*))?$/);
  if (match) {
    const qtyStr = match[1];
    let qty = parseFloat(qtyStr);
    if (qtyStr.includes('/')) {
      const parts = qtyStr.split(/\s+/);
      if (parts.length === 2) {
        const whole = parseFloat(parts[0]);
        const fracParts = parts[1].split('/');
        qty = whole + parseFloat(fracParts[0]) / parseFloat(fracParts[1]);
      } else {
        const fracParts = parts[0].split('/');
        qty = parseFloat(fracParts[0]) / parseFloat(fracParts[1]);
      }
    }
    const unit = match[2] || '';
    const rest = match[3] || '';
    return { qty, unit, rest };
  }
  return { qty: null, unit: '', rest: str };
}

/**
 * Returns a stick conversion explanation note for butter depending on the target unit.
 */
export function getButterExplanation(unit: string): string {
  const u = unit.toLowerCase();
  if (u.includes('tablespoon') || u.includes('tbsp')) return '1 stick = 8 tbsp';
  if (u.includes('teaspoon') || u.includes('tsp')) return '1 stick = 24 tsp';
  if (u.includes('pound') || u.includes('lb')) return '1 stick = 1/4 lb';
  if (u.includes('ounce') || u.includes('oz')) return '1 stick = 4 oz';
  return '1 stick = 1/2 cup';
}

/**
 * Abbreviates full unit names (e.g. tablespoons -> tbsp) within note strings.
 */
export function abbreviateNote(note: string): string {
  if (!note) return '';
  return note
    .replace(/\btablespoons?\b/gi, 'tbsp')
    .replace(/\bteaspoons?\b/gi, 'tsp')
    .replace(/\bounces?\b/gi, 'oz')
    .replace(/\bpounds?\b/gi, 'lb')
    .replace(/\bgrams?\b/gi, 'g');
}

/**
 * Determines staple status for an ingredient name, excluding fresh peppers, non-dairy butter, and fresh citrus juice.
 */
export function checkIsStaple(name: string, qty: number | null | undefined, unit: string): boolean {
  const nameLower = name.toLowerCase();

  // Exclude fresh peppers/chilies from being matched as the staple "pepper"
  const isFreshPepper = ['bell', 'jalapeno', 'serrano', 'habanero', 'poblano', 'banana', 'chili', 'chilli', 'red', 'green', 'yellow', 'orange', 'roasted', 'sweet'].some(p => nameLower.includes(p)) &&
                        !nameLower.includes('powder') &&
                        !nameLower.includes('flakes') &&
                        !nameLower.includes('ground') &&
                        !nameLower.includes('cayenne');

  // Exclude non-butter items from being matched as the staple "butter"
  const isSpecialButter = ['peanut', 'almond', 'beans', 'milk', 'squash', 'butternut', 'lettuce', 'pickles'].some(b => nameLower.includes(b));

  // Exclude fresh lemon/lime juice from being matched as the staple "lemon juice" or "lime juice"
  const isFreshJuice = (nameLower.includes('lemon') || nameLower.includes('lime')) &&
                       (nameLower.includes('fresh') || nameLower.includes('squeezed'));

  // Determine staple status
  return (STAPLES.some(staple => nameLower.includes(staple)) || 
          ((qty === null || qty === undefined || isNaN(qty)) && 
           (nameLower.includes('salt') || nameLower.includes('pepper')))) &&
         !isFreshPepper && !isSpecialButter && !isFreshJuice && !nameLower.includes('sausage');
}
