const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const boundaries = require('eslint-plugin-boundaries');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = [
  // --- Base JS recommended on everything ---
  ...compat.extends('eslint:recommended'),

  // --- Define module element types for boundaries ---
  {
    settings: {
      // Map your repo layout to logical "element types"
      'boundaries/elements': [
        { type: 'app', pattern: 'apps/*' },
        { type: 'web', pattern: 'apps/web' },
        { type: 'bff', pattern: 'apps/bff' },
        { type: 'worker', pattern: 'apps/worker' },
        { type: 'pkg', pattern: 'packages/*' },
        { type: 'services', pattern: 'packages/services' },
        { type: 'contracts', pattern: 'packages/contracts' },
        { type: 'client', pattern: 'packages/api-client' },
        { type: 'adapter', pattern: 'packages/adapters/*' },
        { type: 'ports', pattern: 'packages/ports' },
        { type: 'policies', pattern: 'packages/policies' },
        { type: 'posting-rules', pattern: 'packages/posting-rules' },
        { type: 'utils', pattern: 'packages/utils' },
        { type: 'sdk', pattern: 'packages/sdk' },
        { type: 'testing', pattern: 'packages/testing' },
      ],
    },
    plugins: {
      boundaries,
    },
  },

  // --- TypeScript (non type-checked) pass for speed ---
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        fetch: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Headers: 'readonly',
        FormData: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        AbortController: 'readonly',
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        crypto: 'readonly',
        Buffer: 'readonly',
        File: 'readonly',
        ResponseInit: 'readonly',
        global: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        NodeJS: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        __dirname: 'readonly',
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        alert: 'readonly',
        React: 'readonly',
        HTMLInputElement: 'readonly',
        performance: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      boundaries,
    },
    rules: {
      // Module boundaries: reference element types, not paths
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            // web can import from contracts & api client
            { from: ['web'], allow: ['contracts', 'client'] },

            // bff can import from services, contracts, adapter, ports, policies, posting-rules
            {
              from: ['bff'],
              allow: [
                'services',
                'contracts',
                'adapter',
                'ports',
                'policies',
                'posting-rules',
              ],
            },

            // worker can import from adapter, ports
            { from: ['worker'], allow: ['adapter', 'ports'] },

            // services can import contracts, ports, policies, posting-rules
            {
              from: ['services'],
              allow: ['contracts', 'ports', 'policies', 'posting-rules'],
            },

            // adapters (db, etc.) can import contracts, ports
            { from: ['adapter'], allow: ['contracts', 'ports'] },

            // ports can import contracts
            { from: ['ports'], allow: ['contracts'] },

            // policies can import contracts
            { from: ['policies'], allow: ['contracts'] },

            // posting-rules can import contracts
            { from: ['posting-rules'], allow: ['contracts'] },

            // utils can import contracts
            { from: ['utils'], allow: ['contracts'] },

            // sdk can import contracts
            { from: ['sdk'], allow: ['contracts'] },

            // testing can import contracts, adapter, ports
            { from: ['testing'], allow: ['contracts', 'adapter', 'ports'] },
          ],
        },
      ],

      // Keep safety nets on, but less noisy during velocity work
      '@typescript-eslint/no-explicit-any': 'off', // Temporarily disabled during development

      // Let TS handle unused vars
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      '@typescript-eslint/triple-slash-reference': 'warn',
    },
  },

  // --- API Routes - Enforce consistent patterns ---
  {
    files: ['apps/bff/app/api/**/*.{ts,tsx}'],
    ignores: ['apps/bff/app/api/_kit/**', 'apps/bff/app/api/_lib/**'],
    rules: {
      // Enforce withRouteErrors wrapper
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "ExportNamedDeclaration[declaration.type='FunctionDeclaration'] > FunctionDeclaration[id.name=/^(GET|POST|PUT|PATCH|DELETE|OPTIONS)$/]",
          message:
            "Use 'export const METHOD = withRouteErrors(async ...)' instead of 'export async function METHOD'",
        },
        {
          selector:
            "CallExpression[callee.object.name='Response'][callee.property.name='json']",
          message:
            'Use ok()/badRequest() from @/api/_kit instead of Response.json',
        },
        {
          selector:
            "CallExpression[callee.object.name='NextResponse'][callee.property.name='json']",
          message:
            'Use ok()/badRequest() from @/api/_kit instead of NextResponse.json',
        },
      ],
    },
  },

  // --- Tests & scripts loosened ---
  {
    files: ['**/*.test.*', '**/*.spec.*', 'scripts/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // --- Contracts package - allow redeclarations ---
  {
    files: ['packages/contracts/**/*.ts'],
    rules: {
      'no-redeclare': 'off',
    },
  },

  // --- Next.js env shim ---
  {
    files: ['**/next-env.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },

  // --- Global language options & linter options ---
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        fetch: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Headers: 'readonly',
        FormData: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        AbortController: 'readonly',
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        crypto: 'readonly',
        Buffer: 'readonly',
        File: 'readonly',
        ResponseInit: 'readonly',
        global: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        NodeJS: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        __dirname: 'readonly',
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        alert: 'readonly',
        React: 'readonly',
        HTMLInputElement: 'readonly',
        performance: 'readonly',
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/types.gen.ts',
      '**/node_modules/**',
      '**/.turbo/**',
      '**/build/**',
      '**/out/**',
    ],
  },
];
