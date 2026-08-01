import { derived } from 'svelte/store';
import { plannerStore } from './planner';
import { settingsStore } from './settings';
import { recipesStore } from './recipes';
import type { PlannedItem, Recipe } from '../types';
import { formatCookingNumber } from '../units';
import { parseRawUserInput } from '../simple-parser';
import { generateInstanceId } from '../utils/ids';
import { updateUrlParams } from '../utils/urlSync';
import {
  addDays,
  formatIsoDate,
  formatUrlDate,
  getMondayOfWeek,
  parseIsoDate,
  parseUrlDate,
} from '../utils/dates';

export function syncPlanStateToUrl(searchStr: string | null): void {
  if (searchStr === null) {
    return;
  }
  const params = new URLSearchParams(searchStr);
  updateUrlParams({
    p: params.get('p'),
    x: params.get('x'),
    w: params.get('w'),
    d: params.get('d'),
    m: params.get('m'),
  });
}

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
    if ($planner.isPreviewing) {
      return null;
    }

    const params = new URLSearchParams();
    const entries: string[] = [];

    const startDateStr =
      $settings.startDate || formatIsoDate(getMondayOfWeek());
    const startDate = parseIsoDate(startDateStr);
    const durationDays = $settings.durationDays || 5;

    $planner.plan.forEach((item) => {
      const rec = item.permalink
        ? $recipes.find((r) => r.permalink === item.permalink)
        : undefined;

      let dayCode = 'S';
      if (item.date && item.date !== 'supplemental') {
        const itemDate = parseIsoDate(item.date);
        const offsetMs = itemDate.getTime() - startDate.getTime();
        const offsetDays = Math.round(offsetMs / (1000 * 60 * 60 * 24));
        if (offsetDays >= 0 && offsetDays < durationDays) {
          dayCode = offsetDays.toString();
        } else {
          // Date outside current window, skip encoding into this window's URL
          return;
        }
      }

      let code = 'c';
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
      const pVal = ['2', ...entries].join('.');
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
        parts.push(isCustom ? item.icon || 'utensils' : '');

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

    params.set('d', formatUrlDate(startDate));
    params.set('w', durationDays.toString());

    if ($settings.activeTab === 'edit') {
      params.set('m', 'e');
    } else if ($settings.activeTab === 'shop') {
      params.set('m', 's');
    } else if ($settings.activeTab === 'history') {
      params.set('m', 'h');
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
  startDate: string;
  durationDays: number;
  workWeekOnly: boolean;
  activeTab: 'edit' | 'view' | 'shop' | 'history';
  hasValidParams: boolean;
} {
  const params = new URLSearchParams(searchString);
  let hasValidParams = false;
  const newPlan: PlannedItem[] = [];

  // Parse start date d=YYYYMMDD
  let startDate = getMondayOfWeek();
  if (params.has('d')) {
    const parsedD = parseUrlDate(params.get('d') || '');
    if (parsedD) {
      startDate = parsedD;
      hasValidParams = true;
    }
  }

  // Parse duration w=1..21
  let durationDays = 5; // Default workweek
  let workWeekOnly = true;
  if (params.has('w') || params.has('week')) {
    hasValidParams = true;
    const wVal = params.get('w') || params.get('week');
    if (wVal === '7') {
      durationDays = 7;
      workWeekOnly = false;
    } else {
      const parsedW = parseInt(wVal || '', 10);
      if (!isNaN(parsedW) && parsedW >= 1 && parsedW <= 21) {
        durationDays = parsedW;
        workWeekOnly = durationDays === 5;
      }
    }
  }

  if (params.has('p')) {
    const pVal = params.get('p') || '';
    const parts = pVal.split('.');
    const version = parts[0];

    if (version === '2') {
      hasValidParams = true;
      const entries = parts.slice(1);
      entries.forEach((entry) => {
        if (!entry) {
          return;
        }

        let dayCodeStr: string;
        let restStr: string;

        if (entry.startsWith('S') || entry.startsWith('s')) {
          dayCodeStr = 'S';
          restStr = entry.slice(1);
        } else {
          let letterIdx = -1;
          for (let i = 0; i < entry.length; i++) {
            const ch = entry.charAt(i);
            if (
              (ch >= 'a' && ch <= 'z') ||
              (ch >= 'A' && ch <= 'Z') ||
              ch === '/'
            ) {
              letterIdx = i;
              break;
            }
          }

          if (letterIdx !== -1) {
            dayCodeStr = entry.slice(0, letterIdx);
            restStr = entry.slice(letterIdx);
          } else {
            dayCodeStr = entry.charAt(0);
            restStr = entry.slice(1);
          }
        }

        if (!restStr) {
          return;
        }

        let targetDateStr = 'supplemental';
        if (dayCodeStr !== 'S') {
          const offsetDays = parseInt(dayCodeStr, 10);
          if (!isNaN(offsetDays)) {
            targetDateStr = formatIsoDate(addDays(startDate, offsetDays));
          }
        }

        let digitIndex = -1;
        for (let i = 0; i < restStr.length; i++) {
          const char = restStr.charAt(i);
          if (char >= '0' && char <= '9') {
            digitIndex = i;
            break;
          }
        }

        let code = restStr;
        let portions: number | null = null;
        if (digitIndex !== -1) {
          code = restStr.slice(0, digitIndex);
          portions = parseInt(restStr.slice(digitIndex), 10);
        }

        const isCustomCode = code === 'c' || code === 'custom';
        const permalink = isCustomCode
          ? undefined
          : codeToPermalink(code, recipes);
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
          date: targetDateStr,
        });
      });
    } else if (version === '1') {
      hasValidParams = true;
      const entries = parts.slice(1);
      entries.forEach((entry) => {
        if (!entry) {
          return;
        }

        const dayCode = entry.charAt(0);
        const dayAbbrev = CODE_TO_DAYS[dayCode];
        if (!dayAbbrev) {
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

        const isCustomCode = code === 'c' || code === 'custom';
        const permalink = isCustomCode
          ? undefined
          : codeToPermalink(code, recipes);
        const rec = permalink
          ? recipes.find((r) => r.permalink === permalink)
          : undefined;

        const defaultServings = rec ? rec.servings : 4;
        let scale = 1.0;
        if (portions !== null && !isNaN(portions)) {
          scale = portions / defaultServings;
        }

        let targetDateStr = 'supplemental';
        if (dayAbbrev !== 'supplemental') {
          const dayOffsetMap: Record<string, number> = {
            mon: 0,
            tue: 1,
            wed: 2,
            thu: 3,
            fri: 4,
            sat: 5,
            sun: 6,
          };
          const offset = dayOffsetMap[dayAbbrev] ?? 0;
          targetDateStr = formatIsoDate(addDays(startDate, offset));
        }

        newPlan.push({
          instanceId: generateInstanceId(),
          permalink: permalink || undefined,
          scale,
          date: targetDateStr,
        });
      });
    }
  } else {
    // Legacy fallback for query params like ?mon=rec1
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
    const dayOffsetMap: Record<string, number> = {
      mon: 0,
      tue: 1,
      wed: 2,
      thu: 3,
      fri: 4,
      sat: 5,
      sun: 6,
    };
    DAYS_LIST.forEach((dayAbbrev) => {
      const values = params.getAll(dayAbbrev);
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

          const isCustomCode = code === 'c' || code === 'custom';
          const permalink = isCustomCode
            ? undefined
            : codeToPermalink(code, recipes);

          let targetDateStr = 'supplemental';
          if (dayAbbrev !== 'supplemental') {
            const offset = dayOffsetMap[dayAbbrev] ?? 0;
            targetDateStr = formatIsoDate(addDays(startDate, offset));
          }

          newPlan.push({
            instanceId: generateInstanceId(),
            permalink: permalink || undefined,
            scale: isNaN(scale) ? 1.0 : scale,
            date: targetDateStr,
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
        const KNOWN_ICONS = new Set([
          'utensils',
          'chef-hat',
          'book',
          'pizza',
          'bowl',
          'bbq',
          'drink',
          'dessert',
          'salad',
          'sandwich',
          'breakfast',
          'pasta',
          'seafood',
          'tacos',
          'bread',
          'snack',
          'coffee',
          'rice',
        ]);

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
          let icon: string | undefined = undefined;
          let rawExtras: string[] = [];

          if (parts.length > 2) {
            if (KNOWN_ICONS.has(parts[2])) {
              icon = parts[2];
              rawExtras = parts.slice(3);
            } else if (parts[2] === '') {
              rawExtras = parts.slice(3);
            } else {
              rawExtras = parts.slice(2);
            }
          }

          const planItem = newPlan[idx];
          if (planItem) {
            if (title) {
              planItem.customTitle = title;
              planItem.permalink = undefined;
            }
            if (icon) {
              planItem.icon = icon;
            }
            if (rawExtras.length > 0) {
              planItem.extraIngredients = rawExtras.map((textStr: string) =>
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

  const rawMode = params.get('m') || params.get('mode');
  const activeTab: 'edit' | 'view' | 'shop' | 'history' =
    rawMode === 'e'
      ? 'edit'
      : rawMode === 's'
        ? 'shop'
        : rawMode === 'h'
          ? 'history'
          : 'view';

  return {
    plan: newPlan,
    startDate: formatIsoDate(startDate),
    durationDays,
    workWeekOnly,
    activeTab,
    hasValidParams,
  };
}
