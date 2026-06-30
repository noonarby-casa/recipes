import { getAdaptiveUnit, formatCookingNumber } from "./units";
import { VOLUME_UNITS, OTHER_UNITS } from "./shopping-list/config";

export interface ParsedIngredient {
  quantity: number | null;
  unit: string;
  rest: string;
}

// Match common culinary units dynamically compiled from config arrays
const allUnits = [...VOLUME_UNITS, ...OTHER_UNITS];
const sortedUnits = [...allUnits].sort((a, b) => b.length - a.length);
const escapedUnits = sortedUnits.map((u) =>
  u.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"),
);
const unitRegex = new RegExp(`^(${escapedUnits.join("|")})\\b`, "i");

// Helper to parse fractions (e.g., "1/2", "1 1/2") and decimals
function parseNumeric(str: string): number {
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
  return parseFloat(str);
}

export interface IngredientSegment {
  type: "text" | "quantity";
  value: string;
  quantity: number | null;
  unit: string;
}

export function parseIngredientSegments(text: string): IngredientSegment[] {
  const segments: IngredientSegment[] = [];
  let remainder = text.trim();

  // 1. Parse the starting quantity (which can have an optional unit)
  const startQtyRegex = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)/;
  const startMatch = remainder.match(startQtyRegex);

  if (startMatch) {
    const qtyStr = startMatch[0];
    const quantity = parseNumeric(qtyStr);
    let afterQty = remainder.slice(qtyStr.length);

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
    "^(\\b\\d+\\s+\\d+/\\d+|\\b\\d+/\\d+|\\b\\d+(?:\\.\\d+)?)\\s*(" +
      escapedUnits.join("|") +
      ")\\b",
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

// Parse a description string to extract quantity, unit, and the rest
export function parseIngredientText(text: string): ParsedIngredient {
  const segments = parseIngredientSegments(text);
  if (segments.length === 0) {
    return { quantity: null, unit: "", rest: text };
  }

  const first = segments[0];
  if (first.type === "quantity") {
    const restText = segments
      .slice(1)
      .map((s) => s.value)
      .join("")
      .trim();
    return {
      quantity: first.quantity,
      unit: first.unit,
      rest: restText,
    };
  }

  return {
    quantity: null,
    unit: "",
    rest: text,
  };
}

export function initScaler(): void {
  const ingredients =
    document.querySelectorAll<HTMLElement>(".recipe-ingredient");

  // Pre-parse and store base metrics for each ingredient item, and wrap all quantities in spans
  ingredients.forEach((el) => {
    const rawText = el.textContent || "";
    const segments = parseIngredientSegments(rawText);
    const parsed = parseIngredientText(rawText);

    el.dataset.baseQty =
      parsed.quantity !== null ? parsed.quantity.toString() : "";
    el.dataset.unit = parsed.unit;
    el.dataset.rest = parsed.rest;

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
  const slider = document.getElementById(
    "recipe-scale-slider",
  ) as HTMLInputElement | null;
  const displayVal = document.getElementById("scale-display-val");
  const presetBtns = document.querySelectorAll<HTMLElement>(".scale-btn");

  if (!ingredients.length && !quantities.length && !slider) return;

  // Pre-parse and store base metrics for each instruction step inline quantity
  quantities.forEach((el) => {
    if (el.dataset.baseQty) return; // already set for dynamically created ingredient spans
    const rawText = el.dataset.baseText || el.textContent || "";
    const parsed = parseIngredientText(rawText);
    el.dataset.baseQty =
      parsed.quantity !== null ? parsed.quantity.toString() : "";
    el.dataset.unit = parsed.unit;
  });

  function updateRecipeScale(factor: number): void {
    // 1. Update visual metrics display
    if (displayVal) {
      displayVal.textContent = factor.toFixed(2).replace(/\.00$/, "");
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

    // 4. Update Slider position
    if (slider && parseFloat(slider.value) !== factor) {
      slider.value = factor.toString();
    }

    // 5. Update Preset buttons active state styling
    presetBtns.forEach((btn) => {
      const btnVal = parseFloat(btn.dataset.val || "1.0");
      if (btnVal === factor) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Dispatch event to notify shopping list or other listeners
    document.dispatchEvent(
      new CustomEvent("recipe:scale", { detail: { factor } }),
    );
  }

  // Handle slide movement
  if (slider) {
    slider.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      const factor = parseFloat(target.value);
      updateRecipeScale(factor);
    });
  }

  // Handle preset clicks
  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const factor = parseFloat(btn.dataset.val || "1.0");
      updateRecipeScale(factor);
    });
  });

  // Initialize the scaling output view to 1.0x (normal)
  updateRecipeScale(1.0);
}
