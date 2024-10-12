import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import reactRefresh from 'eslint-plugin-react-refresh';
import importPlugin from 'eslint-plugin-import';
import jsxA11Y from 'eslint-plugin-jsx-a11y';
import styledComponentsA11Y from 'eslint-plugin-styled-components-a11y';
// import testingLibrary from "eslint-plugin-testing-library";
import jestDom from 'eslint-plugin-jest-dom';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import reactHooks from 'eslint-plugin-react-hooks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default [
  ...fixupConfigRules(
    compat.extends(
      // 'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      // 'plugin:react-hooks/recommended',
      // 'plugin:import/recommended',
      // 'plugin:jsx-a11y/recommended',
      'plugin:styled-components-a11y/recommended'
      // 'plugin:testing-library/react',
      // 'plugin:jest-dom/recommended'
    )
  ),
  js.configs.recommended,
  importPlugin.flatConfigs.recommended,
  jestDom.configs['flat/recommended'],
  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    plugins: {
      'react-refresh': reactRefresh,
      // import: fixupPluginRules(_import),
      'jsx-a11y': fixupPluginRules(jsxA11Y),
      'styled-components-a11y': fixupPluginRules(styledComponentsA11Y),
      // 'testing-library': fixupPluginRules(testingLibrary),
      importPlugin,
      jestDom,
      reactHooks
    },

    languageOptions: {
      globals: {
        ...globals.browser
      },

      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module'
    },

    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/consistent-type-imports': 'error',
      'react-refresh/only-export-components': 'warn',
      'import/no-default-export': 'error',

      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['sibling', 'parent'],
            'index',
            'object',
            'type',
            'unknown'
          ],

          'newlines-between': 'always',

          alphabetize: {
            order: 'asc',
            caseInsensitive: true
          }
        }
      ]

      // 'testing-library/consistent-data-testid': [
      //   'error',
      //   {
      //     testIdPattern: '^([a-z0-9]+-?:?)+$'
      //   }
      // ]
    }
  }
];
