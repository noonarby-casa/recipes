import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['themes/cookpot/assets/js/**/*.test.ts'],
  },
});
