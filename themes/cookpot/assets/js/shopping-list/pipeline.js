import { parseIngredientText, formatCookingNumber } from '../scaler.js';
import { cleanPrepTerms, getSingularUnit, parseNoteToArray, abbreviateNote, isVolumeUnit, getPluralizedUnit, getButterExplanation, convertVolume } from './utils.js';
import { convertIngredient } from './converters.js';
import { TO_TEASPOONS } from './config.js';

/**
 * Extracts raw ingredients from DOM element attributes or text content, cleans preparation
 * terms, scales their amounts, and aggregates items with matching name/unit.
 */
export function getMergedIngredients(scale, rawItems = null) {
  const items = rawItems || document.querySelectorAll('.recipe-ingredient');
  const parsedMap = new Map();
  const unquantified = [];

  const validScale = (typeof scale === 'number' && !isNaN(scale)) ? scale : 1.0;

  items.forEach(el => {
    let baseQty = el.dataset.baseQty !== undefined ? parseFloat(el.dataset.baseQty) : null;
    let unit = el.dataset.unit || '';
    let rest = el.dataset.rest || '';

    if (baseQty === null || isNaN(baseQty)) {
      const parsed = parseIngredientText(el.textContent.trim());
      if (parsed.quantity !== null && !isNaN(parsed.quantity)) {
        baseQty = parsed.quantity;
        unit = parsed.unit;
        rest = parsed.rest;
      } else {
        baseQty = null;
      }
    }

    const rawRest = rest || el.textContent.trim();
    const rawRestLower = rawRest.toLowerCase();
    if (rawRestLower.includes('pasta water') || rawRestLower.includes('cooking water') || rawRestLower.includes('reserved water')) {
      return; // skip completely
    }
    const cleanedRest = cleanPrepTerms(rawRest);
    const isMinced = el.textContent.toLowerCase().includes('minced');

    if (baseQty === null || isNaN(baseQty)) {
      unquantified.push({ 
        scaledQty: null, 
        unit: '', 
        rest: cleanPrepTerms(el.textContent.trim()), 
        isMinced 
      });
    } else {
      const scaledQty = baseQty * validScale;
      if (isNaN(scaledQty)) {
        unquantified.push({ 
          scaledQty: null, 
          unit: '', 
          rest: cleanedRest, 
          isMinced 
        });
      } else {
        const normUnit = getSingularUnit(unit);
        const key = `${normUnit}_${cleanedRest.toLowerCase()}`;
        
        if (parsedMap.has(key)) {
          const existing = parsedMap.get(key);
          existing.scaledQty += scaledQty;
          if (isMinced) {
            existing.isMinced = true;
          }
        } else {
          parsedMap.set(key, { scaledQty, unit, rest: cleanedRest, isMinced });
        }
      }
    }
  });

  return [...parsedMap.values(), ...unquantified];
}

/**
 * Combines two converted commercial package items of matching types, aggregating quantities, 
 * correcting pluralized units, and merging explanation notes.
 */
export function mergeConvertedItems(item1, item2) {
  let qty = null;
  const isLemonOrLime = item1.rest.toLowerCase().includes('lemon') || item1.rest.toLowerCase().includes('lime') || 
                        item1.unit.toLowerCase().includes('lemon') || item1.unit.toLowerCase().includes('lime') ||
                        item2.rest.toLowerCase().includes('lemon') || item2.rest.toLowerCase().includes('lime') || 
                        item2.unit.toLowerCase().includes('lemon') || item2.unit.toLowerCase().includes('lime');

  let juiceQty = null;
  let zestWholeQty = null;

  if (isLemonOrLime) {
    const j1 = item1.juiceQty !== undefined ? item1.juiceQty : 0;
    const z1 = item1.zestWholeQty !== undefined ? item1.zestWholeQty : (item1.juiceQty === undefined ? (item1.qty || 0) : 0);
    const j2 = item2.juiceQty !== undefined ? item2.juiceQty : 0;
    const z2 = item2.zestWholeQty !== undefined ? item2.zestWholeQty : (item2.juiceQty === undefined ? (item2.qty || 0) : 0);

    const totalJuice = j1 + j2;
    const totalZestWhole = z1 + z2;
    qty = Math.max(totalJuice, totalZestWhole);
    juiceQty = totalJuice;
    zestWholeQty = totalZestWhole;
  } else {
    if (item1.qty !== null && item2.qty !== null) {
      qty = item1.qty + item2.qty;
    } else if (item1.qty !== null) {
      qty = item1.qty;
    } else if (item2.qty !== null) {
      qty = item2.qty;
    }
  }

  let unit = item1.unit;
  if (qty !== null && qty > 1) {
    const plurals = {
      lemon: 'lemons',
      lime: 'limes',
      head: 'heads',
      root: 'roots',
      can: 'cans',
      bundle: 'bundles',
      bottle: 'bottles',
      jar: 'jars',
      box: 'boxes',
      package: 'packages',
      container: 'containers',
      'quart (32 fl oz)': 'quarts (32 fl oz)',
      'quart (32 oz)': 'quarts (32 oz)',
      'pint (16 fl oz)': 'pints (16 fl oz)',
      'pint (16 oz)': 'pints (16 oz)',
      'half-pint (8 oz)': 'half-pints (8 oz)'
    };
    unit = plurals[unit] || unit;
  } else if (qty !== null && qty <= 1) {
    unit = getSingularUnit(unit);
  }

  const isItem1Lemon = item1.rest.toLowerCase().includes('lemon') || item1.unit.toLowerCase().includes('lemon');
  const isItem2Lemon = item2.rest.toLowerCase().includes('lemon') || item2.unit.toLowerCase().includes('lemon');
  const isItem1Lime = item1.rest.toLowerCase().includes('lime') || item1.unit.toLowerCase().includes('lime');
  const isItem2Lime = item2.rest.toLowerCase().includes('lime') || item2.unit.toLowerCase().includes('lime');

  let rest = item1.rest;
  if (isItem1Lemon && isItem2Lemon) {
    if (item1.rest !== item2.rest) {
      rest = item1.rest === 'for juice' ? item2.rest : item1.rest;
      unit = '';
    }
  } else if (isItem1Lime && isItem2Lime) {
    if (item1.rest !== item2.rest) {
      rest = item1.rest === 'for juice' ? item2.rest : item1.rest;
      unit = '';
    }
  }

  if (unit === '') {
    if (qty !== null && qty > 1) {
      rest = rest.replace(/\blemon\b/gi, 'lemons').replace(/\blime\b/gi, 'limes');
    } else if (qty !== null) {
      rest = rest.replace(/\blemons\b/gi, 'lemon').replace(/\blimes\b/gi, 'lime');
    }
  }

  let note = '';
  if (item1.note && item2.note) {
    const arr1 = parseNoteToArray(item1.note);
    const arr2 = parseNoteToArray(item2.note);
    const mergedArr = mergeNotesArrays(arr1, arr2);
    note = formatNotesArray(mergedArr);
  } else {
    note = item1.note || item2.note || '';
  }

  let isStaple = item1.isStaple && item2.isStaple;
  if (rest.toLowerCase() === 'butter' && (unit === 'stick' || unit === 'sticks')) {
    isStaple = qty !== null && qty < 4;
  }

  return {
    qty,
    unit,
    rest,
    note,
    isStaple,
    juiceQty,
    zestWholeQty
  };
}

/**
 * Combines note collections by grouping matching text tags, normalizing units to the smallest unit,
 * and aggregating numeric values.
 */
function mergeNotesArrays(arr1, arr2) {
  const merged = [];
  const temp = [...arr1, ...arr2];
  
  const groups = new Map();
  temp.forEach(item => {
    const key = `${item.rest.trim()}`;
    if (groups.has(key)) {
      groups.get(key).push(item);
    } else {
      groups.set(key, [item]);
    }
  });
  
  for (const [key, items] of groups.entries()) {
    if (items.length === 1) {
      merged.push(items[0]);
    } else {
      const firstUnit = getSingularUnit(items[0].unit);
      const sameUnit = items.every(it => getSingularUnit(it.unit) === firstUnit);
      const allVolume = items.every(it => it.unit && isVolumeUnit(it.unit) && it.qty !== null);
      
      if (sameUnit) {
        let totalQty = 0;
        items.forEach(it => {
          if (it.qty !== null) totalQty += it.qty;
        });
        
        let explanation = '';
        const isButter = items.some(it => it.explanation && (it.explanation.includes('stick') || it.explanation.includes('lb')));
        if (isButter) {
          explanation = getButterExplanation(firstUnit);
        } else {
          const found = items.find(it => it.explanation);
          if (found) explanation = found.explanation;
        }
        
        merged.push({
          prefix: '',
          qty: totalQty,
          unit: totalQty > 1 ? getPluralizedUnit(firstUnit) : firstUnit,
          rest: items[0].rest,
          explanation: explanation
        });
      } else if (allVolume) {
        let smallestUnit = items[0].unit;
        let smallestFactor = TO_TEASPOONS[getSingularUnit(smallestUnit).toLowerCase()] || 999999;
        
        items.forEach(it => {
          const sing = getSingularUnit(it.unit).toLowerCase();
          const factor = TO_TEASPOONS[sing] || 999999;
          if (factor < smallestFactor) {
            smallestFactor = factor;
            smallestUnit = it.unit;
          }
        });
        
        const targetSingular = getSingularUnit(smallestUnit);
        let totalQty = 0;
        items.forEach(it => {
          totalQty += convertVolume(it.qty, it.unit, targetSingular);
        });
        
        let explanation = '';
        const isButter = items.some(it => it.explanation && (it.explanation.includes('stick') || it.explanation.includes('lb')));
        if (isButter) {
          explanation = getButterExplanation(targetSingular);
        } else {
          const found = items.find(it => it.explanation);
          if (found) explanation = found.explanation;
        }
        
        merged.push({
          prefix: '',
          qty: totalQty,
          unit: totalQty > 1 ? getPluralizedUnit(targetSingular) : targetSingular,
          rest: items[0].rest,
          explanation: explanation
        });
      } else {
        items.forEach(it => merged.push(it));
      }
    }
  }
  
  return merged;
}

/**
 * Serializes merged note arrays back into formatted, abbreviated instruction strings prefixing 'need'.
 */
function formatNotesArray(arr) {
  const measParts = arr.map(item => {
    if (item.qty === null) return item.rest;
    const formattedQty = formatCookingNumber(item.qty);
    const displayUnit = item.unit ? ' ' + item.unit : '';
    const displayRest = item.rest ? ' ' + item.rest : '';
    const displayExp = item.explanation ? ` (${item.explanation})` : '';
    return `${formattedQty}${displayUnit}${displayRest}${displayExp}`;
  });
  
  return abbreviateNote('need ' + measParts.join(' + '));
}

/**
 * Runs the complete processing pipeline on the recipe ingredients. Merges inputs,
 * converts units, aggregates package duplicates, and splits results into buy list and staple list.
 */
export function processShoppingList(scale, rawItems = null) {
  const rawIngredients = getMergedIngredients(scale, rawItems);
  const convertedItems = rawIngredients.map(item => convertIngredient(item));

  const convertedMap = new Map();
  convertedItems.forEach(converted => {
    let normUnit = getSingularUnit(converted.unit);
    let restKey = converted.rest.toLowerCase().trim();

    const isLemon = (normUnit === 'lemon') || (restKey.includes('lemon') && !restKey.includes('extract') && !restKey.includes('grass') && !restKey.includes('pepper'));
    const isLime = (normUnit === 'lime') || (restKey.includes('lime') && !restKey.includes('extract') && !restKey.includes('leaf') && !restKey.includes('leaves'));

    if (isLemon) {
      normUnit = '';
      restKey = 'lemons';
    } else if (isLime) {
      normUnit = '';
      restKey = 'limes';
    }

    const key = `${normUnit}_${restKey}`;

    if (convertedMap.has(key)) {
      const existing = convertedMap.get(key);
      convertedMap.set(key, mergeConvertedItems(existing, converted));
    } else {
      convertedMap.set(key, converted);
    }
  });

  const finalItems = [...convertedMap.values()];

  const buyItems = [];
  const stapleItems = [];

  finalItems.forEach(converted => {
    if (converted.isStaple) {
      converted.note = '';
    } else if (converted.note) {
      converted.note = abbreviateNote(converted.note);
    }

    if (converted.isStaple) {
      stapleItems.push(converted);
    } else {
      buyItems.push(converted);
    }
  });

  return { buyItems, stapleItems };
}
