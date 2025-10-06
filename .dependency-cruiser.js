module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment:
        'This dependency is part of a circular relationship. You might want to revise your solution (i.e. use dependency inversion, make sure the modules have a single responsibility) ',
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: 'no-orphans',
      comment:
        "This is an orphan module - it's likely not used (anymore?). Either use it or remove it. If it's logical this module is an orphan (i.e. it's a config file), add an exception for it in your dependency-cruiser configuration.",
      severity: 'warn',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)(node_modules|dist|build|coverage|.next)/',
          '\\.d\\.ts$',
        ],
      },
      to: {},
    },
    {
      name: 'no-deprecated-core',
      comment:
        "A module depends on a node core module that has been deprecated. Find an alternative - these are bound to exist - node doesn't deprecate lightly.",
      severity: 'warn',
      from: {},
      to: {
        dependencyTypes: ['core'],
        path: ['^(punycode|domain|constants|sys|_linklist|_stream_wrap)$'],
      },
    },
    {
      name: 'not-to-deprecated',
      comment:
        'This module uses a (version of an) npm module that has been deprecated. Either upgrade to a later version of that module, or find an alternative. Deprecated modules are a security risk.',
      severity: 'warn',
      from: {},
      to: {
        dependencyTypes: ['deprecated'],
      },
    },
    {
      name: 'no-non-package-json',
      comment:
        "This module depends on an npm package that isn't in the 'dependencies' section of your package.json. That's problematic as the package either (1) won't be available on live (2) will be tested by the wrong version of the package, or (3) will cause the dependency-cruiser to crash.",
      severity: 'error',
      from: {},
      to: {
        dependencyTypes: ['npm'],
        pathNot: ['^[^/]*$'],
      },
    },
    {
      name: 'no-unresolvable-resolves',
      comment:
        "This module depends on a module that cannot be found ('resolved to -). This might be a bug in the dependency-cruiser or it might be an actual problem in your code.",
      severity: 'error',
      from: {},
      to: {
        couldNotResolve: true,
      },
    },
    {
      name: 'no-duplicate-dep-types',
      comment:
        "Likely this module depends on an external ('npm') package that occurs more than once in your package.json i.e. both as a devDependencies and in dependencies. This will cause maintenance problems later on.",
      severity: 'warn',
      from: {},
      to: {
        moreThanOneDependencyType: true,
        // as it's pretty common to have a type import be a type only import
        // _and_ (e.g.) a devDependency - don't consider type-only dependency
        // types for this rule
        dependencyTypesNot: ['type-only'],
      },
    },
    /**
     * ============================================================================
     * ENTERPRISE-GRADE MONOREPO BOUNDARY ENFORCEMENT
     * ============================================================================
     * Architecture: Hexagonal/Clean Architecture with clear layer separation
     * - Apps: web (UI), bff (Backend-for-Frontend), worker (Background jobs)
     * - Contracts Layer: contracts, sdk, api-client (pure interfaces/schemas)
     * - Business Logic: posting-rules, policies (domain rules)
     * - Infrastructure: services, ports, adapters/db (implementation)
     * - Utilities: utils, testing (cross-cutting concerns)
     */

    // ========== LAYER 1: App Boundaries ==========

    // ✅ Apps must NOT import package internals - only public entrypoints
    {
      name: 'apps-not-to-package-internals',
      comment:
        'apps/* may only import packages via public exports (package.json "exports" field) or @aibos/* names; no deep /src/ imports.',
      severity: 'error',
      from: { path: '^apps\\/' },
      to: { path: '^packages\\/[^\\/]+\\/src\\/(?!index\\.(ts|tsx|js|mjs)$)' },
    },

    // ✅ Web app: UI layer - cannot access backend infrastructure
    {
      name: 'web-not-to-infra',
      comment:
        'apps/web (UI) must not depend on backend infrastructure (services, adapters, ports, posting-rules, policies, api-client). Use contracts types only.',
      severity: 'error',
      from: { path: '^apps\\/web\\/' },
      to: {
        path: '^packages\\/(services|adapters|ports|posting-rules|policies|api-client)(\\/|$)',
      },
    },

    // ✅ Web app: Contracts must be type-only to prevent runtime bloat
    {
      name: 'web-contracts-type-only',
      comment:
        'apps/web may import contracts as types only to avoid runtime coupling and bundle bloat.',
      severity: 'error',
      from: { path: '^apps\\/web\\/' },
      to: {
        path: '^packages\\/contracts(\\/|$)',
        dependencyTypesNot: ['type-only'],
      },
    },

    // ✅ BFF app: Cannot access database directly
    {
      name: 'bff-not-to-db',
      comment:
        'apps/bff must not import adapters/db directly; use services → ports → adapters pattern.',
      severity: 'error',
      from: { path: '^apps\\/bff\\/' },
      to: { path: '^packages\\/adapters\\/(db|database)(\\/|$)' },
    },

    // ✅ Worker app: Same restrictions as BFF
    {
      name: 'worker-not-to-db',
      comment:
        'apps/worker must not import adapters/db directly; use services → ports → adapters pattern.',
      severity: 'error',
      from: { path: '^apps\\/worker\\/' },
      to: { path: '^packages\\/adapters\\/(db|database)(\\/|$)' },
    },

    // ========== LAYER 2: Hexagonal Architecture - Contract Purity ==========

    // ✅ Contracts must be pure - no business logic or infrastructure dependencies
    {
      name: 'contracts-purity',
      comment:
        'contracts package must remain pure - cannot import services, adapters, ports, posting-rules, or policies.',
      severity: 'error',
      from: { path: '^packages\\/contracts\\/' },
      to: {
        path: '^packages\\/(services|adapters|ports|posting-rules|policies)(\\/|$)',
      },
    },

    // ✅ SDK must only depend on contracts (public API client)
    {
      name: 'sdk-contracts-only',
      comment:
        'SDK must only import contracts - it is the external-facing client and must not leak internal implementation.',
      severity: 'error',
      from: { path: '^packages\\/sdk\\/' },
      to: {
        path: '^packages\\/(services|adapters|ports|posting-rules|policies|api-client|utils)(\\/|$)',
      },
    },

    // ✅ API-client should primarily use contracts
    {
      name: 'api-client-prefers-contracts',
      comment:
        'api-client should primarily import contracts; avoid coupling to services or adapters.',
      severity: 'warn',
      from: { path: '^packages\\/api-client\\/' },
      to: {
        path: '^packages\\/(services|adapters|ports|posting-rules|policies)(\\/|$)',
      },
    },

    // ========== LAYER 3: Business Logic Layer Isolation ==========

    // ✅ Posting-rules must not import infrastructure
    {
      name: 'posting-rules-no-infra',
      comment:
        'posting-rules (domain business rules) must not import infrastructure (services, adapters, ports).',
      severity: 'error',
      from: { path: '^packages\\/posting-rules\\/' },
      to: { path: '^packages\\/(services|adapters|ports)(\\/|$)' },
    },

    // ✅ Policies must not import infrastructure
    {
      name: 'policies-no-infra',
      comment:
        'policies (domain policies) must not import infrastructure (services, adapters, ports).',
      severity: 'error',
      from: { path: '^packages\\/policies\\/' },
      to: { path: '^packages\\/(services|adapters|ports)(\\/|$)' },
    },

    // ========== LAYER 4: Hexagonal Architecture - Port/Adapter Pattern ==========

    // ✅ Ports define interfaces - should not import adapters
    {
      name: 'ports-no-adapters',
      comment:
        'ports (interfaces) must not import adapters (implementations) - this violates dependency inversion.',
      severity: 'error',
      from: { path: '^packages\\/ports\\/' },
      to: { path: '^packages\\/adapters(\\/|$)' },
    },

    // ✅ Services should depend on ports, not adapters directly
    {
      name: 'services-prefer-ports',
      comment:
        'services should depend on ports (interfaces) not adapters (implementations) directly for better testability.',
      severity: 'warn',
      from: { path: '^packages\\/services\\/' },
      to: { path: '^packages\\/adapters\\/(?!.*\\/ports\\/)' },
    },

    // ========== LAYER 5: Utility & Testing Boundaries ==========

    // ✅ Utils must be leaf dependencies (no domain/infra imports)
    {
      name: 'utils-is-leaf',
      comment:
        'utils must be leaf dependencies - cannot import domain logic (services, posting-rules, policies) or infrastructure (adapters, ports).',
      severity: 'error',
      from: { path: '^packages\\/utils\\/' },
      to: {
        path: '^packages\\/(services|adapters|ports|posting-rules|policies)(\\/|$)',
      },
    },

    // ✅ Testing utilities should not be imported by production code
    {
      name: 'no-testing-in-production',
      comment:
        'testing package is for test utilities only - must not be imported by production code (apps/*/src or packages/*/src, excluding test files).',
      severity: 'error',
      from: {
        path: '^(apps|packages)\\/[^\\/]+\\/src\\/',
        pathNot: '\\.(test|spec)\\.(ts|tsx|js|jsx)$',
      },
      to: { path: '^packages\\/testing(\\/|$)' },
    },

    // ✅ Test files should not be imported by production code
    {
      name: 'no-importing-test-files',
      comment:
        'Test files (*.test.*, *.spec.*) must not be imported by production code.',
      severity: 'error',
      from: {
        path: '\\.(ts|tsx|js|jsx)$',
        pathNot: '\\.(test|spec)\\.(ts|tsx|js|jsx)$',
      },
      to: { path: '\\.(test|spec)\\.(ts|tsx|js|jsx)$' },
    },

    // ========== LAYER 6: Security & Best Practices ==========

    // ✅ No importing from dist/ folders (use package names)
    {
      name: 'no-dist-imports',
      comment:
        'Do not import from dist/ folders directly - use package names (@aibos/*) to ensure proper resolution.',
      severity: 'error',
      from: {},
      to: { path: '\\/dist\\/' },
    },

    // ✅ No importing devDependencies in production code
    {
      name: 'not-to-dev-dep',
      comment:
        'Production code must not import devDependencies - this will break in production builds.',
      severity: 'error',
      from: {
        pathNot: [
          '\\.(test|spec)\\.(ts|tsx|js|jsx)$',
          '^(apps|packages)\\/[^\\/]+\\/(test|tests|__tests__|__mocks__)\\/',
          '\\.(config|setup)\\.(ts|js|mjs|cjs)$',
        ],
      },
      to: {
        dependencyTypes: ['npm-dev'],
        // Allow type-only imports from devDependencies (e.g., @types/*)
        dependencyTypesNot: ['type-only'],
      },
    },

    // ========== LAYER 7: Package-level Guidelines ==========

    // ✅ Warn on deep imports between packages
    {
      name: 'packages-avoid-deep-imports',
      comment:
        'Prefer importing other packages via their public entry points (package.json exports) - deep imports break encapsulation.',
      severity: 'warn',
      from: { path: '^packages\\/[^\\/]+\\/(?!src\\/)' },
      to: { path: '^packages\\/[^\\/]+\\/src\\/(?!index\\.(ts|tsx|js|mjs)$)' },
    },
  ],
  options: {
    // ========== Enhanced Resolution ==========
    doNotFollow: {
      path: [
        'node_modules',
        'dist',
        'build',
        '.next',
        'coverage',
        '__tests__',
        '__mocks__',
        '.turbo',
        '.cache',
      ],
    },

    // Enable TypeScript pre-compilation dependency detection
    tsPreCompilationDeps: true,

    // Support multiple tsconfig files (monorepo-aware)
    tsConfig: {
      fileName: 'tsconfig.json',
    },

    // Enhanced module resolution for pnpm workspaces + package.json exports
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json'],
      // Support for @aibos/* workspace aliases
      mainFields: ['module', 'main'],
    },

    // Include TypeScript types and local paths
    includeOnly: ['^apps/', '^packages/', '^scripts/'],

    // ========== Reporting & Visualization ==========
    reporterOptions: {
      // DOT (GraphViz) output for visual dependency graphs
      dot: {
        collapsePattern: 'node_modules/[^/]+',
        theme: {
          graph: {
            splines: 'ortho',
            rankdir: 'TB', // Top to bottom (shows architecture layers clearly)
            bgcolor: '#1a1a1a',
            fontcolor: '#ffffff',
          },
          modules: [
            {
              criteria: { matchesFocus: true },
              attributes: {
                fillcolor: '#22c55e', // Green for focused modules
                fontcolor: '#ffffff',
              },
            },
            {
              criteria: { matchesReaches: true },
              attributes: {
                fillcolor: '#f59e0b', // Orange for reachable modules
                fontcolor: '#000000',
              },
            },
            {
              criteria: { matchesHighlight: true },
              attributes: {
                fillcolor: '#ef4444', // Red for violations
                fontcolor: '#ffffff',
              },
            },
            {
              // Highlight apps layer
              criteria: { source: '^apps/' },
              attributes: {
                fillcolor: '#3b82f6',
                shape: 'box3d',
              },
            },
            {
              // Highlight contracts layer
              criteria: { source: '^packages/contracts/' },
              attributes: {
                fillcolor: '#8b5cf6',
                shape: 'component',
              },
            },
            {
              // Highlight infrastructure layer
              criteria: { source: '^packages/(services|adapters|ports)/' },
              attributes: {
                fillcolor: '#06b6d4',
                shape: 'folder',
              },
            },
          ],
          dependencies: [
            {
              criteria: { resolved: '^packages/contracts/' },
              attributes: {
                color: '#8b5cf6',
                penwidth: '2',
              },
            },
            {
              criteria: { resolved: '^packages/services/' },
              attributes: {
                color: '#06b6d4',
                penwidth: '1.5',
              },
            },
          ],
        },
      },

      // Architecture-level view (high-level)
      archi: {
        collapsePattern: '^(node_modules|packages|apps)/[^/]+',
        theme: {
          graph: {
            bgcolor: '#1a1a1a',
            fontcolor: '#ffffff',
          },
        },
      },

      // Text output (CLI-friendly)
      text: {
        highlightFocused: true,
      },

      // Error output (for CI/CD)
      err: {
        summary: true,
      },

      // HTML output (interactive dashboard)
      html: {
        collapsePattern: 'node_modules/[^/]+',
      },
    },

    // ========== Performance & Caching ==========
    // Cache results for faster subsequent runs
    cache: true,

    // Progress indicator for large codebases
    progress: {
      type: 'cli-feedback',
      maximumLevel: 60,
    },
  },
};
