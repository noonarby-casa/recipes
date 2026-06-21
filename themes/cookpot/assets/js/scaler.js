// Common cooking units and their singular/plural mapping
const plurals = {
  ounce: 'ounces',
  pound: 'pounds',
  cup: 'cups',
  teaspoon: 'teaspoons',
  tablespoon: 'tablespoons',
  clove: 'cloves',
  can: 'cans',
  gram: 'grams',
  small: 'small',
  large: 'large',
  medium: 'medium'
};

const singulars = {
  ounces: 'ounce',
  pounds: 'pound',
  cups: 'cup',
  teaspoons: 'teaspoon',
  tablespoons: 'tablespoon',
  cloves: 'clove',
  cans: 'can',
  grams: 'gram',
  small: 'small',
  large: 'large',
  medium: 'medium'
};

// Helper to parse fractions (e.g., "1/2", "1 1/2") and decimals
function parseNumeric(str) {
  str = str.trim();
  if (str.includes('/')) {
    const parts = str.split(/\s+/);
    if (parts.length === 2) {
      // Mixed number e.g. "1 1/2"
      const whole = parseFloat(parts[0]);
      const fracParts = parts[1].split('/');
      return whole + parseFloat(fracParts[0]) / parseFloat(fracParts[1]);
    } else {
      // Simple fraction e.g. "1/2"
      const fracParts = parts[0].split('/');
      return parseFloat(fracParts[0]) / parseFloat(fracParts[1]);
    }
  }
  return parseFloat(str);
}

// Parse a description string to extract quantity, unit, and the rest
function parseIngredientText(text) {
  text = text.trim();
  // Match Mixed fractions (1 1/2), normal fractions (1/2), and decimals/integers (1.5, 16)
  const qtyRegex = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)/;
  const match = text.match(qtyRegex);

  if (!match) {
    return { quantity: null, unit: '', rest: text };
  }

  const qtyStr = match[0];
  const quantity = parseNumeric(qtyStr);
  let remainder = text.slice(qtyStr.length).trim();

  // Match common culinary units
  const unitRegex = /^(ounces|ounce|pounds|pound|cups|cup|teaspoons|teaspoon|tablespoons|tablespoon|cloves|clove|cans|can|grams|gram|g|ml|small|large|medium)\b/i;
  const unitMatch = remainder.match(unitRegex);

  let unit = '';
  if (unitMatch) {
    unit = unitMatch[0];
    remainder = remainder.slice(unit.length).trim();
  }

  return {
    quantity: quantity,
    unit: unit,
    rest: remainder
  };
}

// Pluralization engine
function getAdaptiveUnit(qty, unit) {
  if (!unit) return '';
  const lowerUnit = unit.toLowerCase();
  
  // If quantity is less than or equal to 1, return singular form
  if (qty <= 1) {
    return singulars[lowerUnit] || unit;
  }
  // Otherwise, return plural form
  return plurals[lowerUnit] || unit;
}

// Formatting engine: rounds numbers and converts decimals to culinary fractions
function formatCookingNumber(val) {
  if (val <= 0) return '0';

  const rounded = Math.round(val * 1000) / 1000;
  const whole = Math.floor(rounded);
  const dec = Math.round((rounded - whole) * 1000) / 1000;

  const fractionMap = [
    { dec: 0.125, str: '1/8' },
    { dec: 0.25, str: '1/4' },
    { dec: 0.333, str: '1/3' },
    { dec: 0.375, str: '3/8' },
    { dec: 0.5, str: '1/2' },
    { dec: 0.625, str: '5/8' },
    { dec: 0.667, str: '2/3' },
    { dec: 0.75, str: '3/4' },
    { dec: 0.875, str: '7/8' }
  ];

  if (dec < 0.05) {
    return whole > 0 ? whole.toString() : '0';
  }
  if (dec > 0.95) {
    return (whole + 1).toString();
  }

  // Locate the closest matching fraction
  let closest = fractionMap[0];
  let minDiff = Math.abs(dec - closest.dec);
  for (let i = 1; i < fractionMap.length; i++) {
    const diff = Math.abs(dec - fractionMap[i].dec);
    if (diff < minDiff) {
      minDiff = diff;
      closest = fractionMap[i];
    }
  }

  // Format as a fraction if it is close enough to standard cooking increments
  if (minDiff < 0.06) {
    return whole > 0 ? `${whole} ${closest.str}` : closest.str;
  }

  // Otherwise, display as a clean, concise decimal (e.g. 1.2 or 0.7)
  return rounded.toFixed(2).replace(/\.?0+$/, '');
}

export function initScaler() {
  const ingredients = document.querySelectorAll('.recipe-ingredient');
  const quantities = document.querySelectorAll('.recipe-quantity');
  const slider = document.getElementById('recipe-scale-slider');
  const displayVal = document.getElementById('scale-display-val');
  const presetBtns = document.querySelectorAll('.scale-btn');

  if (!ingredients.length && !quantities.length && !slider) return;

  // Pre-parse and store base metrics for each ingredient item
  ingredients.forEach(el => {
    const rawText = el.textContent;
    const parsed = parseIngredientText(rawText);
    if (parsed.quantity !== null) {
      el.dataset.baseQty = parsed.quantity;
      el.dataset.unit = parsed.unit;
      el.dataset.rest = parsed.rest;
    }
  });

  // Pre-parse and store base metrics for each instruction step inline quantity
  quantities.forEach(el => {
    const rawText = el.dataset.baseText || el.textContent;
    const parsed = parseIngredientText(rawText);
    if (parsed.quantity !== null) {
      el.dataset.baseQty = parsed.quantity;
      el.dataset.unit = parsed.unit;
    }
  });

  function updateRecipeScale(factor) {
    // 1. Update visual metrics display
    if (displayVal) {
      displayVal.textContent = factor.toFixed(2).replace(/\.00$/, '');
    }

    // 2. Loop over and re-render the ingredients list
    ingredients.forEach(el => {
      if (el.dataset.baseQty) {
        const baseQty = parseFloat(el.dataset.baseQty);
        const unit = el.dataset.unit;
        const rest = el.dataset.rest;

        const newQty = baseQty * factor;
        const formattedQty = formatCookingNumber(newQty);
        const adaptiveUnit = getAdaptiveUnit(newQty, unit);

        el.innerHTML = `<span class="qty-num">${formattedQty}</span>${adaptiveUnit ? ' ' + adaptiveUnit : ''} ${rest}`;
      }
    });

    // 3. Loop over and re-render inline quantities inside steps
    quantities.forEach(el => {
      if (el.dataset.baseQty) {
        const baseQty = parseFloat(el.dataset.baseQty);
        const unit = el.dataset.unit;

        const newQty = baseQty * factor;
        const formattedQty = formatCookingNumber(newQty);
        const adaptiveUnit = getAdaptiveUnit(newQty, unit);

        el.textContent = `${formattedQty}${adaptiveUnit ? ' ' + adaptiveUnit : ''}`;
      }
    });

    // 4. Update Slider position
    if (slider && parseFloat(slider.value) !== factor) {
      slider.value = factor;
    }

    // 5. Update Preset buttons active state styling
    presetBtns.forEach(btn => {
      const btnVal = parseFloat(btn.dataset.val);
      if (btnVal === factor) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Handle slide movement
  if (slider) {
    slider.addEventListener('input', (e) => {
      const factor = parseFloat(e.target.value);
      updateRecipeScale(factor);
    });
  }

  // Handle preset clicks
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const factor = parseFloat(btn.dataset.val);
      updateRecipeScale(factor);
    });
  });

  // Initialize the scaling output view to 1.0x (normal)
  updateRecipeScale(1.0);
}
