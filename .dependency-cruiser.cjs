module.exports = {
  forbidden: [
    // Prevent circular dependencies
    {
      name: 'no-cycles',
      from: {},
      to: { circular: true },
    },

    // Apps cannot import from other apps
    {
      name: 'no-app-to-app',
      from: { path: '^apps' },
      to: { path: '^apps', pathNot: '^apps/(web|bff|worker)' },
    },

    // Packages cannot import from apps
    {
      name: 'no-package-to-app',
      from: { path: '^packages' },
      to: { path: '^apps' },
    },

    // Web app can only import from contracts and api-client
    {
      name: 'web-boundaries',
      from: { path: '^apps/web' },
      to: { pathNot: '^(packages/(contracts|api-client)|apps/web)' },
    },

    // BFF can only import from services, contracts, adapter, ports, policies, posting-rules
    {
      name: 'bff-boundaries',
      from: { path: '^apps/bff' },
      to: {
        pathNot:
          '^(packages/(services|contracts|adapters|ports|policies|posting-rules)|apps/bff)',
      },
    },

    // Worker can only import from adapter and ports
    {
      name: 'worker-boundaries',
      from: { path: '^apps/worker' },
      to: { pathNot: '^(packages/(adapters|ports)|apps/worker)' },
    },

    // Services can only import from contracts, ports, policies, posting-rules
    {
      name: 'services-boundaries',
      from: { path: '^packages/services' },
      to: {
        pathNot: '^packages/(services|contracts|ports|policies|posting-rules)',
      },
    },

    // Adapters can only import from contracts and ports
    {
      name: 'adapter-boundaries',
      from: { path: '^packages/adapters' },
      to: { pathNot: '^packages/(adapters|contracts|ports)' },
    },

    // Ports can only import from contracts
    {
      name: 'ports-boundaries',
      from: { path: '^packages/ports' },
      to: { pathNot: '^packages/(ports|contracts)' },
    },

    // Policies can only import from contracts
    {
      name: 'policies-boundaries',
      from: { path: '^packages/policies' },
      to: { pathNot: '^packages/(policies|contracts)' },
    },

    // Posting-rules can only import from contracts
    {
      name: 'posting-rules-boundaries',
      from: { path: '^packages/posting-rules' },
      to: { pathNot: '^packages/(posting-rules|contracts)' },
    },

    // Utils can only import from contracts
    {
      name: 'utils-boundaries',
      from: { path: '^packages/utils' },
      to: { pathNot: '^packages/(utils|contracts)' },
    },

    // SDK can only import from contracts
    {
      name: 'sdk-boundaries',
      from: { path: '^packages/sdk' },
      to: { pathNot: '^packages/(sdk|contracts)' },
    },

    // Testing can only import from contracts, adapter, ports
    {
      name: 'testing-boundaries',
      from: { path: '^packages/testing' },
      to: { pathNot: '^packages/(testing|contracts|adapters|ports)' },
    },

    // API client can only import from contracts
    {
      name: 'api-client-boundaries',
      from: { path: '^packages/api-client' },
      to: { pathNot: '^packages/(api-client|contracts)' },
    },

    // Contracts cannot import from other packages (except itself)
    {
      name: 'contracts-boundaries',
      from: { path: '^packages/contracts' },
      to: { pathNot: '^packages/contracts' },
    },
  ],

  options: {
    // Exclude build artifacts and generated files
    exclude: {
      path: [
        'node_modules',
        'dist',
        '.next',
        '.turbo',
        'types.gen.ts',
        'types.gen.js',
        '*.d.ts',
      ],
    },

    // Include TypeScript and JavaScript files
    includeOnly: {
      path: ['apps', 'packages'],
    },

    // Module systems to analyze
    moduleSystems: ['amd', 'cjs', 'es6', 'tsd'],

    // TypeScript support
    tsPreCompilationDeps: true,

    // Output format
    outputType: 'text',

    // Show progress
    progress: {
      type: 'performance-log',
    },
  },
};
