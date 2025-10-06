# 🎯 M57: Contract Management - UI Implementation Runbook

**Module ID**: M57  
**Module Name**: Contract Management  
**Priority**: 🔥 HIGH  
**Phase**: Phase 12 - Operational Modules  
**Estimated Effort**: 3.5 days  
**Last Updated**: 2025-10-06

**Status**: ❌ NO - CREATE NEW Module

---

## 📋 Module Overview

Contract Management provides **contract lifecycle management**, **renewal tracking**, **obligation management**, and **contract analytics** for businesses requiring **enterprise contract management** and **compliance tracking**.

### Business Value

**Key Benefits**:

- **Contract Lifecycle**: End-to-end contract management
- **Renewal Tracking**: Automated renewal reminders
- **Obligation Management**: Track contractual obligations
- **Contract Analytics**: Insights into contract performance

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status | Details                          |
| ------------- | ------ | -------------------------------- |
| **Database**  | ❌ NEW | Contract schema needed           |
| **Services**  | ❌ NEW | Contract services needed         |
| **API**       | ❌ NEW | Contract APIs needed             |
| **Contracts** | ❌ NEW | Contract type definitions needed |

### API Endpoints

**Contract Management** (New endpoints needed):

- ❌ `/api/contracts` - List contracts
- ❌ `/api/contracts/[id]` - Get contract details
- ❌ `/api/contracts/create` - Create contract
- ❌ `/api/contracts/[id]/renew` - Renew contract
- ❌ `/api/contracts/[id]/obligations` - Track obligations
- ❌ `/api/contracts/analytics` - Contract analytics

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                         | Page Component            | Purpose               |
| ----------------------------- | ------------------------- | --------------------- |
| `/contracts`                  | `ContractsListPage`       | List contracts        |
| `/contracts/[id]`             | `ContractDetailPage`      | View contract details |
| `/contracts/create`           | `ContractCreatePage`      | Create new contract   |
| `/contracts/[id]/obligations` | `ContractObligationsPage` | Track obligations     |
| `/contracts/renewals`         | `ContractRenewalsPage`    | Renewal dashboard     |
| `/contracts/analytics`        | `ContractAnalyticsPage`   | Contract analytics    |

### Component Structure

```
apps/web/app/(dashboard)/contracts/
├── page.tsx                    # Contracts list page
├── [id]/
│   ├── page.tsx                # Contract detail page
│   └── obligations/
│       └── page.tsx            # Obligations page
├── create/
│   └── page.tsx                # Create contract page
├── renewals/
│   └── page.tsx                # Renewals page
└── analytics/
    └── page.tsx                # Analytics page

apps/web/components/contracts/
├── ContractsList.tsx           # Contracts list
├── ContractForm.tsx            # Contract form
├── ContractObligations.tsx     # Obligations tracker
├── ContractRenewals.tsx        # Renewals dashboard
└── ContractAnalytics.tsx       # Analytics dashboard

apps/web/hooks/contracts/
├── useContracts.ts             # Contracts hook
├── useContractDetail.ts        # Contract detail hook
├── useContractObligations.ts   # Obligations hook
└── useContractAnalytics.ts     # Analytics hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages
- **Client Components**: Forms, obligation tracker, analytics charts
- **Feature Flag**: `flags.m57_contract_management = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose            | Variant                  |
| ----------- | ------------------ | ------------------------ |
| `DataTable` | List contracts     | With filters, pagination |
| `Card`      | Contract details   | With actions             |
| `Form`      | Contract forms     | With validation          |
| `Timeline`  | Contract lifecycle | With milestones          |
| `Chart`     | Analytics          | Line, bar, pie           |
| `Badge`     | Status indicators  | With colors              |

### Design Tokens

```typescript
// Contract specific colors
const contractColors = {
  draft: "hsl(var(--contract-draft))",
  active: "hsl(var(--contract-active))",
  expiring: "hsl(var(--contract-expiring))",
  expired: "hsl(var(--contract-expired))",
};

// Contract status colors
const contractStatusColors = {
  draft: "bg-gray-100 text-gray-800",
  active: "bg-green-100 text-green-800",
  expiring: "bg-yellow-100 text-yellow-800",
  expired: "bg-red-100 text-red-800",
  renewed: "bg-blue-100 text-blue-800",
};
```

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  contracts: ["contracts", "list"] as const,
  contractDetail: (id: string) => ["contracts", "detail", id] as const,
  contractObligations: (id: string) =>
    ["contracts", "obligations", id] as const,
  contractRenewals: ["contracts", "renewals"] as const,
  contractAnalytics: ["contracts", "analytics"] as const,
};
```

### Cache Configuration

| Query Type           | Stale Time | Cache Time | Invalidation            |
| -------------------- | ---------- | ---------- | ----------------------- |
| Contracts List       | 10 minutes | 30 minutes | On create/update/delete |
| Contract Detail      | 15 minutes | 60 minutes | On update               |
| Contract Obligations | 5 minutes  | 15 minutes | On obligation update    |
| Contract Renewals    | 5 minutes  | 15 minutes | On renewal action       |
| Contract Analytics   | 30 minutes | 60 minutes | On data change          |

---

## 🚀 Implementation Guide

### Step 1: Create Database Schema

```sql
-- Contract tables
CREATE TABLE contracts (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  contract_number VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  party_a VARCHAR(255) NOT NULL,
  party_b VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  renewal_date DATE,
  value DECIMAL(15,2),
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE contract_obligations (
  id UUID PRIMARY KEY,
  contract_id UUID REFERENCES contracts(id),
  description TEXT NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  assigned_to UUID,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Step 2: Create Components

```typescript
// apps/web/components/contracts/ContractsList.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useContracts } from "@/hooks/contracts/useContracts";

export function ContractsList() {
  const { data, isLoading, error } = useContracts();

  if (isLoading) return <ContractsSkeleton />;
  if (error) return <ContractsErrorState />;
  if (!data?.length) return <ContractsEmptyState />;

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="title"
      filters={filters}
    />
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/contracts/useContracts.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useContracts(contractId?: string) {
  return useQuery({
    queryKey: ["contracts", "management", contractId],
    queryFn: () => api.contracts.getContracts(contractId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateContract() {
  return useMutation({
    mutationFn: (data: ContractData) => api.contracts.createContract(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["contracts", "management"],
      });
    },
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/contracts/page.tsx
import { ContractsList } from "@/components/contracts/ContractsList";
import { ContractsFilters } from "@/components/contracts/ContractsFilters";

export default function ContractsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Contract Management</h1>
        <CreateContractButton />
      </div>
      <ContractsFilters />
      <ContractsList />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/contracts/__tests__/ContractsList.test.tsx
import { render, screen } from "@testing-library/react";
import { ContractsList } from "@/components/contracts/ContractsList";

describe("ContractsList", () => {
  it("renders list of contracts", () => {
    render(<ContractsList />);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});
```

---

## ♿ Accessibility

### WCAG 2.2 AA Compliance

- **Color Contrast**: ≥4.5:1 for normal text, ≥3:1 for large text
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Reader**: Proper ARIA labels and descriptions
- **Focus Management**: Clear focus indicators, logical tab order

### Keyboard Shortcuts

| Shortcut       | Action              |
| -------------- | ------------------- |
| `Ctrl/Cmd + N` | Create new contract |
| `Ctrl/Cmd + F` | Focus search field  |
| `Escape`       | Close modal/dialog  |
| `Enter`        | Submit form         |

### ARIA Implementation

```typescript
// Contracts table
<table role="table" aria-label="Contracts list">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" aria-sort="none">Contract</th>
      <th role="columnheader" aria-sort="none">Status</th>
      <th role="columnheader" aria-sort="none">Expiry</th>
    </tr>
  </thead>
</table>

// Form
<form role="form" aria-label="Create contract">
  <input aria-describedby="contract-error" aria-invalid="false" />
  <div id="contract-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("ContractsList", () => {
  it("renders list of contracts", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles search functionality", () => {});
});

// Hook tests
describe("useContracts", () => {
  it("fetches contracts data", () => {});
  it("handles pagination", () => {});
  it("handles filters", () => {});
  it("handles errors", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Contract Management API Integration", () => {
  it("creates contract successfully", () => {});
  it("updates contract successfully", () => {});
  it("tracks renewals correctly", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Contract Management E2E", () => {
  it("complete create flow", () => {});
  it("complete edit flow", () => {});
  it("renewal tracking flow", () => {});
  it("search and filter functionality", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("Contract Management Accessibility", () => {
  it("meets WCAG 2.2 AA standards", () => {});
  it("supports keyboard navigation", () => {});
  it("works with screen readers", () => {});
  it("has proper color contrast", () => {});
});
```

---

## ⚡ Performance

### Bundle Size

- **Target**: ≤250KB gzipped per route
- **Current**: <CURRENT_SIZE>KB
- **Optimization**: Code splitting, lazy loading

### Loading Performance

- **TTFB**: ≤70ms (Time to First Byte)
- **TTI**: ≤200ms (Time to Interactive)
- **LCP**: ≤2.5s (Largest Contentful Paint)

### Optimization Strategies

```typescript
// Lazy loading
const ContractCreatePage = lazy(() => import("./create/page"));

// Code splitting
const ContractForm = lazy(() => import("./components/ContractForm"));

// Virtual scrolling for large lists
import { FixedSizeList as List } from "react-window";
```

---

## ✅ Quality Gates

### Code Quality

| Gate              | Threshold | Enforcement |
| ----------------- | --------- | ----------- |
| TypeScript errors | 0         | CI blocks   |
| ESLint errors     | 0         | CI blocks   |
| Test coverage     | ≥90%      | CI blocks   |
| Bundle size       | ≤250KB    | CI blocks   |

### Performance

| Gate                     | Threshold | Enforcement |
| ------------------------ | --------- | ----------- |
| TTFB                     | ≤70ms     | Manual      |
| TTI                      | ≤200ms    | Manual      |
| Lighthouse Performance   | ≥90       | CI warns    |
| Lighthouse Accessibility | ≥95       | CI warns    |

### Accessibility

| Gate                | Threshold          | Enforcement |
| ------------------- | ------------------ | ----------- |
| WCAG 2.2 AA         | 100%               | CI blocks   |
| Axe violations      | 0 serious/critical | CI blocks   |
| Keyboard navigation | 100%               | Manual      |
| Screen reader       | 100%               | Manual      |

---

## 🚀 Deployment

### Feature Flag

```typescript
// Feature flag configuration
const flags = {
  m57_contract_management: false, // Default: disabled
};

// Usage in components
if (flags.m57_contract_management) {
  return <ContractsList />;
}
return <ComingSoon />;
```

### Rollout Plan

| Environment | Cohort           | Success Criteria  | Duration |
| ----------- | ---------------- | ----------------- | -------- |
| Dev         | All developers   | Manual QA passes  | 1 day    |
| Staging     | QA team          | All tests pass    | 2 days   |
| Production  | Beta users (5%)  | Error rate < 0.1% | 3 days   |
| Production  | All users (100%) | Monitor for 24h   | Ongoing  |

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m57_contract_management = false`
2. **Invalidate cache**: `revalidateTag('contracts')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Contract lifecycle functional
- [ ] Renewal tracking functional
- [ ] Search and filtering functional
- [ ] Pagination working correctly
- [ ] Form validation complete
- [ ] Error handling implemented
- [ ] Loading states shown
- [ ] Success messages displayed
- [ ] Responsive design verified

### Quality Requirements

- [ ] All quality gates passed
- [ ] Test coverage ≥90%
- [ ] Accessibility compliant
- [ ] Performance targets met
- [ ] Code review approved
- [ ] QA sign-off obtained
- [ ] Design sign-off obtained
- [ ] Feature flag deployed

---

**Ready to implement Contract Management UI! 🚀**

if (isLoading) return <ContractsSkeleton />;
if (error) return <ContractsErrorState />;
if (!data?.length) return <ContractsEmptyState />;

return (
<DataTable
      data={data}
      columns={columns}
      searchKey="title"
      filters={filters}
    />
);
}

````

---

## ✅ Quality Gates

### Code Quality

| Gate              | Threshold | Enforcement |
| ----------------- | --------- | ----------- |
| TypeScript errors | 0         | CI blocks   |
| ESLint errors     | 0         | CI blocks   |
| Test coverage     | ≥90%      | CI blocks   |
| Bundle size       | ≤350KB    | CI blocks   |

---

## 🚀 Deployment

### Feature Flag

```typescript
const flags = {
  m57_contract_management: false, // Default: disabled
};
````

---

## 📝 Definition of Done

### Functional Requirements

- [ ] Contract creation working
- [ ] Lifecycle tracking functional
- [ ] Renewal tracking working
- [ ] Obligation management working
- [ ] Analytics dashboard working
- [ ] Form validation complete
- [ ] Error handling implemented
- [ ] Loading states shown
- [ ] Success messages displayed
- [ ] Responsive design verified

### Quality Requirements

- [ ] All quality gates passed
- [ ] Test coverage ≥90%
- [ ] Accessibility compliant
- [ ] Performance targets met
- [ ] Code review approved
- [ ] QA sign-off obtained
- [ ] Design sign-off obtained
- [ ] Feature flag deployed

---

**Ready to implement Contract Management! 🚀**
