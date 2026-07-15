import {
  getAdaptiveUnit,
  formatCookingNumber,
  formatRecipeIngredientHTML,
} from './units';
import { parseSimpleQty } from './simple-parser';

export function initScaler(): void {
  const quantities = document.querySelectorAll<HTMLElement>('.recipe-quantity');
  const decBtn = document.getElementById('recipe-dec-btn');
  const incBtn = document.getElementById('recipe-inc-btn');
  const servingCountEl = document.getElementById('recipe-serving-count');
  const scalePanel = document.querySelector<HTMLElement>('.recipe-scale-panel');

  if (!quantities.length && (!decBtn || !incBtn || !servingCountEl)) {
    return;
  }

  const baseServings =
    scalePanel && scalePanel.dataset.baseServings
      ? parseInt(scalePanel.dataset.baseServings, 10)
      : 4;

  let currentServings = baseServings;

  const urlParams = new URLSearchParams(window.location.search);
  const servingsParam = urlParams.get('servings');
  if (servingsParam) {
    const parsedServings = parseInt(servingsParam, 10);
    if (!isNaN(parsedServings) && parsedServings > 0) {
      currentServings = parsedServings;
    }
  }

  function updateRecipeScale(factor: number): void {
    if (servingCountEl) {
      servingCountEl.textContent = currentServings.toString();
    }

    // 1. Update recipe-ingredient list items (re-rendering the full ingredient HTML)
    const ingredients =
      document.querySelectorAll<HTMLElement>('.recipe-ingredient');
    ingredients.forEach((el) => {
      const rawQty = el.dataset.qty || '';
      let qty: number | [number, number] | null = null;
      if (rawQty) {
        if (rawQty.includes('-') || rawQty.includes(',')) {
          const parts = rawQty.split(/[-,]/).map((p) => parseFloat(p.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            qty = [parts[0] * factor, parts[1] * factor];
          }
        } else {
          const parsed = parseFloat(rawQty);
          if (!isNaN(parsed)) {
            qty = parsed * factor;
          }
        }
      }

      const unit = el.dataset.unit || '';
      const item = el.dataset.item || '';
      const desc = el.dataset.desc || '';
      const prep = el.dataset.prep || '';

      let alt:
        | {
            qty: number | [number, number] | null;
            unit: string;
            item: string;
            desc: string;
            prep: string;
          }
        | undefined = undefined;

      if (el.dataset.altItem || el.dataset.altQty) {
        let altQty: number | [number, number] | null = null;
        const rawAltQty = el.dataset.altQty || '';
        if (rawAltQty) {
          if (rawAltQty.includes('-') || rawAltQty.includes(',')) {
            const parts = rawAltQty
              .split(/[-,]/)
              .map((p) => parseFloat(p.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
              altQty = [parts[0] * factor, parts[1] * factor];
            }
          } else {
            const parsed = parseFloat(rawAltQty);
            if (!isNaN(parsed)) {
              altQty = parsed * factor;
            }
          }
        }

        alt = {
          qty: altQty,
          unit: el.dataset.altUnit || '',
          item: el.dataset.altItem || '',
          desc: el.dataset.altDesc || '',
          prep: el.dataset.altPrep || '',
        };
      }

      const optional = el.dataset.optional === 'true';

      el.innerHTML = formatRecipeIngredientHTML(
        qty,
        unit,
        item,
        desc,
        prep,
        alt,
        optional,
      );
    });

    // 2. Update standalone quantity spans (e.g. in step instructions)
    const standaloneQuantities =
      document.querySelectorAll<HTMLElement>('.recipe-quantity');
    standaloneQuantities.forEach((el) => {
      // Skip if inside a recipe-ingredient list item (already updated)
      if (el.closest('.recipe-ingredient')) {
        return;
      }

      if (!el.dataset.baseQty) {
        const baseText = el.dataset.baseText || el.textContent || '';
        const parsed = parseSimpleQty(baseText);
        if (parsed.qty !== null) {
          el.dataset.baseQty = parsed.qty.toString();
          el.dataset.unit = parsed.unit;
        }
      }

      if (el.dataset.baseQty) {
        const rawQty = el.dataset.baseQty;
        const unit = el.dataset.unit || '';
        el.textContent = scaleQuantityText(rawQty, unit, factor);
      }
    });

    document.dispatchEvent(
      new CustomEvent('recipe:scale', { detail: { factor } }),
    );
  }

  if (decBtn && incBtn && servingCountEl) {
    decBtn.addEventListener('click', () => {
      if (currentServings > 1) {
        currentServings--;
        updateRecipeScale(currentServings / baseServings);
      }
    });
    incBtn.addEventListener('click', () => {
      currentServings++;
      updateRecipeScale(currentServings / baseServings);
    });
  }

  updateRecipeScale(currentServings / baseServings);
}

export function scaleQuantityText(
  rawQty: string,
  unit: string,
  factor: number,
): string {
  let newQtyStr = '';
  let qtyForPlural = 1;

  if (rawQty.includes('-') || rawQty.includes(',')) {
    const parts = rawQty.split(/[-,]/).map((p) => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const q1 = parts[0] * factor;
      const q2 = parts[1] * factor;
      qtyForPlural = q2;
      newQtyStr = `${formatCookingNumber(q1)}-${formatCookingNumber(q2)}`;
    }
  } else {
    const baseQty = parseFloat(rawQty);
    if (!isNaN(baseQty)) {
      const newQty = baseQty * factor;
      qtyForPlural = newQty;
      newQtyStr = formatCookingNumber(newQty);
    }
  }

  if (!newQtyStr) {
    return unit;
  }

  const finalUnit = getAdaptiveUnit(qtyForPlural, unit);
  return `${newQtyStr}${finalUnit ? ' ' + finalUnit : ''}`;
}
