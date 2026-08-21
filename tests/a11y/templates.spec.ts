import { test } from '@playwright/test';
import { createAxeBuilder, formatViolations, setTheme } from './axe-helper';

test.describe('Core Templates Accessibility Matrix', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 812 },
    { name: 'Desktop', width: 1280, height: 800 },
  ];
  const themes: ('light' | 'dark')[] = ['light', 'dark'];

  const coreTemplates = [
    { name: 'Home Page', path: '/' },
    { name: 'Recipe Detail (Cozy Chickpea Curry)', path: '/chickpea-curry/' },
    { name: 'Meal Planner', path: '/plan/' },
    { name: 'Active Timers', path: '/timers/' },
  ];

  for (const template of coreTemplates) {
    for (const viewport of viewports) {
      for (const theme of themes) {
        test(`Core Template: ${template.name} (${viewport.name} - ${theme} Mode)`, async ({
          page,
        }) => {
          await page.setViewportSize({
            width: viewport.width,
            height: viewport.height,
          });
          await page.goto(template.path);
          await setTheme(page, theme);

          const builder = createAxeBuilder(page);
          const results = await builder.analyze();

          if (results.violations.length > 0) {
            throw new Error(
              `Accessibility violations found on ${template.name} (${viewport.name} - ${theme} Mode):\n\n${formatViolations(results.violations)}`,
            );
          }
        });
      }
    }
  }
});
