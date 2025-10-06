# 🎯 M45: Income Tax Provision & Deferred Taxes - UI Implementation Runbook

**Module ID**: M45  
**Module Name**: Income Tax Provision & Deferred Taxes  
**Priority**: 🔥 HIGH  
**Phase**: Phase 11 - Critical Missing Modules  
**Estimated Effort**: 3.5 days  
**Last Updated**: 2025-10-06

**Status**: 🔄 HYBRID - Enhance M13-TAX-MANAGEMENT

---

## 📋 Module Overview

Income Tax Provision & Deferred Taxes provides **comprehensive tax provision calculation** and **deferred tax management** for businesses requiring **ASC 740/IAS 12 compliance**, **effective tax rate analysis**, and **tax reconciliation**.

### Business Value

**Key Benefits**:

- **Tax Provision**: Calculate current and deferred tax provisions
- **ASC 740/IAS 12 Compliance**: Automated tax accounting compliance
- **Deferred Tax Tracking**: Track temporary differences and deferred tax assets/liabilities
- **Effective Tax Rate**: Calculate and analyze effective tax rates

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status     | Details                             |
| ------------- | ---------- | ----------------------------------- |
| **Database**  | 🔄 PARTIAL | Basic tax exists, needs provision   |
| **Services**  | 🔄 PARTIAL | Tax services exist, needs provision |
| **API**       | 🔄 PARTIAL | Tax APIs exist, needs provision     |
| **Contracts** | 🔄 PARTIAL | Tax types exist, needs provision    |

### API Endpoints

**Income Tax Provision** (Enhancement needed):

- 🔄 `/api/tax` - Enhance with provision fields
- ❌ `/api/tax/provision` - Calculate tax provision
- ❌ `/api/tax/deferred` - Manage deferred taxes
- ❌ `/api/tax/reconciliation` - Tax reconciliation
- ❌ `/api/tax/effective-rate` - Effective tax rate analysis

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                 | Page Component          | Purpose                     |
| --------------------- | ----------------------- | --------------------------- |
| `/tax/provision`      | `TaxProvisionPage`      | Tax provision management    |
| `/tax/deferred`       | `DeferredTaxPage`       | Deferred tax tracking       |
| `/tax/reconciliation` | `TaxReconciliationPage` | Tax reconciliation          |
| `/tax/effective-rate` | `EffectiveTaxRatePage`  | Effective tax rate analysis |

### Component Structure

```
apps/web/app/(dashboard)/tax/
├── provision/
│   └── page.tsx                    # Tax provision page
├── deferred/
│   └── page.tsx                    # Deferred tax page
├── reconciliation/
│   └── page.tsx                    # Tax reconciliation page
└── effective-rate/
    └── page.tsx                    # Effective tax rate page

apps/web/components/tax/
├── TaxProvisionForm.tsx            # Tax provision form
├── DeferredTaxList.tsx             # Deferred tax list
├── TaxReconciliation.tsx           # Tax reconciliation
├── EffectiveTaxRateChart.tsx      # Effective tax rate chart
└── TemporaryDifferences.tsx        # Temporary differences

apps/web/hooks/tax/
├── useTaxProvision.ts              # Tax provision hook
├── useDeferredTax.ts               # Deferred tax hook
├── useTaxReconciliation.ts         # Tax reconciliation hook
└── useEffectiveTaxRate.ts          # Effective tax rate hook
```

### Server/Client Boundaries

- **Server Components**: List pages, analysis pages
- **Client Components**: Forms, calculators, charts
- **Feature Flag**: `flags.m45_tax_provision = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose             | Variant                    |
| ----------- | ------------------- | -------------------------- |
| `DataTable` | List deferred taxes | With filters, pagination   |
| `Card`      | Provision details   | With actions               |
| `Form`      | Provision forms     | With validation            |
| `Button`    | Actions             | Primary, secondary, danger |
| `Currency`  | Tax amount input    | With formatting            |
| `Chart`     | Effective tax rate  | With tooltips              |
| `Badge`     | Tax status          | With colors                |

### Design Tokens

```typescript
// Tax provision specific colors
const taxProvisionColors = {
  current: "hsl(var(--tax-current))",
  deferred: "hsl(var(--tax-deferred))",
  asset: "hsl(var(--tax-asset))",
  liability: "hsl(var(--tax-liability))",
};

// Temporary difference colors
const differenceColors = {
  taxable: "bg-red-100 text-red-800",
  deductible: "bg-green-100 text-green-800",
  permanent: "bg-gray-100 text-gray-800",
  reconciling: "bg-blue-100 text-blue-800",
};
```

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  taxProvision: ["tax", "provision"] as const,
  deferredTax: ["tax", "deferred"] as const,
  taxReconciliation: ["tax", "reconciliation"] as const,
  effectiveTaxRate: ["tax", "effective-rate"] as const,
};
```

### Cache Configuration

| Query Type         | Stale Time | Cache Time | Invalidation        |
| ------------------ | ---------- | ---------- | ------------------- |
| Tax Provision      | 10 minutes | 30 minutes | On provision update |
| Deferred Tax       | 10 minutes | 30 minutes | On deferred update  |
| Tax Reconciliation | 5 minutes  | 15 minutes | On reconciliation   |
| Effective Tax Rate | 5 minutes  | 15 minutes | On calculation      |

---

## 🎭 User Experience

### User Flows

#### 1. Calculate Tax Provision

1. User navigates to `/tax/provision`
2. System shows current period tax data
3. User clicks "Calculate Provision"
4. System calculates current and deferred tax provision
5. User reviews and approves provision

#### 2. Manage Deferred Taxes

1. User navigates to `/tax/deferred`
2. System shows deferred tax assets and liabilities
3. User can view temporary differences
4. User can adjust deferred tax balances
5. System updates deferred tax schedule

#### 3. Tax Reconciliation

1. User navigates to `/tax/reconciliation`
2. System shows book vs tax differences
3. User can reconcile permanent and temporary differences
4. System generates tax reconciliation report

### UI States

| State          | Component                | Message                           |
| -------------- | ------------------------ | --------------------------------- |
| **Empty**      | `TaxProvisionEmptyState` | "No tax provision found"          |
| **Loading**    | `TaxProvisionSkeleton`   | Loading skeleton                  |
| **Error**      | `TaxProvisionErrorState` | "Failed to load tax provision"    |
| **No Results** | `TaxProvisionNoResults`  | "No provisions match your search" |

---

## 🚀 Implementation Guide

### Step 1: Enhance M13-TAX-MANAGEMENT

```bash
# Enhance existing tax management module
# Add tax provision fields to tax schema
# Add deferred tax calculation services
# Add provision APIs
```

### Step 2: Create Components

```typescript
// apps/web/components/tax/TaxProvisionForm.tsx
"use client";

import { Form } from "@/components/ui/form";
import { useTaxProvision } from "@/hooks/tax/useTaxProvision";

export function TaxProvisionForm({ periodId }: { periodId: string }) {
  const { mutate: calculateProvision } = useTaxProvision();

  return (
    <Form onSubmit={(data) => calculateProvision({ periodId, ...data })}>
      {/* Tax provision form fields */}
    </Form>
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/tax/useTaxProvision.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useTaxProvision(periodId?: string) {
  return useQuery({
    queryKey: ["tax", "provision", periodId],
    queryFn: () => api.tax.getTaxProvision(periodId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCalculateTaxProvision() {
  return useMutation({
    mutationFn: (data: TaxProvisionData) => api.tax.calculateTaxProvision(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax", "provision"] });
    },
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/tax/provision/page.tsx
import { TaxProvisionList } from "@/components/tax/TaxProvisionList";
import { TaxProvisionFilters } from "@/components/tax/TaxProvisionFilters";

export default function TaxProvisionPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tax Provision</h1>
        <CalculateTaxProvisionButton />
      </div>
      <TaxProvisionFilters />
      <TaxProvisionList />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/tax/provision/__tests__/TaxProvisionList.test.tsx
import { render, screen } from "@testing-library/react";
import { TaxProvisionList } from "@/components/tax/TaxProvisionList";

describe("TaxProvisionList", () => {
  it("renders list of tax provisions", () => {
    render(<TaxProvisionList />);
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

| Shortcut       | Action                      |
| -------------- | --------------------------- |
| `Ctrl/Cmd + N` | Calculate new tax provision |
| `Ctrl/Cmd + F` | Focus search field          |
| `Escape`       | Close modal/dialog          |
| `Enter`        | Submit form                 |

### ARIA Implementation

```typescript
// Tax provision table
<table role="table" aria-label="Tax provisions list">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" aria-sort="none">Period</th>
      <th role="columnheader" aria-sort="none">Current Tax</th>
      <th role="columnheader" aria-sort="none">Deferred Tax</th>
    </tr>
  </thead>
</table>

// Form
<form role="form" aria-label="Calculate tax provision">
  <input aria-describedby="provision-error" aria-invalid="false" />
  <div id="provision-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("TaxProvisionList", () => {
  it("renders list of tax provisions", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles search functionality", () => {});
});

// Hook tests
describe("useTaxProvision", () => {
  it("fetches tax provision data", () => {});
  it("handles pagination", () => {});
  it("handles filters", () => {});
  it("handles errors", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Tax Provision API Integration", () => {
  it("calculates tax provision successfully", () => {});
  it("updates tax provision successfully", () => {});
  it("calculates deferred taxes correctly", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Tax Provision E2E", () => {
  it("complete calculation flow", () => {});
  it("complete edit flow", () => {});
  it("deferred tax analysis flow", () => {});
  it("search and filter functionality", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("Tax Provision Accessibility", () => {
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
const TaxProvisionCreatePage = lazy(() => import("./create/page"));

// Code splitting
const TaxProvisionForm = lazy(() => import("./components/TaxProvisionForm"));

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
  m45_tax_provision: false, // Default: disabled
};

// Usage in components
if (flags.m45_tax_provision) {
  return <TaxProvisionList />;
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

1. **Set feature flag**: `flags.m45_tax_provision = false`
2. **Invalidate cache**: `revalidateTag('tax-provision')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Tax provision calculation functional
- [ ] Deferred tax tracking functional
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

**Ready to implement Income Tax Provision & Deferred Taxes UI! 🚀**
<Form onSubmit={(data) => calculateProvision({ periodId, ...data })}>
{/_ Tax provision form fields _/}
</Form>
);
}

````

### Step 3: Create Hooks

```typescript
// apps/web/hooks/tax/useDeferredTax.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useDeferredTax(filters?: DeferredTaxFilters) {
  return useQuery({
    queryKey: ["tax", "deferred", filters],
    queryFn: () => api.tax.deferred(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
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
| Bundle size       | ≤300KB    | CI blocks   |

---

## 🚀 Deployment

### Feature Flag

```typescript
const flags = {
  m45_tax_provision: false, // Default: disabled
};
```

### Rollout Plan

| Environment | Cohort           | Success Criteria  | Duration |
| ----------- | ---------------- | ----------------- | -------- |
| Dev         | All developers   | Manual QA passes  | 1 day    |
| Staging     | QA team          | All tests pass    | 2 days   |
| Production  | Beta users (5%)  | Error rate < 0.1% | 3 days   |
| Production  | All users (100%) | Monitor for 24h   | Ongoing  |

---

## 📝 Definition of Done

### Functional Requirements

- [ ] Tax provision calculation working
- [ ] Deferred tax tracking functional
- [ ] Tax reconciliation working
- [ ] Effective tax rate analysis working
- [ ] ASC 740/IAS 12 compliance reporting working
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

**Ready to enhance M13-TAX-MANAGEMENT with Income Tax Provision! 🚀**
