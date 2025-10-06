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

  return (
    <Form onSubmit={(data) => updateCost({ itemId, ...data })}>
      {/* Standard cost form fields */}
    </Form>
  );
}
```

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
```

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
