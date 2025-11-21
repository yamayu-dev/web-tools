import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'public', 'node_modules', '*.config.js', '*.config.ts', 'scripts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Restrict identifiers to ASCII characters only to prevent confusing Unicode identifiers
      // This prevents issues like "varあ" being treated as a valid identifier name
      'id-match': ['error', '^[a-zA-Z0-9_$]+$', {
        properties: true,
        classFields: true,
        onlyDeclarations: false,
      }],
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Restrict identifiers to ASCII characters only to prevent confusing Unicode identifiers
      'id-match': ['error', '^[a-zA-Z0-9_$]+$', {
        properties: true,
        classFields: true,
        onlyDeclarations: false,
      }],
    },
  },
])
