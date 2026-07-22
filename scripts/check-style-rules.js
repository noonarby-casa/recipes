import fs from 'node:fs';
import path from 'node:path';

/**
 * Script to enforce Rule 4 of the Noonarby Casa Recipes style guidelines:
 * "There must be only one CSS rule for a particular selector combination.
 * (e.g. each class or selector combination has styles defined in only one location across CSS and Svelte components)."
 */

function getFilesRecursively(dir, extension) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath, extension));
    } else if (entry.isFile() && entry.name.endsWith(extension)) {
      results.push(fullPath);
    }
  }
  return results;
}

const cssFiles = getFilesRecursively('themes/cookpot/assets/css', '.css');
const svelteFiles = getFilesRecursively(
  'themes/cookpot/assets/js/components',
  '.svelte',
);

const selectorsMap = new Map();

function extractRules(content, filepath) {
  // Strip comments
  let clean = content.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove keyframes body to prevent keyframe step percentages (0%, 100%) from being treated as selectors
  clean = clean.replace(
    /@keyframes\s+[\w-]+\s*\{[^{}]*(\{[^{}]*\}[^{}]*)*\}/g,
    '',
  );

  let depth = 0;
  let buf = '';
  let sel = '';

  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (c === '{') {
      if (depth === 0) {
        sel = buf.trim();
        buf = '';
      }
      depth++;
    } else if (c === '}') {
      depth--;
      if (depth === 0) {
        buf = '';
        if (sel && !sel.startsWith('@')) {
          const parts = sel
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean);
          for (const p of parts) {
            if (!selectorsMap.has(p)) {
              selectorsMap.set(p, []);
            }
            selectorsMap.get(p).push(filepath);
          }
        }
        sel = '';
      }
    } else {
      buf += c;
    }
  }
}

for (const file of cssFiles) {
  const content = fs.readFileSync(file, 'utf8');
  extractRules(content, file);
}

for (const file of svelteFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const styleMatches = content.match(/<style[\s\S]*?>([\s\S]*?)<\/style>/gi);
  if (styleMatches) {
    for (const styleBlock of styleMatches) {
      const innerCss = styleBlock.replace(/<\/?style[\s\S]*?>/gi, '');
      extractRules(innerCss, file);
    }
  }
}

const duplicates = new Map();
for (const [selector, locs] of selectorsMap.entries()) {
  if (locs.length > 1) {
    duplicates.set(selector, locs);
  }
}

if (duplicates.size > 0) {
  console.error(
    `❌ Style Rule Violation: Found ${duplicates.size} duplicate CSS selector combination(s):\n`,
  );
  for (const [selector, locs] of duplicates.entries()) {
    console.error(`Selector: "${selector}" (${locs.length} occurrences):`);
    for (const loc of locs) {
      console.error(`  - ${loc}`);
    }
  }
  process.exit(1);
} else {
  console.log(
    '✓ CSS Selector Uniqueness Check Passed: 0 duplicate selectors found across CSS and Svelte files.',
  );
  process.exit(0);
}
