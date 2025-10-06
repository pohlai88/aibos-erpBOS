// .eslintrc.architecture.js
module.exports = {
  extends: [
    '@aibos/eslint-config',
    'plugin:import/recommended',
    'plugin:import/typescript'
  ],
  
  rules: {
    // 🏗️ ARCHITECTURAL ENFORCEMENT RULES
    
    // Prevent API layer from importing BFF internals
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['apps/bff/app/lib/*'],
            message: '🚫 API layer cannot import BFF internals. Use Contracts layer instead.'
          },
          {
            group: ['apps/bff/app/services/*'],
            message: '🚫 API layer cannot import BFF services. Use Services layer instead.'
          },
          {
            group: ['apps/bff/app/lib/*'],
            message: '🚫 UI layer cannot import BFF internals. Use API layer instead.'
          }
        ]
      }
    ],
    
    // Enforce layer boundaries with specific paths
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          // API Layer Restrictions
          {
            target: './apps/bff/app/api/**',
            from: './apps/bff/app/lib/**',
            message: '🚫 API routes cannot import BFF lib files. Use Contracts layer.'
          },
          {
            target: './apps/bff/app/api/**',
            from: './apps/bff/app/services/**',
            message: '🚫 API routes cannot import BFF services. Use Services layer.'
          },
          
          // Services Layer Restrictions
          {
            target: './packages/services/**',
            from: './apps/bff/**',
            message: '🚫 Services cannot import BFF files. Use Ports layer.'
          },
          {
            target: './packages/services/**',
            from: './apps/web/**',
            message: '🚫 Services cannot import UI files. Use Contracts layer.'
          },
          
          // Policies Layer Restrictions
          {
            target: './packages/policies/**',
            from: './apps/**',
            message: '🚫 Policies cannot import app files. Use Services layer.'
          },
          {
            target: './packages/policies/**',
            from: './packages/adapters/**',
            message: '🚫 Policies cannot import adapters. Use Ports layer.'
          },
          
          // Contracts Layer Restrictions
          {
            target: './packages/contracts/**',
            from: './apps/**',
            message: '🚫 Contracts cannot import app files. Keep contracts pure.'
          },
          {
            target: './packages/contracts/**',
            from: './packages/adapters/**',
            message: '🚫 Contracts cannot import adapters. Keep contracts pure.'
          },
          {
            target: './packages/contracts/**',
            from: './packages/services/**',
            message: '🚫 Contracts cannot import services. Keep contracts pure.'
          },
          
          // Ports Layer Restrictions
          {
            target: './packages/ports/**',
            from: './apps/**',
            message: '🚫 Ports cannot import app files. Keep ports pure.'
          },
          {
            target: './packages/ports/**',
            from: './packages/adapters/**',
            message: '🚫 Ports cannot import adapters. Keep ports pure.'
          },
          
          // Adapters Layer Restrictions
          {
            target: './packages/adapters/**',
            from: './apps/**',
            message: '🚫 Adapters cannot import app files. Use Ports layer.'
          },
          {
            target: './packages/adapters/**',
            from: './packages/services/**',
            message: '🚫 Adapters cannot import services. Use Ports layer.'
          },
          {
            target: './packages/adapters/**',
            from: './packages/policies/**',
            message: '🚫 Adapters cannot import policies. Use Ports layer.'
          }
        ]
      }
    ],
    
    // Enforce proper import order (layers from bottom to top)
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true
        },
        pathGroups: [
          // Database layer (lowest)
          {
            pattern: 'packages/adapters/db/**',
            group: 'internal',
            position: 'before'
          },
          // Adapters layer
          {
            pattern: 'packages/adapters/**',
            group: 'internal',
            position: 'before'
          },
          // Ports layer
          {
            pattern: 'packages/ports/**',
            group: 'internal',
            position: 'before'
          },
          // Services layer
          {
            pattern: 'packages/services/**',
            group: 'internal',
            position: 'before'
          },
          // Policies layer
          {
            pattern: 'packages/policies/**',
            group: 'internal',
            position: 'before'
          },
          // Contracts layer
          {
            pattern: 'packages/contracts/**',
            group: 'internal',
            position: 'before'
          },
          // API layer
          {
            pattern: 'apps/bff/app/api/**',
            group: 'internal',
            position: 'before'
          },
          // UI layer (highest)
          {
            pattern: 'apps/web/**',
            group: 'internal',
            position: 'before'
          }
        ],
        pathGroupsExcludedImportTypes: ['builtin']
      }
    ],
    
    // Enforce dependency injection pattern
    'prefer-const': 'error',
    'no-var': 'error',
    
    // Enforce proper error handling
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',
    
    // Enforce proper async/await usage
    'require-await': 'error',
    'no-async-promise-executor': 'error',
    
    // Enforce proper TypeScript usage
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error'
  },
  
  overrides: [
    // API Layer specific rules
    {
      files: ['apps/bff/app/api/**/*.ts'],
      rules: {
        'import/no-restricted-paths': [
          'error',
          {
            zones: [
              {
                target: './apps/bff/app/api/**',
                from: './apps/bff/app/lib/**',
                message: '🚫 API routes must use Contracts layer, not BFF lib files'
              },
              {
                target: './apps/bff/app/api/**',
                from: './apps/bff/app/services/**',
                message: '🚫 API routes must use Services layer, not BFF services'
              }
            ]
          }
        ]
      }
    },
    
    // Services Layer specific rules
    {
      files: ['packages/services/**/*.ts'],
      rules: {
        'import/no-restricted-paths': [
          'error',
          {
            zones: [
              {
                target: './packages/services/**',
                from: './apps/**',
                message: '🚫 Services cannot import app files. Use dependency injection.'
              },
              {
                target: './packages/services/**',
                from: './packages/adapters/**',
                message: '🚫 Services cannot import adapters. Use Ports interfaces.'
              }
            ]
          }
        ]
      }
    },
    
    // Contracts Layer specific rules (must be pure)
    {
      files: ['packages/contracts/**/*.ts'],
      rules: {
        'import/no-restricted-paths': [
          'error',
          {
            zones: [
              {
                target: './packages/contracts/**',
                from: './apps/**',
                message: '🚫 Contracts must be pure. No app imports allowed.'
              },
              {
                target: './packages/contracts/**',
                from: './packages/adapters/**',
                message: '🚫 Contracts must be pure. No adapter imports allowed.'
              },
              {
                target: './packages/contracts/**',
                from: './packages/services/**',
                message: '🚫 Contracts must be pure. No service imports allowed.'
              },
              {
                target: './packages/contracts/**',
                from: './packages/policies/**',
                message: '🚫 Contracts must be pure. No policy imports allowed.'
              }
            ]
          }
        ]
      }
    }
  ],
  
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json'
      }
    }
  }
};
