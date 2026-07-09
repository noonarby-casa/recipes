export interface ParsedQty {
  qty: number | null;
  unit: string;
}

export function parseSimpleQty(text: string): ParsedQty {
  text = text.trim();
  // extremely simple regex: optional fraction, space, unit
  const numPat = `(?:\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:\\.\\d+)?)`;
  const rangePat = `(?:${numPat}\\s*(?:-|–|\\s+to\\s+)\\s*${numPat})`;
  const match = text.match(new RegExp(`^(${rangePat}|${numPat})\\s*(.*)`));
  if (match) {
    return {
      qty: parseNumeric(match[1]),
      unit: match[2].trim(),
    };
  }
  return { qty: null, unit: '' };
}

function parseNumeric(str: string): number {
  str = str.trim();
  const rangeParts = str.split(/\s*[-–]|\s+to\s+/i);
  if (rangeParts.length > 1) {
    return Math.max(...rangeParts.map(parseSingleNumeric));
  }
  return parseSingleNumeric(str);
}

function parseSingleNumeric(str: string): number {
  str = str.trim();
  if (str.includes('/')) {
    const parts = str.split(/\s+/);
    if (parts.length === 2) {
      const whole = parseFloat(parts[0]);
      const fracParts = parts[1].split('/');
      return whole + parseFloat(fracParts[0]) / parseFloat(fracParts[1]);
    } else {
      const fracParts = parts[0].split('/');
      return parseFloat(fracParts[0]) / parseFloat(fracParts[1]);
    }
  }
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

export function parseRawUserInput(text: string): {
  qty?: number;
  unit?: string;
  item: string;
  desc?: string;
  prep?: string;
} {
  const prepKeywords = [
    'chopped',
    'minced',
    'sliced',
    'packed',
    'grated',
    'shredded',
    'melted',
    'diced',
    'drained',
    'rinsed',
    'divided',
    'crushed',
    'deboned',
    'peeled',
    'toasted',
    'beaten',
    'sifted',
    'whipped',
    'warmed',
    'chilled',
    'softened',
    'ground',
    'halved',
    'quartered',
    'squeezed',
    'cut',
    'torn',
    'cracked',
    'mashed',
    'pureed',
    'cooked',
    'zested',
    'slivered',
    'flaked',
    'pitted',
    'seeded',
  ];

  function isPrep(part: string): boolean {
    const lower = part.toLowerCase();
    return (
      prepKeywords.some((kw) => new RegExp(`\\b${kw}\\b`).test(lower)) ||
      /\b\w+ed\b/.test(lower) ||
      lower.includes('packed')
    );
  }

  function parseItemDetails(itemStr: string): {
    item: string;
    desc?: string;
    prep?: string;
  } {
    const parts = itemStr.split(',').map((p) => p.trim());
    if (parts.length <= 1) {
      return { item: itemStr.trim() };
    }

    const item = parts[0];
    const descriptors: string[] = [];
    const preps: string[] = [];

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (!part) {
        continue;
      }
      if (isPrep(part)) {
        preps.push(part);
      } else {
        descriptors.push(part);
      }
    }

    return {
      item,
      desc: descriptors.length > 0 ? descriptors.join(', ') : undefined,
      prep: preps.length > 0 ? preps.join(', ') : undefined,
    };
  }

  const parsed = parseSimpleQty(text);
  if (parsed.qty === null) {
    const details = parseItemDetails(text);
    return {
      ...details,
    };
  }

  const remainder = parsed.unit.trim();
  const words = remainder.split(/\s+/);
  const firstWord = words[0].toLowerCase();

  const unitList = [
    'can',
    'cans',
    'g',
    'gram',
    'grams',
    'lb',
    'lbs',
    'pound',
    'pounds',
    'oz',
    'ounce',
    'ounces',
    'cup',
    'cups',
    'tbsp',
    'tablespoon',
    'tablespoons',
    'tsp',
    'teaspoon',
    'teaspoons',
    'clove',
    'cloves',
    'head',
    'heads',
    'package',
    'packages',
    'box',
    'boxes',
    'container',
    'containers',
    'jar',
    'jars',
    'bottle',
    'bottles',
    'bag',
    'bags',
    'stick',
    'sticks',
    'slice',
    'slices',
    'piece',
    'pieces',
    'bunch',
    'bunches',
  ];

  const matchedUnit = unitList.find(
    (u) =>
      firstWord === u ||
      firstWord.startsWith(u + '(') ||
      firstWord.endsWith(')'),
  );
  if (matchedUnit && words.length > 1) {
    const unit = words[0];
    const itemRemainder = words.slice(1).join(' ');
    const details = parseItemDetails(itemRemainder);
    return {
      qty: parsed.qty,
      unit,
      ...details,
    };
  }

  const details = parseItemDetails(remainder);
  return {
    qty: parsed.qty,
    unit: '',
    ...details,
  };
}
