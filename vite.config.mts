import { defineConfig } from 'vite';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  publicDir: false,
  plugins: [
    svelte({
      preprocess: vitePreprocess(),
    }),
    cssInjectedByJsPlugin(),
  ],
  build: {
    outDir: 'themes/cookpot/static/dist',
    emptyOutDir: true,
    lib: {
      entry: 'themes/cookpot/assets/js/svelte-main.ts',
      name: 'MealPlanner',
      formats: ['iife'],
      fileName: () => 'meal-planner.js',
    },
  },
});
