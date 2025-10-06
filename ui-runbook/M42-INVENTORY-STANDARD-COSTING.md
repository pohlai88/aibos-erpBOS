# 🎯 M42: Inventory Standard Costing - UI Implementation Runbook

**Module ID**: M42  
**Module Name**: Inventory Standard Costing  
**Priority**: 🔥 HIGH  
**Phase**: Phase 11 - Critical Missing Modules  
**Estimated Effort**: 3 days  
**Last Updated**: 2025-10-06

**Status**: 🔄 HYBRID - Enhance M11-INVENTORY

---

## 📋 Module Overview

Inventory Standard Costing provides **standard cost management** and **variance analysis** for businesses requiring **manufacturing cost control**, **cost variance tracking**, and **standard vs actual cost analysis**.

### Business Value

**Key Benefits**:

- **Standard Cost Management**: Set and maintain standard costs for inventory items
- **Variance Analysis**: Track purchase price, usage, and efficiency variances
- **Cost Control**: Monitor cost performance against standards
- **Manufacturing Integration**: Support for manufacturing cost accounting

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status     | Details                                 |
| ------------- | ---------- | --------------------------------------- |
| **Database**  | 🔄 PARTIAL | Basic inventory exists, needs costing   |
| **Services**  | 🔄 PARTIAL | Inventory services exist, needs costing |
| **API**       | 🔄 PARTIAL | Inventory APIs exist, needs costing     |
| **Contracts** | 🔄 PARTIAL | Inventory types exist, needs costing    |

### API Endpoints

**Inventory Standard Costing** (Enhancement needed):

- 🔄 `/api/inventory` - Enhance with standard cost fields
- ❌ `/api/inventory/standard-costs` - Manage standard costs
- ❌ `/api/inventory/variances` - Calculate cost variances
- ❌ `/api/inventory/cost-rollup` - Roll up component costs
- ❌ `/api/inventory/variance-reports` - Generate variance reports

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                          | Page Component         | Purpose                  |
| ------------------------------ | ---------------------- | ------------------------ |
| `/inventory/standard-costs`    | `StandardCostsPage`    | Manage standard costs    |
| `/inventory/variances`         | `VariancesPage`        | View cost variances      |
| `/inventory/cost-rollup`       | `CostRollupPage`       | Cost rollup calculations |
| `/inventory/variance-analysis` | `VarianceAnalysisPage` | Variance analysis        |

### Component Structure

```
apps/web/app/(dashboard)/inventory/
├── standard-costs/
│   └── page.tsx                    # Standard costs page
├── variances/
│   └── page.tsx                    # Variances page
├── cost-rollup/
│   └── page.tsx                    # Cost rollup page
└── variance-analysis/
    └── page.tsx                    # Variance analysis page

apps/web/components/inventory/
├── StandardCostForm.tsx            # Standard cost form
├── VarianceList.tsx                # Variance list
├── VarianceChart.tsx               # Variance charts
├── CostRollupCalculator.tsx        # Cost rollup calculator
└── VarianceAnalysis.tsx            # Variance analysis

apps/web/hooks/inventory/
├── useStandardCosts.ts             # Standard costs hook
├── useVariances.ts                 # Variances hook
├── useCostRollup.ts                # Cost rollup hook
└── useVarianceAnalysis.ts          # Variance analysis hook
```

### Server/Client Boundaries

- **Server Components**: List pages, analysis pages (data fetching)
- **Client Components**: Forms, calculators, charts
- **Feature Flag**: `flags.m42_standard_costing = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose             | Variant                    |
| ----------- | ------------------- | -------------------------- |
| `DataTable` | List variances      | With filters, pagination   |
| `Card`      | Cost details        | With actions               |
| `Form`      | Standard cost forms | With validation            |
| `Button`    | Actions             | Primary, secondary, danger |
| `Currency`  | Cost input          | With formatting            |
| `Chart`     | Variance charts     | With tooltips              |
| `Badge`     | Variance status     | With colors                |

### Design Tokens

```typescript
// Standard costing specific colors
const costingColors = {
  standard: "hsl(var(--cost-standard))",
  actual: "hsl(var(--cost-actual))",
  favorable: "hsl(var(--variance-favorable))",
  unfavorable: "hsl(var(--variance-unfavorable))",
};

// Variance type colors
const varianceColors = {
  price: "bg-blue-100 text-blue-800",
  usage: "bg-purple-100 text-purple-800",
  efficiency: "bg-yellow-100 text-yellow-800",
  favorable: "bg-green-100 text-green-800",
  unfavorable: "bg-red-100 text-red-800",
};
```

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  standardCosts: ["inventory", "standard-costs"] as const,
  variances: ["inventory", "variances"] as const,
  costRollup: ["inventory", "cost-rollup"] as const,
  varianceAnalysis: ["inventory", "variance-analysis"] as const,
};
```

### Cache Configuration

| Query Type        | Stale Time | Cache Time | Invalidation   |
| ----------------- | ---------- | ---------- | -------------- |
| Standard Costs    | 10 minutes | 30 minutes | On cost update |
| Variances         | 5 minutes  | 15 minutes | On transaction |
| Cost Rollup       | 1 hour     | 4 hours    | On cost update |
| Variance Analysis | 5 minutes  | 15 minutes | On transaction |

---

## 🎭 User Experience

### User Flows

#### 1. Set Standard Cost

1. User navigates to `/inventory/standard-costs`
2. System shows inventory items with current standard costs
3. User selects item and clicks "Update Standard Cost"
4. System shows cost form
5. User enters new standard cost
6. System updates cost and recalculates variances

#### 2. View Variances

1. User navigates to `/inventory/variances`
2. System shows variance list (price, usage, efficiency)
3. User can filter by variance type, item, date range
4. User can view variance details and drill down

#### 3. Analyze Cost Performance

1. User navigates to `/inventory/variance-analysis`
2. System shows variance charts and trends
3. User can analyze favorable vs unfavorable variances
4. User can identify cost control opportunities

### UI States

| State          | Component            | Message                          |
| -------------- | -------------------- | -------------------------------- |
| **Empty**      | `VarianceEmptyState` | "No variances found"             |
| **Loading**    | `VarianceSkeleton`   | Loading skeleton                 |
| **Error**      | `VarianceErrorState` | "Failed to load variances"       |
| **No Results** | `VarianceNoResults`  | "No variances match your search" |

---

## 🚀 Implementation Guide

### Step 1: Enhance M11-INVENTORY

```bash
# Enhance existing inventory module
# Add standard costing fields to inventory schema
# Add variance calculation services
# Add costing APIs
```

### Step 2: Create Components

```typescript
// apps/web/components/inventory/StandardCostForm.tsx
"use client";

import { Form } from "@/components/ui/form";
import { useStandardCosts } from "@/hooks/inventory/useStandardCosts";

export function StandardCostForm({ itemId }: { itemId: string }) {
  const { mutate: updateCost } = useStandardCosts();

  return <Form>{/* Standard cost form implementation */}</Form>;
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/inventory/useStandardCosts.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useStandardCosts(itemId?: string) {
  return useQuery({
    queryKey: ["inventory", "standard-costs", itemId],
    queryFn: () => api.inventory.getStandardCosts(itemId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateStandardCost() {
  return useMutation({
    mutationFn: (data: StandardCostUpdate) =>
      api.inventory.updateStandardCost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["inventory", "standard-costs"],
      });
    },
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/inventory/standard-costs/page.tsx
import { StandardCostList } from "@/components/inventory/StandardCostList";
import { StandardCostFilters } from "@/components/inventory/StandardCostFilters";

export default function StandardCostsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Standard Costs</h1>
        <CreateStandardCostButton />
      </div>
      <StandardCostFilters />
      <StandardCostList />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/inventory/standard-costs/__tests__/StandardCostList.test.tsx
import { render, screen } from "@testing-library/react";
import { StandardCostList } from "@/components/inventory/StandardCostList";

describe("StandardCostList", () => {
  it("renders list of standard costs", () => {
    render(<StandardCostList />);
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

| Shortcut       | Action                   |
| -------------- | ------------------------ |
| `Ctrl/Cmd + N` | Create new standard cost |
| `Ctrl/Cmd + F` | Focus search field       |
| `Escape`       | Close modal/dialog       |
| `Enter`        | Submit form              |

### ARIA Implementation

```typescript
// Standard cost table
<table role="table" aria-label="Standard costs list">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" aria-sort="none">Item</th>
      <th role="columnheader" aria-sort="none">Standard Cost</th>
      <th role="columnheader" aria-sort="none">Variance</th>
    </tr>
  </thead>
</table>

// Form
<form role="form" aria-label="Create standard cost">
  <input aria-describedby="cost-error" aria-invalid="false" />
  <div id="cost-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("StandardCostList", () => {
  it("renders list of standard costs", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles search functionality", () => {});
});

// Hook tests
describe("useStandardCosts", () => {
  it("fetches standard costs", () => {});
  it("handles pagination", () => {});
  it("handles filters", () => {});
  it("handles errors", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Standard Cost API Integration", () => {
  it("creates standard cost successfully", () => {});
  it("updates standard cost successfully", () => {});
  it("calculates variances correctly", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Standard Cost E2E", () => {
  it("complete create flow", () => {});
  it("complete edit flow", () => {});
  it("variance analysis flow", () => {});
  it("search and filter functionality", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("Standard Cost Accessibility", () => {
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
const StandardCostCreatePage = lazy(() => import("./create/page"));

// Code splitting
const StandardCostForm = lazy(() => import("./components/StandardCostForm"));

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
  m42_standard_costing: false, // Default: disabled
};

// Usage in components
if (flags.m42_standard_costing) {
  return <StandardCostList />;
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

1. **Set feature flag**: `flags.m42_standard_costing = false`
2. **Invalidate cache**: `revalidateTag('standard-costs')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Variance calculation functional
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

**Ready to implement Inventory Standard Costing UI! 🚀**
<Form onSubmit={(data) => updateCost({ itemId, ...data })}>
{/_ Standard cost form fields _/}
</Form>
);
}

````

### Step 3: Create Hooks

```typescript
// apps/web/hooks/inventory/useVariances.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useVariances(filters?: VarianceFilters) {
  return useQuery({
    queryKey: ["inventory", "variances", filters],
    queryFn: () => api.inventory.variances(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
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
  m42_standard_costing: false, // Default: disabled
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

- [ ] Standard cost management working
- [ ] Variance calculation functional
- [ ] Cost rollup working
- [ ] Variance analysis working
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

**Ready to enhance M11-INVENTORY with Standard Costing! 🚀**
