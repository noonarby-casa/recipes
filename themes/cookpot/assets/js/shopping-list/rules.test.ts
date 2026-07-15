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
import { IngredientInput } from './types';
import { validateIngredient } from './validator';

interface RecipeIngredients {
  title: string;
  filepath: string;
  ingredients: IngredientInput[];
}

function getRecipeIngredients(): RecipeIngredients[] {
  const contentDir = path.resolve(__dirname, '../../../../../content');
  const recipes: RecipeIngredients[] = [];

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
      } else if (file.endsWith('.md') && file !== '_index.md') {
        const text = fs.readFileSync(fullPath, 'utf-8');

        // Find title
        const titleMatch = text.match(/title\s*=\s*"([^"]+)"/);
        const title = titleMatch ? titleMatch[1] : file;

        // Find ingredients block in TOML front matter
        const startMatch = text.match(/ingredients\s*=\s*\[/);
        if (!startMatch || startMatch.index === undefined) {
          continue;
        }

        let bracketCount = 1;
        let idx = startMatch.index + startMatch[0].length;
        let inString = false;
        let stringChar = '';

        while (idx < text.length && bracketCount > 0) {
          const char = text[idx];
          if (inString) {
            if (char === stringChar && text[idx - 1] !== '\\') {
              inString = false;
            }
          } else if (char === '"' || char === "'") {
            inString = true;
            stringChar = char;
          } else if (char === '[') {
            bracketCount++;
          } else if (char === ']') {
            bracketCount--;
          }
          idx++;
        }

        const tomlSlice = text.slice(startMatch.index, idx);

        // Remove TOML comments from slice
        const withoutComments = tomlSlice.replace(/#.*/g, '');

        // Replace '=' with ':' for JavaScript object notation
        const jsCode = withoutComments.replace(
          /([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g,
          '$1:',
        );

        try {
          const result = new Function(`return { ${jsCode} }`)();
          const parsedIngredients: IngredientInput[] = [];
          if (Array.isArray(result.ingredients)) {
            for (const section of result.ingredients) {
              if (section && Array.isArray(section.items)) {
                for (const item of section.items) {
                  if (typeof item === 'string') {
                    parsedIngredients.push({ item });
                  } else if (item && typeof item === 'object') {
                    parsedIngredients.push(item as IngredientInput);
                  }
                }
              }
            }
          }
          recipes.push({
            title,
            filepath: fullPath,
            ingredients: parsedIngredients,
          });
        } catch (err) {
          throw new Error(`Failed to parse ingredients block in ${fullPath}`, {
            cause: err,
          });
        }
      }
    }
  }

  scanDir(contentDir);
  return recipes;
}

function getAllIngredientsFromContent(): string[] {
  const recipes = getRecipeIngredients();
  const items = recipes.flatMap((r) => r.ingredients.map((ing) => ing.item));
  return Array.from(new Set(items));
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

  test('recipe database ingredient validation linter', () => {
    const recipes = getRecipeIngredients();
    const errorsList: string[] = [];
    const warningsList: string[] = [];

    for (const recipe of recipes) {
      for (const ing of recipe.ingredients) {
        const errors = validateIngredient(ing);
        for (const error of errors) {
          const relativePath = path.relative(
            path.resolve(__dirname, '../../../../../'),
            recipe.filepath,
          );
          const formatted = `${recipe.title} (file: ${relativePath}): [${error.severity.toUpperCase()}] ${error.message} (Ingredient: ${JSON.stringify(ing)})`;
          if (error.severity === 'error') {
            errorsList.push(formatted);
          } else {
            warningsList.push(formatted);
          }
        }
      }
    }

    if (warningsList.length > 0) {
      console.warn(
        `\n[LINTER WARNINGS] Found ${warningsList.length} ingredient warnings:`,
      );
      warningsList.forEach((w) => console.warn(`  - ${w}`));
    }

    expect(errorsList).toEqual([]);
  });
});
