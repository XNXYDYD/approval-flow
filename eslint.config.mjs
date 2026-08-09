import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import svelteParser from 'svelte-eslint-parser';

export default [
  {
    ignores: [
      'node_modules/**',
      '.svelte-kit/**',
      'build/**',
      'dist/**',
      'coverage/**',
      'static/**',
    ],
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        browser: true,
        node: true,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
      'eqeqeq': ['warn', 'smart'],
      'prefer-const': 'warn',
      'no-var': 'error',
      'curly': ['error', 'all'],
      'no-trailing-spaces': 'warn',
      'eol-last': 'warn',
      'no-multiple-empty-lines': ['warn', { max: 2 }],
      'no-whitespace-before-property': 'warn',
      'space-infix-ops': 'warn',
      'no-mixed-spaces-and-tabs': 'error',
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.svelte'],
      },
    },
    plugins: {
      svelte,
    },
    rules: {
      'svelte/require-each-key': 'off',
      'svelte/at-least-one-template-comment': 'off',
      'svelte/no-inline-styles': 'off',
      'svelte/no-dynamic-script-tag': 'off',
    },
  },
  prettier,
];