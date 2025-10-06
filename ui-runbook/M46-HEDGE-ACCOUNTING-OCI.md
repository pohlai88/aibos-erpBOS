# 🎯 M46: Hedge Accounting & OCI Tracking - UI Implementation Runbook

**Module ID**: M46  
**Module Name**: Hedge Accounting & OCI Tracking  
**Priority**: 🔥 HIGH  
**Phase**: Phase 11 - Critical Missing Modules  
**Estimated Effort**: 4 days  
**Last Updated**: 2025-10-06

---

## 📋 Module Overview

Hedge Accounting & OCI Tracking provides **hedge accounting management** and **other comprehensive income tracking** for businesses requiring **ASC 815/IFRS 9 compliance**, **hedge effectiveness testing**, and **OCI reconciliation**.

### Business Value

**Key Benefits**:

- **Hedge Accounting**: Manage cash flow, fair value, and net investment hedges
- **ASC 815/IFRS 9 Compliance**: Automated hedge accounting compliance
- **Effectiveness Testing**: Perform hedge effectiveness tests
- **OCI Tracking**: Track and reconcile other comprehensive income

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status | Details                    |
| ------------- | ------ | -------------------------- |
| **Database**  | ❌ NO  | No hedge accounting schema |
| **Services**  | ❌ NO  | No hedge services          |
| **API**       | ❌ NO  | No hedge APIs              |
| **Contracts** | ❌ NO  | No hedge types             |

### API Endpoints

**Hedge Accounting & OCI** (Implementation needed):

- ❌ `/api/hedges` - List hedges
- ❌ `/api/hedges/[id]` - Get hedge details
- ❌ `/api/hedges/create` - Create hedge relationship
- ❌ `/api/hedges/effectiveness` - Test hedge effectiveness
- ❌ `/api/oci` - Track OCI components
- ❌ `/api/oci/reconciliation` - OCI reconciliation

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                   | Page Component          | Purpose                   |
| ----------------------- | ----------------------- | ------------------------- |
| `/hedges`               | `HedgesListPage`        | List hedge relationships  |
| `/hedges/[id]`          | `HedgeDetailPage`       | View hedge details        |
| `/hedges/create`        | `HedgeCreatePage`       | Create hedge relationship |
| `/hedges/effectiveness` | `EffectivenessTestPage` | Effectiveness testing     |
| `/oci`                  | `OCITrackingPage`       | OCI tracking              |
| `/oci/reconciliation`   | `OCIReconciliationPage` | OCI reconciliation        |

### Component Structure

```
apps/web/app/(dashboard)/hedges/
├── page.tsx                        # Hedges list page
├── [id]/
│   └── page.tsx                    # Hedge detail page
├── create/
│   └── page.tsx                    # Create hedge page
└── effectiveness/
    └── page.tsx                    # Effectiveness test page

apps/web/app/(dashboard)/oci/
├── page.tsx                        # OCI tracking page
└── reconciliation/
    └── page.tsx                    # OCI reconciliation page

apps/web/components/hedges/
├── HedgesList.tsx                  # Hedges list
├── HedgeForm.tsx                   # Hedge form
├── EffectivenessTest.tsx           # Effectiveness test
├── OCIComponents.tsx               # OCI components
└── OCIReconciliation.tsx           # OCI reconciliation

apps/web/hooks/hedges/
├── useHedges.ts                    # Hedges hook
├── useHedgeDetail.ts               # Hedge detail hook
├── useEffectivenessTest.ts         # Effectiveness test hook
└── useOCI.ts                       # OCI hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages
- **Client Components**: Forms, effectiveness tests, charts
- **Feature Flag**: `flags.m46_hedge_accounting = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose              | Variant                    |
| ----------- | -------------------- | -------------------------- |
| `DataTable` | List hedges          | With filters, pagination   |
| `Card`      | Hedge details        | With actions               |
| `Form`      | Hedge forms          | With validation            |
| `Button`    | Actions              | Primary, secondary, danger |
| `Select`    | Hedge type selector  | With search                |
| `Currency`  | Amount input         | With formatting            |
| `Chart`     | Effectiveness charts | With tooltips              |
| `Badge`     | Hedge status         | With colors                |

### Design Tokens

```typescript
// Hedge accounting specific colors
const hedgeColors = {
  cashFlow: "hsl(var(--hedge-cash-flow))",
  fairValue: "hsl(var(--hedge-fair-value))",
  netInvestment: "hsl(var(--hedge-net-investment))",
  effective: "hsl(var(--hedge-effective))",
  ineffective: "hsl(var(--hedge-ineffective))",
};

// OCI component colors
const ociColors = {
  foreignCurrency: "bg-blue-100 text-blue-800",
  unrealizedGains: "bg-green-100 text-green-800",
  cashFlowHedge: "bg-purple-100 text-purple-800",
  pensionAdjustments: "bg-yellow-100 text-yellow-800",
};
```

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  hedges: ["hedges", "list"] as const,
  hedgeDetail: (id: string) => ["hedges", "detail", id] as const,
  effectiveness: ["hedges", "effectiveness"] as const,
  oci: ["oci"] as const,
  ociReconciliation: ["oci", "reconciliation"] as const,
};
```

### Cache Configuration

| Query Type         | Stale Time | Cache Time | Invalidation            |
| ------------------ | ---------- | ---------- | ----------------------- |
| Hedges List        | 5 minutes  | 15 minutes | On create/update/delete |
| Hedge Detail       | 10 minutes | 30 minutes | On update               |
| Effectiveness Test | 1 day      | 7 days     | On test execution       |
| OCI                | 5 minutes  | 15 minutes | On OCI update           |

---

## 🎭 User Experience

### User Flows

#### 1. Create Hedge Relationship

1. User navigates to `/hedges/create`
2. System opens hedge form
3. User selects hedge type (cash flow, fair value, net investment)
4. User designates hedged item and hedging instrument
5. User submits form
6. System creates hedge relationship

#### 2. Test Hedge Effectiveness

1. User navigates to `/hedges/effectiveness`
2. System shows active hedge relationships
3. User selects hedge and clicks "Test Effectiveness"
4. System performs effectiveness test
5. System shows results (effective/ineffective)

#### 3. Track OCI

1. User navigates to `/oci`
2. System shows OCI components
3. User can view OCI balance by component
4. User can reconcile OCI movements

### UI States

| State          | Component          | Message                       |
| -------------- | ------------------ | ----------------------------- |
| **Empty**      | `HedgesEmptyState` | "No hedges found"             |
| **Loading**    | `HedgesSkeleton`   | Loading skeleton              |
| **Error**      | `HedgesErrorState` | "Failed to load hedges"       |
| **No Results** | `HedgesNoResults`  | "No hedges match your search" |

---

## 🚀 Implementation Guide

### Step 1: Setup

```bash
# Create directory structure
mkdir -p apps/web/app/(dashboard)/hedges
mkdir -p apps/web/app/(dashboard)/oci
mkdir -p apps/web/components/hedges
mkdir -p apps/web/hooks/hedges

# Create feature flag
echo 'flags.m46_hedge_accounting = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/hedges/HedgesList.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useHedges } from "@/hooks/hedges/useHedges";

export function HedgesList() {
  const { data, isLoading, error } = useHedges();

  if (isLoading) return <HedgesSkeleton />;
  if (error) return <HedgesErrorState />;
  if (!data?.length) return <HedgesEmptyState />;

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="designation"
      filters={filters}
    />
  );
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
| Bundle size       | ≤350KB    | CI blocks   |

---

## 🚀 Deployment

### Feature Flag

```typescript
const flags = {
  m46_hedge_accounting: false, // Default: disabled
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

- [ ] Hedge relationship creation working
- [ ] Effectiveness testing functional
- [ ] OCI tracking working
- [ ] OCI reconciliation working
- [ ] ASC 815/IFRS 9 reporting working
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

**Ready to implement Hedge Accounting & OCI Tracking UI! 🚀**
