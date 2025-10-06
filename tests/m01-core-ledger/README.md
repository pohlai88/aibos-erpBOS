# M01 Core Ledger Test Suite

This directory contains focused, well-organized tests for the M01 Core Ledger module.

## Test Structure

```
tests/m01-core-ledger/
├── README.md                 # This file
├── api/                      # API endpoint tests
│   ├── accounts.test.ts      # Account CRUD operations
│   ├── hierarchy.test.ts     # Hierarchy management
│   └── reparent.test.ts      # Reparenting operations
├── components/               # UI component tests
│   ├── AccountForm.test.tsx   # Account form component
│   ├── AccountList.test.tsx   # Account list component
│   └── AccountHierarchy.test.tsx # Hierarchy component
├── hooks/                    # React Query hooks tests
│   └── useAccounts.test.ts   # Account hooks
├── integration/              # Integration tests
│   └── m01-integration.test.ts # End-to-end M01 tests
└── fixtures/                 # Test data and mocks
    ├── accounts.ts           # Account test data
    └── mocks.ts             # Mock implementations
```

## Running Tests

```bash
# Run all M01 tests
pnpm test:m01

# Run specific test categories
pnpm test:m01:api
pnpm test:m01:components
pnpm test:m01:hooks
pnpm test:m01:integration
```

## Test Philosophy

- **Focused**: Only tests relevant to M01 Core Ledger
- **Clean**: Well-organized, no scattered test files
- **Maintainable**: Clear structure and naming conventions
- **Comprehensive**: Covers all M01 functionality
- **Fast**: Optimized for quick feedback
