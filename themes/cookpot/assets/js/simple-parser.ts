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
