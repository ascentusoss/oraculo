// ESLint v9+ flat config migrated from .eslintrc.json

import tsPlugin from '/eslint-plugin';
import tsParser from '/parser';
import importPlugin from 'eslint-plugin-import';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';

export default [
  // Configuração global excluindo tipos de declaração

  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.eslint.json',
        sourceType: 'module',
        ecmaVersion: 2022,
      },
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    plugins: {
      '': tsPlugin,
      import: importPlugin,
      'unused-imports': unusedImportsPlugin,
      'simple-import-sort': simpleImportSortPlugin,
    },
    rules: {
      // TypeScript rules - mais rigorosas
      '/no-explicit-any': 'error',
      '/no-unused-vars': 'off', // delegado para unused-imports
      '/explicit-module-boundary-types': 'warn',
      '/no-non-null-assertion': 'error',
      '/no-floating-promises': 'error',
      '/ban-ts-comment': 'error',
      '/no-var-requires': 'error',
      '/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: false, // Permite import() em type annotations quando necessário
        },
      ],

      // Import organization and quality
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // Import rules
      'import/no-duplicates': 'error',
      'import/no-unresolved': 'off', // TypeScript handles this
      'import/order': 'off', // Using simple-import-sort instead
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-anonymous-default-export': 'warn',

      // General code quality
      'no-console': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'no-duplicate-imports': 'off', // Using import/no-duplicates instead
    },
  },
  // Override para testes/specs: desabilita avisos comuns
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      '/no-explicit-any': 'off',
      '/no-unused-vars': 'off',
      '/no-non-null-assertion': 'off',
      '/ban-ts-comment': 'off',
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'tests/**',
      'file1.ts',
      'file2.ts',
      'tmp-cache-file.ts',
      '.deprecados/**',
      'tests/fixtures/**',
      'pre-public/**',
      'relatorios/**',
    ],
  },
];
