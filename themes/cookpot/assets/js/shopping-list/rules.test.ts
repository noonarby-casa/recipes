import { describe, expect, test } from 'vitest';
// @ts-expect-error Node imports not available in front-end tsconfig
import * as fs from 'fs';
// @ts-expect-error Node imports not available in front-end tsconfig
import * as path from 'path';

declare const __dirname: string;
import { ITEM_RULES } from './rules';
import {
  CATEGORY_KEYWORDS,
  classifyItemToCategory,
  STORE_LAYOUTS,
} from './store-sections';
import { getConversionFactor } from './utils';

function getAllIngredientsFromContent(): string[] {
  // Path to content directory relative to this test file location
  const contentDir = path.resolve(__dirname, '../../../../../content');
  const ingredients: string[] = [];

  function scanDir(dir: string) {
    if (!fs.existsSync(dir)) {
      return;
    }
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (file.endsWith('.md')) {
        const text = fs.readFileSync(fullPath, 'utf-8');
        // Find ingredients block in TOML front matter
        const startIdx = text.indexOf('ingredients = [');
        if (startIdx !== -1) {
          const endIdx = text.indexOf('+++', startIdx);
          const ingredientsBlock = text.slice(startIdx, endIdx);
          // Match all items like: item = "butter"
          const itemMatches = ingredientsBlock.match(/item\s*=\s*"([^"]+)"/g);
          if (itemMatches) {
            itemMatches.forEach((m: string) => {
              const itemMatch = m.match(/"([^"]+)"/);
              if (itemMatch) {
                ingredients.push(itemMatch[1]);
              }
            });
          }
        }
      }
    }
  }

  scanDir(contentDir);
  return Array.from(new Set(ingredients));
}

describe('Static configuration and recipe database tests', () => {
  test('no duplicate keywords across categories', () => {
    const allKeywords = new Set<string>();
    const duplicates: string[] = [];
    for (const cat of CATEGORY_KEYWORDS) {
      for (const kw of cat.keywords) {
        if (allKeywords.has(kw)) {
          duplicates.push(`${kw} (in category: ${cat.category})`);
        }
        allKeywords.add(kw);
      }
    }
    expect(duplicates).toEqual([]);
  });

  test('no unit equivalence loops or inconsistencies', () => {
    for (const rule of ITEM_RULES) {
      if (!rule.unitEquivalences) {
        continue;
      }
      for (const [unit, eq] of Object.entries(rule.unitEquivalences)) {
        const inverse = rule.unitEquivalences[eq.base];
        if (inverse && inverse.base === unit) {
          const product = eq.factor * inverse.factor;
          expect(product).toBeCloseTo(1, 4);
        }
      }
    }
  });

  test('recipe database unmapped ingredients linter', () => {
    const ingredients = getAllIngredientsFromContent();
    const unmapped: string[] = [];

    for (const ing of ingredients) {
      const cat = classifyItemToCategory(ing);
      if (cat === 'other') {
        unmapped.push(ing);
      }
    }

    if (unmapped.length > 0) {
      console.warn(
        `\n[LINTER] Warning: Found ${unmapped.length} recipe ingredients falling back to "Other":`,
      );
      unmapped.sort().forEach((ing) => {
        console.warn(`  - ${ing}`);
      });
    }
  });

  test('store layouts package sizing integrity linter', () => {
    const recipeIngredients = new Set(
      getAllIngredientsFromContent().map((i) => i.toLowerCase().trim()),
    );
    const ruleCanonicalKeys = new Set(
      ITEM_RULES.map((rule) => rule.items[0].toLowerCase().trim()),
    );
    const ruleSynonyms = new Set(
      ITEM_RULES.flatMap((rule) =>
        rule.items.map((i) => i.toLowerCase().trim()),
      ),
    );

    for (const layout of STORE_LAYOUTS) {
      if (!layout.itemSizes) {
        continue;
      }

      for (const [itemName, sizes] of Object.entries(layout.itemSizes)) {
        const lowerItem = itemName.toLowerCase().trim();

        // 1. Key check: must be a canonical rule name, synonym, or exist in recipe database
        const isValidKey =
          ruleCanonicalKeys.has(lowerItem) ||
          ruleSynonyms.has(lowerItem) ||
          recipeIngredients.has(lowerItem);

        expect(
          isValidKey,
          `Layout "${layout.name}" defines package size for "${itemName}", but this item does not exist in ITEM_RULES or recipe ingredients.`,
        ).toBe(true);

        // Find associated rule if any
        const associatedRule = ITEM_RULES.find((rule) =>
          rule.items.some((i) => i.toLowerCase().trim() === lowerItem),
        );

        // 2. Unit check: must be universal or defined in unitEquivalences
        for (const [, unit] of sizes) {
          const isUniversal =
            getConversionFactor(unit, 'teaspoon') > 0 ||
            getConversionFactor(unit, 'pound') > 0;

          let isCustomEquivalent = false;
          if (associatedRule?.unitEquivalences) {
            const firstEq = Object.values(associatedRule.unitEquivalences)[0];
            const baseUnit = firstEq ? firstEq.base : '';
            isCustomEquivalent =
              unit === baseUnit ||
              Object.keys(associatedRule.unitEquivalences).includes(unit);
          }

          expect(
            isUniversal ||
              isCustomEquivalent ||
              unit === lowerItem ||
              unit === itemName,
            `Layout "${layout.name}" item "${itemName}" specifies unit "${unit}", which is not a universal unit and not defined in the item's unitEquivalences in rules.ts.`,
          ).toBe(true);
        }
      }
    }
  });
});
