import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  test: {
    projects: [
      {
        // Pure TypeScript unit tests — fast, no DOM overhead.
        test: {
          name: 'unit',
          environment: 'node',
          include: ['themes/cookpot/assets/js/**/*.test.ts'],
          exclude: ['themes/cookpot/assets/js/**/*.svelte.test.ts'],
        },
      },
      {
        // Svelte component tests using @testing-library/svelte.
        plugins: [svelte()],
        test: {
          name: 'component',
          environment: 'jsdom',
          include: ['themes/cookpot/assets/js/**/*.svelte.test.ts'],
          setupFiles: ['themes/cookpot/assets/js/__test-setup__/svelte.ts'],
          server: {
            deps: {
              inline: [/svelte/],
            },
          },
        },
        resolve: {
          conditions: ['browser'],
        },
      },
    ],
  },
});
