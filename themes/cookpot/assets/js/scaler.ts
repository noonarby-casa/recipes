import { getAdaptiveUnit, formatCookingNumber } from "./units";
import { VOLUME_UNITS, OTHER_UNITS } from "./shopping-list/config";
import { Ingredient, QuantitySegment } from "./shopping-list/types";
import { cleanPrepTerms } from "./shopping-list/utils";

export interface ParsedIngredient {
  quantity: number | null;
  unit: string;
  rest: string;
}

export interface IngredientSegment {
  type: "text" | "quantity";
  value: string;
  quantity: number | null;
  unit: string;
}

const MODIFIERS = [
  "extra-virgin",
  "extra virgin",
  "unsalted",
  "salted",
  "fresh",
  "frozen",
  "dried",
  "dry",
  "whole",
  "large",
  "medium",
  "small",
  "low-sodium",
  "low sodium",
  "grated",
  "minced",
  "diced",
  "chopped",
  "sliced",
  "shredded",
  "crushed",
  "melted",
  "softened",
  "beaten",
  "mashed",
  "ground",
  "fine",
  "finely",
  "coarse",
  "coarsely",
  "toasted",
  "warm",
  "cold",
  "hot",
  "sweet",
  "full-fat",
  "full fat",
  "fat-free",
  "fat free",
  "organic",
  "raw",
  "cooked",
  "powdered",
  "all-purpose",
  "all purpose",
  "packed",
  "light",
  "dark",
  "heavy",
  "whipping",
  "confectioners'",
  "confectioners",
  "granulated",
  "squeezed",
  "pure",
  "shelf-stable",
  "shelf stable",
];

// Match common culinary units dynamically compiled from config arrays
const allUnits = [...VOLUME_UNITS, ...OTHER_UNITS];
const sortedUnits = [...allUnits].sort((a, b) => b.length - a.length);
const escapedUnits = sortedUnits.map((u) =>
  u.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"),
);

// Helper to parse fractions (e.g., "1/2", "1 1/2") and decimals, supporting ranges
function parseNumeric(str: string): number {
  str = str.trim();
  const rangeParts = str.split(/\s*[-–]|\s+to\s+/i);
  if (
    rangeParts.length > 1 &&
    rangeParts[0].trim() !== "" &&
    rangeParts[1].trim() !== ""
  ) {
    const vals = rangeParts.map((p) => parseSingleNumeric(p));
    return Math.max(...vals);
  }
  return parseSingleNumeric(str);
}

function parseSingleNumeric(str: string): number {
  str = str.trim();
  if (str.includes("/")) {
    const parts = str.split(/\s+/);
    if (parts.length === 2) {
      // Mixed number e.g. "1 1/2"
      const whole = parseFloat(parts[0]);
      const fracParts = parts[1].split("/");
      return whole + parseFloat(fracParts[0]) / parseFloat(fracParts[1]);
    } else {
      // Simple fraction e.g. "1/2"
      const fracParts = parts[0].split("/");
      return parseFloat(fracParts[0]) / parseFloat(fracParts[1]);
    }
  }
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

export function parseIngredientSegments(text: string): IngredientSegment[] {
  const segments: IngredientSegment[] = [];
  let remainder = text.trim();

  const numPat = `(?:\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:\\.\\d+)?)`;
  const rangePat = `(?:${numPat}\\s*(?:-|–|\\s+to\\s+)\\s*${numPat})`;
  const combinedPat = `(?:${rangePat}|${numPat})`;

  // 1. Parse the starting quantity (which can have an optional unit)
  const startQtyRegex = new RegExp(`^(${combinedPat})`, "i");
  const startMatch = remainder.match(startQtyRegex);

  if (startMatch) {
    const qtyStr = startMatch[0];
    const quantity = parseNumeric(qtyStr);
    const afterQty = remainder.slice(qtyStr.length);

    const startUnitRegex = new RegExp(
      `^\\s*(${escapedUnits.join("|")})\\b`,
      "i",
    );
    const unitMatch = afterQty.match(startUnitRegex);
    let unit = "";
    let segmentText = qtyStr;

    if (unitMatch) {
      unit = unitMatch[1];
      const fullMatch = unitMatch[0];
      segmentText = qtyStr + fullMatch;
      remainder = afterQty.slice(fullMatch.length);
    } else {
      remainder = afterQty;
    }

    segments.push({
      type: "quantity",
      value: segmentText,
      quantity,
      unit,
    });
  }

  // 2. Scan the rest of the string for quantity-unit pairs
  const extraQtyRegex = new RegExp(
    "^(\\b" + combinedPat + ")\\s*(" + escapedUnits.join("|") + ")\\b",
    "i",
  );

  let currentText = "";
  while (remainder.length > 0) {
    const match = remainder.match(extraQtyRegex);
    if (match) {
      if (currentText) {
        segments.push({
          type: "text",
          value: currentText,
          quantity: null,
          unit: "",
        });
        currentText = "";
      }

      const fullMatchStr = match[0];
      const qtyVal = parseNumeric(match[1]);
      const unitVal = match[2];

      segments.push({
        type: "quantity",
        value: fullMatchStr,
        quantity: qtyVal,
        unit: unitVal,
      });

      remainder = remainder.slice(fullMatchStr.length);
    } else {
      currentText += remainder[0];
      remainder = remainder.slice(1);
    }
  }

  if (currentText) {
    segments.push({
      type: "text",
      value: currentText,
      quantity: null,
      unit: "",
    });
  }

  return segments;
}

export function scaleTextQuantities(text: string, scale: number): string {
  const segments = parseIngredientSegments(text);
  return segments
    .map((seg) => {
      if (seg.type === "quantity" && seg.quantity !== null) {
        const newQty = seg.quantity * scale;
        const formattedQty = formatCookingNumber(newQty);
        const adaptiveUnit = getAdaptiveUnit(newQty, seg.unit);
        return `${formattedQty}${adaptiveUnit ? " " + adaptiveUnit : ""}`;
      }
      return seg.value;
    })
    .join("");
}

export function parseIngredient(
  text: string,
  category: string | null = null,
  overrideItem?: string,
  overrideOptional?: boolean,
): Ingredient {
  let workingText = text.trim();

  // Detect optional flag
  let optional = false;
  if (overrideOptional !== undefined) {
    optional = overrideOptional;
  } else if (/\(optional\)/i.test(workingText)) {
    optional = true;
    workingText = workingText.replace(/\s*\(optional\)/i, "").trim();
  }

  // Detect parenthetical sizes (Edge Case 1)
  const SIZE_PAREN_REGEX =
    /\((\d+[-–]?\s*(?:to\s+)?\d*[-–]?\s*(?:ounces?|oz|pounds?|lb|grams?|g|cans?|fluid\s+ounces?|fl\s+oz|fl\.\s*oz))\)/i;
  const sizeMatch = workingText.match(SIZE_PAREN_REGEX);
  let sizeNote: string | undefined;
  if (sizeMatch) {
    sizeNote = sizeMatch[1];
    workingText = workingText
      .replace(SIZE_PAREN_REGEX, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Parse segments
  const segments = parseIngredientSegments(workingText);
  let quantity: number | null = null;
  let unit = "";
  let rest = workingText;
  const secondarySegments: QuantitySegment[] = [];

  if (segments.length > 0) {
    const first = segments[0];
    if (first.type === "quantity" && first.quantity !== null) {
      quantity = first.quantity;
      unit = first.unit;
      rest = segments
        .slice(1)
        .map((s) => s.value)
        .join("")
        .trim();

      // Subsequent quantity segments (secondary segments)
      segments.slice(1).forEach((seg) => {
        if (seg.type === "quantity" && seg.quantity !== null) {
          secondarySegments.push({
            quantity: seg.quantity,
            unit: seg.unit,
            text: seg.value,
          });
        }
      });
    }
  }

  // Suffix cleanups on rest
  const cleaned = cleanPrepTerms(rest);
  const finalRest = cleaned.rest;
  const prep = cleaned.prep;

  // Determine base item
  let item = overrideItem || "";
  if (!item) {
    let lowerRest = finalRest.toLowerCase();
    let matched = true;
    while (matched) {
      matched = false;
      for (const mod of MODIFIERS) {
        if (lowerRest === mod) {
          lowerRest = "";
          matched = true;
          break;
        } else if (lowerRest.startsWith(mod + " ")) {
          lowerRest = lowerRest.slice(mod.length + 1).trim();
          matched = true;
          break;
        }
      }
    }
    item = lowerRest.trim();
  }

  return {
    quantity,
    unit,
    item: item || finalRest.trim().toLowerCase(),
    rest: rest.trim(),
    prep,
    optional,
    secondarySegments,
    category,
    sizeNote,
  };
}

// Deprecated fallback for backward compatibility
export function parseIngredientText(text: string): ParsedIngredient {
  const ing = parseIngredient(text);
  return {
    quantity: ing.quantity,
    unit: ing.unit,
    rest: ing.rest,
  };
}

export function initScaler(): void {
  const ingredients =
    document.querySelectorAll<HTMLElement>(".recipe-ingredient");

  // Pre-parse and store base metrics for each ingredient item, and wrap all quantities in spans
  ingredients.forEach((el) => {
    const rawText = el.textContent || "";
    const overrideItem = el.dataset.item;
    const overrideOptional = el.dataset.optional === "true" ? true : undefined;
    const segments = parseIngredientSegments(rawText);
    const parsed = parseIngredient(
      rawText,
      null,
      overrideItem,
      overrideOptional,
    );

    el.dataset.baseQty =
      parsed.quantity !== null ? parsed.quantity.toString() : "";
    el.dataset.unit = parsed.unit;
    el.dataset.rest = parsed.rest;
    el.dataset.item = parsed.item;
    if (parsed.optional) {
      el.dataset.optional = "true";
    }
    if (parsed.sizeNote) {
      el.dataset.sizeNote = parsed.sizeNote;
    }

    if (segments.length > 0) {
      let newHTML = "";
      segments.forEach((seg) => {
        if (seg.type === "quantity" && seg.quantity !== null) {
          newHTML += `<span class="recipe-quantity" data-base-qty="${seg.quantity}" data-unit="${seg.unit}">${seg.value}</span>`;
        } else {
          newHTML += seg.value;
        }
      });
      el.innerHTML = newHTML;
    }
  });

  const quantities = document.querySelectorAll<HTMLElement>(".recipe-quantity");
  const decBtn = document.getElementById("recipe-dec-btn");
  const incBtn = document.getElementById("recipe-inc-btn");
  const servingCountEl = document.getElementById("recipe-serving-count");
  const scalePanel = document.querySelector<HTMLElement>(".recipe-scale-panel");

  if (
    !ingredients.length &&
    !quantities.length &&
    (!decBtn || !incBtn || !servingCountEl)
  )
    return;

  const baseServings =
    scalePanel && scalePanel.dataset.baseServings
      ? parseInt(scalePanel.dataset.baseServings, 10)
      : 4;

  let currentServings = baseServings;

  // Pre-parse and store base metrics for each instruction step inline quantity
  quantities.forEach((el) => {
    if (el.dataset.baseQty) return; // already set for dynamically created ingredient spans
    const rawText = el.dataset.baseText || el.textContent || "";
    const parsed = parseIngredient(rawText);
    el.dataset.baseQty =
      parsed.quantity !== null ? parsed.quantity.toString() : "";
    el.dataset.unit = parsed.unit;
  });

  function updateRecipeScale(factor: number): void {
    // 1. Update visual metrics display
    if (servingCountEl) {
      servingCountEl.textContent = currentServings.toString();
    }

    // 2. Loop over and re-render inline quantities inside steps & ingredients list
    quantities.forEach((el) => {
      if (el.dataset.baseQty) {
        const baseQty = parseFloat(el.dataset.baseQty);
        const unit = el.dataset.unit || "";

        const newQty = baseQty * factor;
        const formattedQty = formatCookingNumber(newQty);
        const adaptiveUnit = getAdaptiveUnit(newQty, unit);

        el.textContent = `${formattedQty}${adaptiveUnit ? " " + adaptiveUnit : ""}`;
      }
    });

    // Dispatch event to notify shopping list or other listeners
    document.dispatchEvent(
      new CustomEvent("recipe:scale", { detail: { factor } }),
    );
  }

  if (decBtn && incBtn && servingCountEl) {
    decBtn.addEventListener("click", () => {
      if (currentServings > 1) {
        currentServings--;
        updateRecipeScale(currentServings / baseServings);
      }
    });
    incBtn.addEventListener("click", () => {
      currentServings++;
      updateRecipeScale(currentServings / baseServings);
    });
  }

  // Initialize the scaling output view to 1.0x (normal)
  updateRecipeScale(1.0);
}
