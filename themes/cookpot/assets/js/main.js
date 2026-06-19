document.addEventListener('DOMContentLoaded', () => {
  // --- Web Audio API Synth Alert Sounds ---
  let audioCtx = null;

  function initAudio() {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    } catch (err) {
      console.warn('Web Audio API not supported or blocked:', err);
    }
  }

  function playTone(freq, startTime, duration, type = 'sine', maxVolume = 0.15) {
    if (!audioCtx) return;
    
    const oscNode = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscNode.type = type;
    oscNode.frequency.setValueAtTime(freq, startTime);
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(maxVolume, startTime + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    oscNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscNode.start(startTime);
    oscNode.stop(startTime + duration);
  }

  function playLowerBoundChime() {
    initAudio();
    if (!audioCtx) return;
    
    const now = audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    const noteDuration = 0.18;
    const noteGap = 0.12;
    
    notes.forEach((freq, idx) => {
      playTone(freq, now + idx * noteGap, noteDuration, 'sine', 0.15);
    });
  }

  function playUpperBoundChime() {
    initAudio();
    if (!audioCtx) return;
    
    const now = audioCtx.currentTime;
    const pattern = [
      { freq: 659.25, time: now },
      { freq: 523.25, time: now + 0.12 },
      { freq: 659.25, time: now + 0.45 },
      { freq: 523.25, time: now + 0.57 }
    ];
    
    pattern.forEach(p => {
      playTone(p.freq, p.time, 0.15, 'triangle', 0.12);
    });
  }

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
    
    // If quantity is exactly 1, return singular form
    if (qty === 1) {
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

  // --- Initializing Parser and Storage ---
  const ingredients = document.querySelectorAll('.recipe-ingredient');
  const quantities = document.querySelectorAll('.recipe-quantity');

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

  // --- Scale & State Controller ---
  const slider = document.getElementById('recipe-scale-slider');
  const displayVal = document.getElementById('scale-display-val');
  const presetBtns = document.querySelectorAll('.scale-btn');

  function updateRecipeScale(factor) {
    // 1. Update visual metrics display
    if (displayVal) {
      // Remove training decimal digits for clean integers (1 instead of 1.00)
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

  // --- Event Listeners Setup ---

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

  // --- Client-side Timer Engine ---

  function parseDuration(durationStr) {
    const str = durationStr.toLowerCase().trim();
    
    // Regex to match range, e.g. "5-7 minutes", "30-45 seconds", "1-2 hours"
    const rangeRegex = /^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)\s*(hour|hours|hr|hrs|h|minute|minutes|min|mins|m|second|seconds|sec|secs|s)$/;
    // Regex to match single, e.g. "10 minutes", "45 seconds", "1.5 hours"
    const singleRegex = /^(\d+(?:\.\d+)?)\s*(hour|hours|hr|hrs|h|minute|minutes|min|mins|m|second|seconds|sec|secs|s)$/;
    
    let minVal = 0;
    let maxVal = 0;
    let unit = '';
    
    let match = str.match(rangeRegex);
    if (match) {
      minVal = parseFloat(match[1]);
      maxVal = parseFloat(match[2]);
      unit = match[3];
    } else {
      match = str.match(singleRegex);
      if (match) {
        minVal = parseFloat(match[1]);
        maxVal = minVal;
        unit = match[2];
      } else {
        return null;
      }
    }
    
    let multiplier = 1;
    if (unit.startsWith('h')) {
      multiplier = 3600;
    } else if (unit.startsWith('m')) {
      multiplier = 60;
    } else if (unit.startsWith('s')) {
      multiplier = 1;
    }
    
    return {
      minSeconds: Math.round(minVal * multiplier),
      maxSeconds: Math.round(maxVal * multiplier)
    };
  }

  function formatTime(seconds) {
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const hrs = Math.floor(absSeconds / 3600);
    const mins = Math.floor((absSeconds % 3600) / 60);
    const secs = absSeconds % 60;
    
    let display = '';
    if (hrs > 0) {
      display += `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      display += `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    return isNegative ? `-${display}` : display;
  }

  const timers = document.querySelectorAll('.recipe-timer');

  timers.forEach(timerContainer => {
    const rawDuration = timerContainer.dataset.duration;
    if (!rawDuration) return;

    const parsed = parseDuration(rawDuration);
    if (!parsed) {
      console.warn(`Could not parse duration: "${rawDuration}"`);
      return;
    }

    const { minSeconds, maxSeconds } = parsed;
    let elapsed = 0;
    let intervalId = null;

    const btn = timerContainer.querySelector('.recipe-timer-btn');
    const resetBtn = timerContainer.querySelector('.recipe-timer-reset');
    const iconSpan = btn.querySelector('.timer-icon');
    const labelSpan = btn.querySelector('.timer-label');

    function updateDisplay() {
      const remaining = maxSeconds - elapsed;
      
      if (elapsed === 0) {
        labelSpan.textContent = rawDuration;
        iconSpan.textContent = '▶';
        timerContainer.classList.remove('has-started', 'is-running', 'is-in-range', 'is-beyond-range');
        return;
      }

      labelSpan.textContent = formatTime(remaining);

      if (elapsed > maxSeconds) {
        timerContainer.classList.add('is-beyond-range');
        timerContainer.classList.remove('is-in-range');
      } else if (elapsed >= minSeconds) {
        timerContainer.classList.add('is-in-range');
        timerContainer.classList.remove('is-beyond-range');
      } else {
        timerContainer.classList.remove('is-in-range', 'is-beyond-range');
      }

      timerContainer.classList.add('has-started');
      if (intervalId) {
        timerContainer.classList.add('is-running');
        iconSpan.textContent = '⏸';
      } else {
        timerContainer.classList.remove('is-running');
        iconSpan.textContent = '▶';
      }
    }

    function startTimer() {
      if (intervalId) return;
      intervalId = setInterval(() => {
        elapsed++;
        updateDisplay();

        // Sound alert triggers when crossing bounds
        if (minSeconds === maxSeconds) {
          if (elapsed === maxSeconds) {
            playUpperBoundChime();
          }
        } else {
          if (elapsed === minSeconds) {
            playLowerBoundChime();
          } else if (elapsed === maxSeconds) {
            playUpperBoundChime();
          }
        }
      }, 1000);
      updateDisplay();
    }

    function pauseTimer() {
      if (!intervalId) return;
      clearInterval(intervalId);
      intervalId = null;
      updateDisplay();
    }

    function resetTimer() {
      pauseTimer();
      elapsed = 0;
      updateDisplay();
    }

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      initAudio(); // Initialize audio context on user interaction
      if (intervalId) {
        pauseTimer();
      } else {
        startTimer();
      }
    });

    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      resetTimer();
    });
  });

  // --- Font Size Scaler ---
  const fontBtns = document.querySelectorAll('.font-btn');
  const instructionsCol = document.querySelector('.instructions-column');
  const storageKey = 'recipe-instructions-font-size';

  const sizeMap = {
    smaller: '1.0rem',
    default: '1.2rem',
    larger: '1.45rem'
  };

  function setInstructionFontSize(size) {
    if (!instructionsCol) return;
    if (!sizeMap[size]) {
      size = 'default';
    }

    // Apply font size CSS variable to instructions column
    instructionsCol.style.setProperty('--instructions-font-size', sizeMap[size]);

    // Toggle active classes on controls
    fontBtns.forEach(btn => {
      if (btn.dataset.size === size) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Save preference globally for the site
    localStorage.setItem(storageKey, size);
  }

  fontBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const size = btn.dataset.size;
      setInstructionFontSize(size);
    });
  });

  // Load saved preference or fall back to default
  const savedFontSize = localStorage.getItem(storageKey) || 'default';
  setInstructionFontSize(savedFontSize);

  // Initialize the scaling output view to 1.0x (normal)
  updateRecipeScale(1.0);
});
