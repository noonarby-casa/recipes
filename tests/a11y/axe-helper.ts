import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AxeNodeTarget {
  target: string[];
  html: string;
}

interface AxeViolationEntry {
  id: string;
  impact?: string;
  help: string;
  helpUrl: string;
  nodes: AxeNodeTarget[];
}

/**
 * Format Axe violations into a human-readable string for console output and failure reports.
 */
export function formatViolations(violations: AxeViolationEntry[]): string {
  return violations
    .map((v, i) => {
      const nodes = v.nodes
        .map((n) => `    Selector: ${n.target.join(', ')}\n    HTML: ${n.html}`)
        .join('\n\n');
      return `${i + 1}. [${v.impact ? v.impact.toUpperCase() : 'UNKNOWN'}] Rule: ${v.id}\n   Help: ${v.help} (${v.helpUrl})\n\n${nodes}`;
    })
    .join('\n\n' + '='.repeat(40) + '\n\n');
}

/**
 * Factory to create a configured AxeBuilder instance for WCAG 2.2 AA + selective AAA rules.
 */
export function createAxeBuilder(page: Page): AxeBuilder {
  return new AxeBuilder({ page })
    .exclude('.planner-clear-btn, .planner-callout-btn, .recipe-tag-label')
    .withTags([
      'wcag2a',
      'wcag2aa',
      'wcag21a',
      'wcag21aa',
      'wcag22a',
      'wcag22aa',
      'best-practice',
    ])
    .options({
      rules: {
        'heading-order': { enabled: false },
        'color-contrast-enhanced': {
          enabled: true,
          selector:
            ':not(.toggle-btn):not(.scale-btn):not(.planner-btn-primary):not(.planner-btn-secondary):not(.planner-clear-btn):not(.scale-display):not(.plan-back-btn):not(.recipe-timer):not(.recipe-timer-btn):not(.store-layout-option-btn):not(.banner-tab):not(.banner-btn):not(.recipe-meta li a):not(.recipe-tag-label):not(.planner-callout-btn)',
        },
        'identical-links-same-purpose': { enabled: true },
        'link-in-text-block': { enabled: true },
      },
    });
}

/**
 * Helper to ensure the page is set to light or dark mode.
 */
export async function setTheme(
  page: Page,
  theme: 'light' | 'dark',
): Promise<void> {
  const targetDark = theme === 'dark';
  const isDarkCurrently = await page.evaluate(() =>
    document.documentElement.classList.contains('dark-mode'),
  );

  if (isDarkCurrently !== targetDark) {
    const toggleBtn = page.locator('#header-theme-toggle');
    if ((await toggleBtn.count()) > 0) {
      await toggleBtn.click();
    } else {
      await page.evaluate((dark) => {
        if (dark) {
          document.documentElement.classList.add('dark-mode');
        } else {
          document.documentElement.classList.remove('dark-mode');
        }
      }, targetDark);
    }
  }

  // Double check and wait a moment for transitions/rendering
  await page.waitForTimeout(100);
}

/**
 * Discover recipes dynamically from content directory.
 */
export function getRecipes(): string[] {
  const contentDir = path.join(__dirname, '../../content');
  if (!fs.existsSync(contentDir)) {
    return [];
  }
  return fs
    .readdirSync(contentDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .filter((name) => !['plan', 'sitemap', 'timers'].includes(name));
}

/**
 * Get the URL path of a recipe, parsing the front matter slug if specified.
 */
export function getRecipeUrl(recipeDir: string): string {
  const contentDir = path.join(__dirname, '../../content');
  const indexMdPath = path.join(contentDir, recipeDir, 'index.md');
  if (fs.existsSync(indexMdPath)) {
    const fileContent = fs.readFileSync(indexMdPath, 'utf8');
    const slugMatch = fileContent.match(/slug\s*=\s*["']([^"']+)["']/);
    if (slugMatch) {
      return `/${slugMatch[1]}/`;
    }
  }
  return `/${recipeDir}/`;
}
