import type { Recipe } from '../types';
import { STORE_LAYOUTS } from '../data/store-sections';

const DEFAULT_STORE_LAYOUT_ID = 'market-basket-pnh';

export function parseRecipeUrlParams(
  recipes: Recipe[],
  searchString: string,
): {
  selectedRecipeServings: Record<string, number>;
  layoutId: string | null;
  altSelections: Record<string, string>;
  hasValidParams: boolean;
} {
  const params = new URLSearchParams(searchString);
  let hasValidParams = false;
  const selectedRecipeServings: Record<string, number> = {};
  let layoutId: string | null = null;
  const altSelections: Record<string, string> = {};

  if (params.has('l')) {
    const lVal = params.get('l');
    if (lVal && STORE_LAYOUTS.some((layout) => layout.id === lVal)) {
      layoutId = lVal;
      hasValidParams = true;
    }
  }

  if (params.has('alt')) {
    const altVal = (params.get('alt') || '').trim();
    if (altVal) {
      hasValidParams = true;
      const tokens = altVal.split('.').filter(Boolean);
      tokens.forEach((token) => {
        const [recShortId, altItemSlug] = token.split(':');
        if (recShortId && altItemSlug) {
          altSelections[recShortId] = altItemSlug;
        }
      });
    }
  }

  if (params.has('r')) {
    const rVal = (params.get('r') || '').trim();
    if (rVal) {
      hasValidParams = true;
      if (rVal.toLowerCase() === 'all') {
        recipes.forEach((rec) => {
          selectedRecipeServings[rec.permalink] = rec.servings || 4;
        });
      } else {
        const tokens = rVal.split('.').filter(Boolean);
        tokens.forEach((entry) => {
          let digitIndex = -1;
          for (let i = 0; i < entry.length; i++) {
            const char = entry.charAt(i);
            if (char >= '0' && char <= '9') {
              digitIndex = i;
              break;
            }
          }

          let code = entry;
          let portions: number | null = null;
          if (digitIndex !== -1) {
            code = entry.slice(0, digitIndex);
            portions = parseInt(entry.slice(digitIndex), 10);
          }

          const rec = recipes.find((r) => r.shortId === code);
          if (rec) {
            const baseYield = rec.servings || 4;
            const servings =
              portions !== null && !isNaN(portions) && portions > 0
                ? portions
                : baseYield;
            selectedRecipeServings[rec.permalink] = servings;
          }
        });
      }
    }
  }

  return {
    selectedRecipeServings,
    layoutId,
    altSelections,
    hasValidParams,
  };
}

export function serializeRecipeUrlParams(
  selectedRecipeServings: Record<string, number>,
  recipes: Recipe[],
  layoutId: string,
  altSelections?: Record<string, string>,
): {
  r: string | null;
  l: string | null;
  alt: string | null;
} {
  const selectedPermalinks = Object.keys(selectedRecipeServings);

  let rVal: string | null = null;

  if (selectedPermalinks.length > 0) {
    const isAllSelectedAtBaseYield =
      recipes.length > 0 &&
      selectedPermalinks.length === recipes.length &&
      recipes.every((rec) => {
        const servings = selectedRecipeServings[rec.permalink];
        const baseYield = rec.servings || 4;
        return servings === baseYield;
      });

    if (isAllSelectedAtBaseYield) {
      rVal = 'all';
    } else {
      const entries: string[] = [];
      recipes.forEach((rec) => {
        if (rec.permalink in selectedRecipeServings) {
          const servings = selectedRecipeServings[rec.permalink];
          const baseYield = rec.servings || 4;
          const code = rec.shortId || rec.permalink;
          if (servings === baseYield) {
            entries.push(code);
          } else {
            entries.push(`${code}${servings}`);
          }
        }
      });
      rVal = entries.join('.');
    }
  }

  const lVal = layoutId !== DEFAULT_STORE_LAYOUT_ID ? layoutId : null;

  let altVal: string | null = null;
  if (altSelections && Object.keys(altSelections).length > 0) {
    const tokens = Object.entries(altSelections)
      .filter(([_, altSlug]) => Boolean(altSlug))
      .map(([recShortId, altSlug]) => `${recShortId}:${altSlug}`);
    if (tokens.length > 0) {
      altVal = tokens.join('.');
    }
  }

  return { r: rVal, l: lVal, alt: altVal };
}
