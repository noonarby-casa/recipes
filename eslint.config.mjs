import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginSvelte from 'eslint-plugin-svelte';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  ...eslintPluginSvelte.configs['flat/recommended'],
  eslintConfigPrettier,
  {
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        alert: 'readonly',
        console: 'readonly',
        WakeLockSentinel: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
      },
    },
  },
  {
    files: [
      'themes/cookpot/assets/js/**/*.ts',
      'themes/cookpot/assets/js/**/*.svelte',
    ],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.svelte'],
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      curly: 'error',
      'svelte/require-each-key': 'off',
      'svelte/no-at-html-tags': 'off',
      'svelte/no-useless-mustaches': 'off',
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
);
