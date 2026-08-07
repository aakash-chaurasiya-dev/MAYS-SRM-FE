// eslint.config.js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-empty': 'warn',
      'no-useless-assignment': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/immutability': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: [
      'src/contexts/**/*.{js,jsx}',
      'src/theme/ThemeContext.jsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  // Enable Jest globals for test files so ESLint recognizes describe/it/expect/jest
  {
    files: [
      '**/*.test.{js,jsx}',
      '**/__tests__/**',
      'src/**/__test__/**',
      'src/**/__tests__/**',
    ],
    languageOptions: {
      globals: { ...globals.jest },
    },
  },
])