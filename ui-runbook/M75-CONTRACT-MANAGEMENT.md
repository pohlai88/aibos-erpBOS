# 🎯 M75: Contract Management - UI Implementation Runbook

**Module ID**: M75  
**Module Name**: Contract Management  
**Priority**: 🔶 MEDIUM  
**Phase**: Phase 15 - User Experience  
**Estimated Effort**: 4 days  
**Last Updated**: 2025-10-06

**Status**: ❌ NO - CREATE NEW Module

---

## 📋 Module Overview

### Business Value

Contract Management provides **comprehensive contract lifecycle management** for businesses requiring organized contract handling and compliance tracking.

**Key Benefits**:

- Complete contract lifecycle management (creation to renewal)
- Contract templates and automated generation
- Contract compliance monitoring and alerts
- Integration with existing modules (AP, AR, Projects, etc.)

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status      | Details                   |
| ------------- | ----------- | ------------------------- |
| **Database**  | ✅ Complete | Schema implemented        |
| **Services**  | ✅ Complete | Business logic ready      |
| **API**       | ✅ Complete | 20 endpoints available    |
| **Contracts** | ✅ Complete | Type-safe schemas defined |

### API Endpoints

**Contract Management Operations** (20 endpoints):

- ✅ `/api/contracts` - List contracts
- ✅ `/api/contracts/[id]` - Get contract details
- ✅ `/api/contracts/create` - Create new contract
- ✅ `/api/contracts/[id]/update` - Update contract
- ✅ `/api/contracts/[id]/delete` - Delete contract
- ✅ `/api/contracts/[id]/approve` - Approve contract
- ✅ `/api/contracts/[id]/reject` - Reject contract
- ✅ `/api/contracts/[id]/sign` - Sign contract
- ✅ `/api/contracts/[id]/renew` - Renew contract
- ✅ `/api/contracts/[id]/terminate` - Terminate contract
- ✅ `/api/contracts/[id]/amendments` - Get amendments
- ✅ `/api/contracts/[id]/amendments/create` - Create amendment
- ✅ `/api/contracts/[id]/obligations` - Get obligations
- ✅ `/api/contracts/[id]/obligations/create` - Create obligation
- ✅ `/api/contracts/[id]/obligations/[obligationId]` - Update obligation
- ✅ `/api/contracts/[id]/obligations/[obligationId]/complete` - Complete obligation
- ✅ `/api/contracts/templates` - Get contract templates
- ✅ `/api/contracts/search` - Search contracts
- ✅ `/api/contracts/analytics` - Get contract analytics
- ✅ `/api/contracts/alerts` - Get contract alerts

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                         | Page Component            | Purpose                   |
| ----------------------------- | ------------------------- | ------------------------- |
| `/contracts`                  | `ContractListPage`        | List and search contracts |
| `/contracts/[id]`             | `ContractDetailPage`      | View contract details     |
| `/contracts/create`           | `ContractCreatePage`      | Create new contract       |
| `/contracts/[id]/edit`        | `ContractEditPage`        | Edit contract details     |
| `/contracts/[id]/amendments`  | `ContractAmendmentsPage`  | View amendments           |
| `/contracts/[id]/obligations` | `ContractObligationsPage` | View obligations          |
| `/contracts/templates`        | `ContractTemplatesPage`   | Contract templates        |
| `/contracts/analytics`        | `ContractAnalyticsPage`   | Contract analytics        |
| `/contracts/alerts`           | `ContractAlertsPage`      | Contract alerts           |

### Component Structure

```
apps/web/app/(dashboard)/contracts/
├── page.tsx                    # List page
├── [id]/
│   ├── page.tsx               # Detail page
│   ├── edit/
│   │   └── page.tsx           # Edit page
│   ├── amendments/
│   │   └── page.tsx           # Amendments page
│   └── obligations/
│       └── page.tsx           # Obligations page
├── create/
│   └── page.tsx               # Create page
├── templates/
│   └── page.tsx               # Templates page
├── analytics/
│   └── page.tsx               # Analytics page
└── alerts/
    └── page.tsx               # Alerts page

apps/web/components/contracts/
├── ContractList.tsx           # List component
├── ContractCard.tsx           # Card component
├── ContractForm.tsx           # Form component
├── ContractAmendments.tsx     # Amendments component
├── ContractObligations.tsx    # Obligations component
├── ContractTemplates.tsx      # Templates component
├── ContractAnalytics.tsx      # Analytics component
├── ContractAlerts.tsx         # Alerts component
├── ContractFilters.tsx        # Filter component
└── ContractActions.tsx        # Action buttons

apps/web/hooks/contracts/
├── useContractList.ts        # List hook
├── useContractDetail.ts       # Detail hook
├── useContractCreate.ts       # Create hook
├── useContractUpdate.ts       # Update hook
├── useContractApprove.ts      # Approve hook
├── useContractSign.ts         # Sign hook
├── useContractRenew.ts        # Renew hook
├── useContractAmendments.ts   # Amendments hook
├── useContractObligations.ts   # Obligations hook
└── useContractAnalytics.ts    # Analytics hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages (data fetching)
- **Client Components**: Forms, interactive elements, modals
- **Feature Flag**: `flags.m75_contract_management = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose              | Variant                    |
| ----------- | -------------------- | -------------------------- |
| `DataTable` | List contracts       | With filters, pagination   |
| `Card`      | Contract details     | With actions               |
| `Form`      | Create/edit contract | With validation            |
| `Button`    | Actions              | Primary, secondary, danger |
| `Modal`     | Confirmations        | With backdrop              |
| `Timeline`  | Contract timeline    | With status indicators     |
| `Calendar`  | Contract calendar    | With key dates             |

### Design Tokens

```typescript
// Contract-specific colors
const contractColors = {
  draft: "hsl(var(--contract-draft))",
  pending: "hsl(var(--contract-pending))",
  approved: "hsl(var(--contract-approved))",
  signed: "hsl(var(--contract-signed))",
  active: "hsl(var(--contract-active))",
  expired: "hsl(var(--contract-expired))",
  terminated: "hsl(var(--contract-terminated))",
  renewed: "hsl(var(--contract-renewed))",
};

// Contract status colors
const contractStatusColors = {
  draft: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  signed: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  expired: "bg-red-100 text-red-800",
  terminated: "bg-gray-100 text-gray-800",
  renewed: "bg-purple-100 text-purple-800",
};

// Contract type colors
const contractTypeColors = {
  service: "hsl(var(--contract-service))",
  purchase: "hsl(var(--contract-purchase))",
  lease: "hsl(var(--contract-lease))",
  employment: "hsl(var(--contract-employment))",
  partnership: "hsl(var(--contract-partnership))",
  nda: "hsl(var(--contract-nda))",
  other: "hsl(var(--contract-other))",
};
```

### Theme Support

- **Dark Mode**: Default theme
- **Light Mode**: Available via theme toggle
- **High Contrast**: WCAG AAA compliance
- **Contract Themes**: Status-based themes

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  list: ["contracts", "list"] as const,
  detail: (id: string) => ["contracts", "detail", id] as const,
  amendments: (id: string) => ["contracts", "amendments", id] as const,
  obligations: (id: string) => ["contracts", "obligations", id] as const,
  templates: ["contracts", "templates"] as const,
  search: (query: string) => ["contracts", "search", query] as const,
  analytics: ["contracts", "analytics"] as const,
  alerts: ["contracts", "alerts"] as const,
};
```

### Cache Configuration

| Query Type  | Stale Time | Cache Time | Invalidation            |
| ----------- | ---------- | ---------- | ----------------------- |
| List        | 5 minutes  | 10 minutes | On create/update/delete |
| Detail      | 10 minutes | 30 minutes | On update/delete        |
| Amendments  | 5 minutes  | 15 minutes | On amendment create     |
| Obligations | 1 minute   | 5 minutes  | On obligation update    |
| Templates   | 30 minutes | 2 hours    | On template change      |
| Analytics   | 15 minutes | 45 minutes | On contract change      |
| Alerts      | 1 minute   | 5 minutes  | On alert update         |

### Invalidation Rules

```typescript
// After creating contract
queryClient.invalidateQueries({ queryKey: ["contracts", "list"] });
queryClient.invalidateQueries({ queryKey: ["contracts", "analytics"] });

// After updating contract
queryClient.invalidateQueries({ queryKey: ["contracts", "detail", id] });
queryClient.invalidateQueries({ queryKey: ["contracts", "list"] });

// After approving contract
queryClient.invalidateQueries({ queryKey: ["contracts", "detail", id] });
queryClient.invalidateQueries({ queryKey: ["contracts", "alerts"] });
```

---

## 🎭 User Experience

### User Flows

#### 1. Create Contract

1. User navigates to contracts page
2. User clicks "Create Contract" button
3. System opens contract creation form
4. User selects contract template
5. User fills contract details
6. User adds parties and terms
7. User submits contract for approval

#### 2. Approve Contract

1. User receives approval notification
2. User clicks notification link
3. System opens contract approval page
4. User reviews contract details
5. User clicks "Approve" or "Reject"
6. System processes decision
7. Contract moves to next stage

#### 3. Manage Obligations

1. User views contract detail page
2. User navigates to obligations tab
3. User sees list of obligations
4. User clicks on obligation
5. User updates obligation status
6. User marks obligation as complete

### UI States

| State          | Component            | Message                          |
| -------------- | -------------------- | -------------------------------- |
| **Empty**      | `ContractEmptyState` | "No contracts found"             |
| **Loading**    | `ContractSkeleton`   | Loading skeleton                 |
| **Error**      | `ContractErrorState` | "Failed to load contracts"       |
| **No Results** | `ContractNoResults`  | "No contracts match your search" |

### Interactions

- **Hover**: Card elevation, button color change
- **Focus**: Clear focus ring, keyboard navigation
- **Click**: Immediate feedback, loading state
- **Form Validation**: Inline errors, real-time validation
- **Calendar**: Date selection, key date highlighting

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
| `Ctrl/Cmd + A` | Approve contract    |
| `Ctrl/Cmd + S` | Sign contract       |
| `Escape`       | Close modal/dialog  |
| `Enter`        | Submit form         |

### ARIA Implementation

```typescript
// Contract list
<table role="table" aria-label="Contracts list">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" aria-sort="none">Contract Number</th>
      <th role="columnheader" aria-sort="none">Status</th>
      <th role="columnheader" aria-sort="none">Expiry Date</th>
    </tr>
  </thead>
</table>

// Contract form
<form role="form" aria-label="Create Contract">
  <input
    aria-describedby="name-error"
    aria-invalid="false"
    aria-label="Contract Name"
  />
  <div id="name-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("ContractList", () => {
  it("renders list of contracts", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles search functionality", () => {});
});

// Hook tests
describe("useContractCreate", () => {
  it("creates contract successfully", () => {});
  it("handles creation errors", () => {});
  it("validates contract data", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Contract API Integration", () => {
  it("creates contract successfully", () => {});
  it("approves contract successfully", () => {});
  it("signs contract successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Contract Management E2E", () => {
  it("complete contract creation flow", () => {});
  it("complete contract approval flow", () => {});
  it("complete contract signing flow", () => {});
  it("complete obligation management flow", () => {});
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

- **Target**: ≤350KB gzipped per route
- **Current**: <CURRENT_SIZE>KB
- **Optimization**: Code splitting, lazy loading, form optimization

### Loading Performance

- **TTFB**: ≤70ms (Time to First Byte)
- **TTI**: ≤200ms (Time to Interactive)
- **LCP**: ≤2.5s (Largest Contentful Paint)

### Optimization Strategies

```typescript
// Lazy loading
const ContractForm = lazy(() => import("./components/ContractForm"));
const ContractAnalytics = lazy(() => import("./components/ContractAnalytics"));

// Form optimization
import { useForm } from "react-hook-form";

// Virtual scrolling for large lists
import { FixedSizeList as List } from "react-window";
```

---

## 🚀 Implementation Guide

### Step 1: Setup

```bash
# Create directory structure
mkdir -p apps/web/app/(dashboard)/contracts
mkdir -p apps/web/components/contracts
mkdir -p apps/web/hooks/contracts

# Create feature flag
echo 'flags.m75_contract_management = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/contracts/ContractList.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useContractList } from "@/hooks/contracts/useContractList";

export function ContractList() {
  const { data, isLoading, error } = useContractList();

  if (isLoading) return <ContractSkeleton />;
  if (error) return <ContractErrorState />;
  if (!data?.length) return <ContractEmptyState />;

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="contractNumber"
      filters={filters}
    />
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/contracts/useContractList.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useContractList(filters?: ContractFilters) {
  return useQuery({
    queryKey: ["contracts", "list", filters],
    queryFn: () => api.contracts.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/contracts/page.tsx
import { ContractList } from "@/components/contracts/ContractList";
import { ContractFilters } from "@/components/contracts/ContractFilters";

export default function ContractPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Contracts</h1>
        <CreateContractButton />
      </div>
      <ContractFilters />
      <ContractList />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/contracts/__tests__/ContractList.test.tsx
import { render, screen } from "@testing-library/react";
import { ContractList } from "@/components/contracts/ContractList";

describe("ContractList", () => {
  it("renders list of contracts", () => {
    render(<ContractList />);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});
```

---

## ✅ Quality Gates

### Code Quality

| Gate              | Threshold | Enforcement |
| ----------------- | --------- | ----------- |
| TypeScript errors | 0         | CI blocks   |
| ESLint errors     | 0         | CI blocks   |
| Test coverage     | ≥90%      | CI blocks   |
| Bundle size       | ≤350KB    | CI blocks   |

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
  m75_contract_management: false, // Default: disabled
};

// Usage in components
if (flags.m75_contract_management) {
  return <ContractList />;
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

1. **Set feature flag**: `flags.m75_contract_management = false`
2. **Invalidate cache**: `revalidateTag('contracts')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Contract creation functional
- [ ] Contract approval working
- [ ] Contract signing functional
- [ ] Amendment management working
- [ ] Obligation tracking functional
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
