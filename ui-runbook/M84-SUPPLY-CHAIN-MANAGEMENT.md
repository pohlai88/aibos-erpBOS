# 🎯 M84: Supply Chain Management - UI Implementation Runbook

**Module ID**: M84  
**Module Name**: Supply Chain Management  
**Priority**: 🔶 MEDIUM  
**Phase**: Phase 16 - Infrastructure Modernization  
**Estimated Effort**: 5 days  
**Last Updated**: 2025-10-06

**Status**: 🔄 HYBRID - Enhance M62-SUPPLY-CHAIN-MANAGEMENT

---

## 📋 Module Overview

### Business Value

Supply Chain Management provides **comprehensive supply chain optimization** for businesses requiring organized supplier management and procurement processes.

**Key Benefits**:

- Complete supplier lifecycle management
- Procurement process automation
- Supply chain analytics and optimization
- Integration with existing modules (Inventory, AP, etc.)

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
| **API**       | ✅ Complete | 18 endpoints available    |
| **Contracts** | ✅ Complete | Type-safe schemas defined |

### API Endpoints

**Supply Chain Management Operations** (18 endpoints):

- ✅ `/api/supply-chain/suppliers` - List suppliers
- ✅ `/api/supply-chain/suppliers/[id]` - Get supplier details
- ✅ `/api/supply-chain/suppliers/create` - Create supplier
- ✅ `/api/supply-chain/suppliers/[id]/update` - Update supplier
- ✅ `/api/supply-chain/suppliers/[id]/delete` - Delete supplier
- ✅ `/api/supply-chain/suppliers/[id]/evaluate` - Evaluate supplier
- ✅ `/api/supply-chain/procurement` - List procurement orders
- ✅ `/api/supply-chain/procurement/[id]` - Get procurement details
- ✅ `/api/supply-chain/procurement/create` - Create procurement order
- ✅ `/api/supply-chain/procurement/[id]/update` - Update procurement
- ✅ `/api/supply-chain/procurement/[id]/approve` - Approve procurement
- ✅ `/api/supply-chain/procurement/[id]/reject` - Reject procurement
- ✅ `/api/supply-chain/procurement/[id]/receive` - Receive goods
- ✅ `/api/supply-chain/procurement/[id]/invoice` - Process invoice
- ✅ `/api/supply-chain/analytics` - Get supply chain analytics
- ✅ `/api/supply-chain/alerts` - Get supply chain alerts
- ✅ `/api/supply-chain/optimization` - Get optimization recommendations
- ✅ `/api/supply-chain/forecasting` - Get demand forecasting

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                                 | Page Component                     | Purpose                      |
| ------------------------------------- | ---------------------------------- | ---------------------------- |
| `/supply-chain/suppliers`             | `SupplyChainSuppliersPage`         | List suppliers               |
| `/supply-chain/suppliers/[id]`        | `SupplyChainSupplierDetailPage`    | View supplier details        |
| `/supply-chain/suppliers/create`      | `SupplyChainSupplierCreatePage`    | Create supplier              |
| `/supply-chain/suppliers/[id]/edit`   | `SupplyChainSupplierEditPage`      | Edit supplier                |
| `/supply-chain/procurement`           | `SupplyChainProcurementPage`       | List procurement orders      |
| `/supply-chain/procurement/[id]`      | `SupplyChainProcurementDetailPage` | View procurement details     |
| `/supply-chain/procurement/create`    | `SupplyChainProcurementCreatePage` | Create procurement order     |
| `/supply-chain/procurement/[id]/edit` | `SupplyChainProcurementEditPage`   | Edit procurement             |
| `/supply-chain/analytics`             | `SupplyChainAnalyticsPage`         | Supply chain analytics       |
| `/supply-chain/alerts`                | `SupplyChainAlertsPage`            | Supply chain alerts          |
| `/supply-chain/optimization`          | `SupplyChainOptimizationPage`      | Optimization recommendations |
| `/supply-chain/forecasting`           | `SupplyChainForecastingPage`       | Demand forecasting           |

### Component Structure

```
apps/web/app/(dashboard)/supply-chain/
├── suppliers/
│   ├── page.tsx               # Suppliers list
│   ├── [id]/
│   │   ├── page.tsx           # Supplier details
│   │   └── edit/
│   │       └── page.tsx       # Edit supplier
│   └── create/
│       └── page.tsx           # Create supplier
├── procurement/
│   ├── page.tsx               # Procurement list
│   ├── [id]/
│   │   ├── page.tsx           # Procurement details
│   │   └── edit/
│   │       └── page.tsx       # Edit procurement
│   └── create/
│       └── page.tsx           # Create procurement
├── analytics/
│   └── page.tsx               # Analytics page
├── alerts/
│   └── page.tsx               # Alerts page
├── optimization/
│   └── page.tsx               # Optimization page
└── forecasting/
    └── page.tsx               # Forecasting page

apps/web/components/supply-chain/
├── SupplyChainSuppliers.tsx   # Suppliers component
├── SupplyChainSupplierCard.tsx # Supplier card
├── SupplyChainSupplierForm.tsx # Supplier form
├── SupplyChainProcurement.tsx # Procurement component
├── SupplyChainProcurementCard.tsx # Procurement card
├── SupplyChainProcurementForm.tsx # Procurement form
├── SupplyChainAnalytics.tsx   # Analytics component
├── SupplyChainAlerts.tsx      # Alerts component
├── SupplyChainOptimization.tsx # Optimization component
├── SupplyChainForecasting.tsx # Forecasting component
├── SupplyChainFilters.tsx     # Filter component
└── SupplyChainActions.tsx     # Action buttons

apps/web/hooks/supply-chain/
├── useSupplyChainSuppliers.ts # Suppliers hook
├── useSupplyChainSupplierDetail.ts # Supplier detail hook
├── useSupplyChainSupplierCreate.ts # Supplier create hook
├── useSupplyChainSupplierUpdate.ts # Supplier update hook
├── useSupplyChainSupplierEvaluate.ts # Supplier evaluate hook
├── useSupplyChainProcurement.ts # Procurement hook
├── useSupplyChainProcurementDetail.ts # Procurement detail hook
├── useSupplyChainProcurementCreate.ts # Procurement create hook
├── useSupplyChainProcurementUpdate.ts # Procurement update hook
├── useSupplyChainProcurementApprove.ts # Procurement approve hook
├── useSupplyChainProcurementReceive.ts # Procurement receive hook
├── useSupplyChainAnalytics.ts # Analytics hook
├── useSupplyChainOptimization.ts # Optimization hook
└── useSupplyChainForecasting.ts # Forecasting hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages (data fetching)
- **Client Components**: Forms, interactive elements, modals
- **Feature Flag**: `flags.m84_supply_chain_management = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose                   | Variant                    |
| ----------- | ------------------------- | -------------------------- |
| `DataTable` | List supply chain records | With filters, pagination   |
| `Card`      | Supplier details          | With actions               |
| `Form`      | Create/edit forms         | With validation            |
| `Button`    | Actions                   | Primary, secondary, danger |
| `Modal`     | Confirmations             | With backdrop              |
| `Timeline`  | Procurement timeline      | With status indicators     |
| `Chart`     | Supply chain charts       | With metrics               |

### Design Tokens

```typescript
// Supply chain-specific colors
const supplyChainColors = {
  active: "hsl(var(--supply-chain-active))",
  pending: "hsl(var(--supply-chain-pending))",
  approved: "hsl(var(--supply-chain-approved))",
  received: "hsl(var(--supply-chain-received))",
  invoiced: "hsl(var(--supply-chain-invoiced))",
  completed: "hsl(var(--supply-chain-completed))",
  cancelled: "hsl(var(--supply-chain-cancelled))",
};

// Supply chain status colors
const supplyChainStatusColors = {
  active: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  received: "bg-purple-100 text-purple-800",
  invoiced: "bg-indigo-100 text-indigo-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

// Supply chain type colors
const supplyChainTypeColors = {
  rawMaterials: "hsl(var(--supply-chain-raw-materials))",
  components: "hsl(var(--supply-chain-components))",
  finishedGoods: "hsl(var(--supply-chain-finished-goods))",
  services: "hsl(var(--supply-chain-services))",
  equipment: "hsl(var(--supply-chain-equipment))",
  other: "hsl(var(--supply-chain-other))",
};
```

### Theme Support

- **Dark Mode**: Default theme
- **Light Mode**: Available via theme toggle
- **High Contrast**: WCAG AAA compliance
- **Supply Chain Themes**: Status-based themes

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  suppliers: ["supply-chain", "suppliers"] as const,
  supplier: (id: string) => ["supply-chain", "supplier", id] as const,
  procurement: ["supply-chain", "procurement"] as const,
  procurementOrder: (id: string) =>
    ["supply-chain", "procurement", id] as const,
  analytics: ["supply-chain", "analytics"] as const,
  alerts: ["supply-chain", "alerts"] as const,
  optimization: ["supply-chain", "optimization"] as const,
  forecasting: ["supply-chain", "forecasting"] as const,
};
```

### Cache Configuration

| Query Type        | Stale Time | Cache Time | Invalidation            |
| ----------------- | ---------- | ---------- | ----------------------- |
| Suppliers         | 5 minutes  | 10 minutes | On create/update/delete |
| Supplier          | 10 minutes | 30 minutes | On update/delete        |
| Procurement       | 5 minutes  | 15 minutes | On create/update/delete |
| Procurement Order | 10 minutes | 30 minutes | On update/delete        |
| Analytics         | 15 minutes | 45 minutes | On supply chain change  |
| Alerts            | 1 minute   | 5 minutes  | On alert update         |
| Optimization      | 30 minutes | 2 hours    | On optimization update  |
| Forecasting       | 1 hour     | 4 hours    | On forecasting update   |

### Invalidation Rules

```typescript
// After creating supplier
queryClient.invalidateQueries({ queryKey: ["supply-chain", "suppliers"] });
queryClient.invalidateQueries({ queryKey: ["supply-chain", "analytics"] });

// After updating supplier
queryClient.invalidateQueries({ queryKey: ["supply-chain", "supplier", id] });
queryClient.invalidateQueries({ queryKey: ["supply-chain", "suppliers"] });

// After creating procurement order
queryClient.invalidateQueries({ queryKey: ["supply-chain", "procurement"] });
queryClient.invalidateQueries({ queryKey: ["supply-chain", "alerts"] });
```

---

## 🎭 User Experience

### User Flows

#### 1. Create Supplier

1. User navigates to supply chain suppliers page
2. User clicks "Create Supplier" button
3. System opens supplier creation form
4. User fills supplier details
5. User adds supplier contacts
6. User sets supplier evaluation criteria
7. User submits supplier

#### 2. Create Procurement Order

1. User navigates to procurement page
2. User clicks "Create Procurement Order" button
3. System opens procurement creation form
4. User selects supplier
5. User adds items to order
6. User sets delivery requirements
7. User submits procurement order

#### 3. Receive Goods

1. User views procurement order detail page
2. User clicks "Receive Goods" button
3. System opens goods receipt form
4. User verifies received items
5. User records any discrepancies
6. User confirms receipt
7. System updates inventory

### UI States

| State          | Component               | Message                            |
| -------------- | ----------------------- | ---------------------------------- |
| **Empty**      | `SupplyChainEmptyState` | "No supply chain records found"    |
| **Loading**    | `SupplyChainSkeleton`   | Loading skeleton                   |
| **Error**      | `SupplyChainErrorState` | "Failed to load supply chain data" |
| **No Results** | `SupplyChainNoResults`  | "No records match your search"     |

### Interactions

- **Hover**: Card elevation, button color change
- **Focus**: Clear focus ring, keyboard navigation
- **Click**: Immediate feedback, loading state
- **Form Validation**: Inline errors, real-time validation
- **Chart**: Interactive charts, drill-down capabilities

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
| `Ctrl/Cmd + N` | Create new supplier      |
| `Ctrl/Cmd + F` | Focus search field       |
| `Ctrl/Cmd + P` | Create procurement order |
| `Ctrl/Cmd + R` | Receive goods            |
| `Escape`       | Close modal/dialog       |
| `Enter`        | Submit form              |

### ARIA Implementation

```typescript
// Supply chain list
<table role="table" aria-label="Supply chain suppliers list">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" aria-sort="none">Supplier Name</th>
      <th role="columnheader" aria-sort="none">Status</th>
      <th role="columnheader" aria-sort="none">Rating</th>
      <th role="columnheader" aria-sort="none">Last Order</th>
    </tr>
  </thead>
</table>

// Supply chain form
<form role="form" aria-label="Create Supplier">
  <input
    aria-describedby="name-error"
    aria-invalid="false"
    aria-label="Supplier Name"
  />
  <div id="name-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("SupplyChainSuppliers", () => {
  it("renders list of suppliers", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles search functionality", () => {});
});

// Hook tests
describe("useSupplyChainSupplierCreate", () => {
  it("creates supplier successfully", () => {});
  it("handles creation errors", () => {});
  it("validates supplier data", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Supply Chain API Integration", () => {
  it("creates supplier successfully", () => {});
  it("creates procurement order successfully", () => {});
  it("receives goods successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Supply Chain Management E2E", () => {
  it("complete supplier creation flow", () => {});
  it("complete procurement order flow", () => {});
  it("complete goods receipt flow", () => {});
  it("supply chain analytics functionality", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("Supply Chain Management Accessibility", () => {
  it("meets WCAG 2.2 AA standards", () => {});
  it("supports keyboard navigation", () => {});
  it("works with screen readers", () => {});
  it("has proper color contrast", () => {});
});
```

---

## ⚡ Performance

### Bundle Size

- **Target**: ≤400KB gzipped per route
- **Current**: <CURRENT_SIZE>KB
- **Optimization**: Code splitting, lazy loading, form optimization

### Loading Performance

- **TTFB**: ≤70ms (Time to First Byte)
- **TTI**: ≤200ms (Time to Interactive)
- **LCP**: ≤2.5s (Largest Contentful Paint)

### Optimization Strategies

```typescript
// Lazy loading
const SupplyChainSupplierForm = lazy(
  () => import("./components/SupplyChainSupplierForm")
);
const SupplyChainAnalytics = lazy(
  () => import("./components/SupplyChainAnalytics")
);

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
mkdir -p apps/web/app/(dashboard)/supply-chain
mkdir -p apps/web/components/supply-chain
mkdir -p apps/web/hooks/supply-chain

# Create feature flag
echo 'flags.m84_supply_chain_management = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/supply-chain/SupplyChainSuppliers.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useSupplyChainSuppliers } from "@/hooks/supply-chain/useSupplyChainSuppliers";

export function SupplyChainSuppliers() {
  const { data, isLoading, error } = useSupplyChainSuppliers();

  if (isLoading) return <SupplyChainSkeleton />;
  if (error) return <SupplyChainErrorState />;
  if (!data?.length) return <SupplyChainEmptyState />;

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="supplierName"
      filters={filters}
    />
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/supply-chain/useSupplyChainSuppliers.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useSupplyChainSuppliers(filters?: SupplyChainFilters) {
  return useQuery({
    queryKey: ["supply-chain", "suppliers", filters],
    queryFn: () => api.supplyChain.suppliers.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/supply-chain/suppliers/page.tsx
import { SupplyChainSuppliers } from "@/components/supply-chain/SupplyChainSuppliers";
import { SupplyChainFilters } from "@/components/supply-chain/SupplyChainFilters";

export default function SupplyChainSuppliersPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Supply Chain Suppliers</h1>
        <CreateSupplierButton />
      </div>
      <SupplyChainFilters />
      <SupplyChainSuppliers />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/supply-chain/__tests__/SupplyChainSuppliers.test.tsx
import { render, screen } from "@testing-library/react";
import { SupplyChainSuppliers } from "@/components/supply-chain/SupplyChainSuppliers";

describe("SupplyChainSuppliers", () => {
  it("renders list of suppliers", () => {
    render(<SupplyChainSuppliers />);
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
| Bundle size       | ≤400KB    | CI blocks   |

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
  m84_supply_chain_management: false, // Default: disabled
};

// Usage in components
if (flags.m84_supply_chain_management) {
  return <SupplyChainSuppliers />;
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

1. **Set feature flag**: `flags.m84_supply_chain_management = false`
2. **Invalidate cache**: `revalidateTag('supply-chain')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Supplier management functional
- [ ] Procurement order management working
- [ ] Goods receipt functional
- [ ] Supply chain analytics working
- [ ] Optimization recommendations functional
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

**Ready to implement Supply Chain Management UI! 🚀**
