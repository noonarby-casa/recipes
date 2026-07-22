import { derived } from 'svelte/store';
import { plannerStore } from './planner';
import { settingsStore } from './settings';
import { recipesStore } from './recipes';
import type { PlannedItem, Recipe } from '../types';
import { formatCookingNumber } from '../units';
import { parseRawUserInput } from '../simple-parser';
import { generateInstanceId } from '../utils/ids';

const DAY_CODES: Record<string, string> = {
  sun: '0',
  mon: '1',
  tue: '2',
  wed: '3',
  thu: '4',
  fri: '5',
  sat: '6',
  supplemental: '7',
};

const CODE_TO_DAYS: Record<string, string> = {
  '0': 'sun',
  '1': 'mon',
  '2': 'tue',
  '3': 'wed',
  '4': 'thu',
  '5': 'fri',
  '6': 'sat',
  '7': 'supplemental',
};

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join(
    '',
  );
  const b64 = btoa(binString);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlDecode(str: string): string {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) {
    b64 += '=';
  }
  const binString = atob(b64);
  const bytes = Uint8Array.from(binString, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function permalinkToCode(permalink: string, recipes: Recipe[]): string {
  const rec = recipes.find((r) => r.permalink === permalink);
  return rec && rec.shortId ? rec.shortId : permalink;
}

function codeToPermalink(code: string, recipes: Recipe[]): string {
  const rec = recipes.find((r) => r.shortId === code);
  if (rec) {
    return rec.permalink;
  }
  return `/${code}/`;
}

export const planUrlQueryString = derived(
  [plannerStore, settingsStore, recipesStore],
  ([$planner, $settings, $recipes]) => {
    // If planner is in preview/conflict mode, we shouldn't overwrite the URL with the local state randomly,
    // wait, does legacy code sync URL in conflict mode?
    // "unless in preview conflict mode" -> it checks if the conflict banner is open, and if so, it doesn't write.
    if ($planner.isPreviewing) {
      // In conflict preview mode, return a special null/empty indicator, or return the current query string
      // to avoid modifying it. Let's just return a flag or prevent replacement.
      return null;
    }

    const params = new URLSearchParams();
    const entries: string[] = [];

    $planner.plan.forEach((item) => {
      const rec = item.permalink
        ? $recipes.find((r) => r.permalink === item.permalink)
        : undefined;
      const dayCode = DAY_CODES[item.day];
      if (!dayCode) {
        return;
      }

      let code = 'custom';
      let defaultServings = 4;
      if (rec) {
        code = permalinkToCode(item.permalink!, $recipes);
        defaultServings = rec.servings;
      }

      const portions = Math.round(item.scale * defaultServings);
      const hasCustomPortions = portions !== defaultServings;

      let val = `${dayCode}${code}`;
      if (hasCustomPortions) {
        val += portions.toString();
      }
      entries.push(val);
    });

    if (entries.length > 0) {
      const pVal = ['1', ...entries].join('.');
      params.set('p', pVal);
    }

    const customEntries: string[] = [];
    const entrySeparator = '~';
    const fieldSeparator = '|';

    const sanitize = (val: string): string => {
      return val.replace(/~/g, '-').replace(/\|/g, ' ');
    };

    $planner.plan.forEach((item, idx) => {
      const extraIngredients = item.extraIngredients;
      const hasExtra = extraIngredients && extraIngredients.length > 0;
      const isCustom = !item.permalink;

      if (isCustom || hasExtra) {
        const parts: string[] = [idx.toString()];
        const title = isCustom ? item.customTitle || 'Custom Item' : '';
        parts.push(sanitize(title));

        if (extraIngredients && hasExtra) {
          extraIngredients.forEach((ing) => {
            const qtyStr =
              ing.qty !== undefined && ing.qty !== null
                ? `${formatCookingNumber(Array.isArray(ing.qty) ? ing.qty[0] : ing.qty)} `
                : '';
            const unitStr = ing.unit ? `${ing.unit} ` : '';
            const descStr = ing.desc ? `, ${ing.desc}` : '';
            const prepStr = ing.prep ? `, ${ing.prep}` : '';
            const ingredientStr = `${qtyStr}${unitStr}${ing.item}${descStr}${prepStr}`;
            parts.push(sanitize(ingredientStr));
          });
        }

        while (parts.length > 1 && parts[parts.length - 1] === '') {
          parts.pop();
        }

        customEntries.push(parts.join(fieldSeparator));
      }
    });

    if (customEntries.length > 0) {
      params.set('x', base64UrlEncode(customEntries.join(entrySeparator)));
    }

    if (!$settings.workWeekOnly) {
      params.set('w', '7');
    }

    if ($settings.activeTab === 'edit') {
      params.set('m', 'e');
    } else if ($settings.activeTab === 'shop') {
      params.set('m', 's');
    }

    return params.toString();
  },
);

// Perform parsing logic on URL
export function parsePlanUrlParams(
  recipes: Recipe[],
  searchString: string,
): {
  plan: PlannedItem[];
  workWeekOnly: boolean;
  activeTab: 'edit' | 'view' | 'shop';
  hasValidParams: boolean;
} {
  const params = new URLSearchParams(searchString);
  let hasValidParams = false;
  const newPlan: PlannedItem[] = [];

  if (params.has('p')) {
    const pVal = params.get('p') || '';
    const parts = pVal.split('.');
    const version = parts[0];

    if (version === '1') {
      hasValidParams = true;
      const entries = parts.slice(1);
      entries.forEach((entry) => {
        if (!entry) {
          return;
        }

        const dayCode = entry.charAt(0);
        const day = CODE_TO_DAYS[dayCode];
        if (!day) {
          console.warn(`[URL Parser] Invalid day code: ${dayCode}`);
          return;
        }

        const rest = entry.slice(1);
        if (!rest) {
          return;
        }

        let digitIndex = -1;
        for (let i = 0; i < rest.length; i++) {
          const char = rest.charAt(i);
          if (char >= '0' && char <= '9') {
            digitIndex = i;
            break;
          }
        }

        let code = rest;
        let portions: number | null = null;
        if (digitIndex !== -1) {
          code = rest.slice(0, digitIndex);
          portions = parseInt(rest.slice(digitIndex), 10);
        }

        const permalink =
          code === 'custom' ? undefined : codeToPermalink(code, recipes);
        const rec = permalink
          ? recipes.find((r) => r.permalink === permalink)
          : undefined;

        const defaultServings = rec ? rec.servings : 4;
        let scale = 1.0;
        if (portions !== null && !isNaN(portions)) {
          scale = portions / defaultServings;
        }

        newPlan.push({
          instanceId: generateInstanceId(),
          permalink: permalink || undefined,
          scale,
          day,
        });
      });
    }
  } else {
    // Legacy fallback
    const DAYS_LIST = [
      'mon',
      'tue',
      'wed',
      'thu',
      'fri',
      'sat',
      'sun',
      'supplemental',
    ];
    DAYS_LIST.forEach((day) => {
      const values = params.getAll(day);
      if (values.length > 0) {
        hasValidParams = true;
        values.forEach((val) => {
          let code = val;
          let scale = 1.0;

          if (val.includes('-')) {
            const parts = val.split('-');
            code = parts[0];
            scale = parseFloat(parts[1]) || 1.0;
          }

          const permalink =
            code === 'custom' ? undefined : codeToPermalink(code, recipes);
          newPlan.push({
            instanceId: generateInstanceId(),
            permalink: permalink || undefined,
            scale: isNaN(scale) ? 1.0 : scale,
            day: day === 'supplemental' ? 'supplemental' : day,
          });
        });
      }
    });
  }

  if (params.has('x')) {
    try {
      const xVal = params.get('x') || '';
      const decodedStr = base64UrlDecode(xVal);
      if (decodedStr) {
        const entrySeparator = '~';
        const fieldSeparator = '|';

        const entries = decodedStr.split(entrySeparator);
        entries.forEach((entry) => {
          if (!entry) {
            return;
          }
          const parts = entry.split(fieldSeparator);
          if (parts.length === 0) {
            return;
          }

          const idxStr = parts[0];
          const idx = parseInt(idxStr, 10);
          if (isNaN(idx)) {
            return;
          }

          const title = parts[1] || undefined;
          const extra = parts.slice(2);

          const planItem = newPlan[idx];
          if (planItem) {
            if (title) {
              planItem.customTitle = title;
              planItem.permalink = undefined;
            }
            if (extra.length > 0) {
              planItem.extraIngredients = extra.map((textStr: string) =>
                parseRawUserInput(textStr),
              );
            }
          }
        });
      }
    } catch (e) {
      console.warn('[URL Parser] Error parsing custom data x:', e);
    }
  }

  let workWeekOnly = true;
  if (params.has('w') || params.has('week')) {
    hasValidParams = true;
    const wVal = params.get('w') || params.get('week');
    workWeekOnly = wVal !== '7';
  }

  const rawMode = params.get('m') || params.get('mode');
  const activeTab: 'edit' | 'view' | 'shop' =
    rawMode === 'e' ? 'edit' : rawMode === 's' ? 'shop' : 'view';

  return { plan: newPlan, workWeekOnly, activeTab, hasValidParams };
}
