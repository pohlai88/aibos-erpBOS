# 🎯 M63: Manufacturing Execution System (MES) - UI Implementation Runbook

**Module ID**: M63  
**Module Name**: Manufacturing Execution System (MES)  
**Priority**: MEDIUM  
**Phase**: Phase 13 - Extended Modules  
**Estimated Effort**: 5 days  
**Last Updated**: 2025-10-06

**Status**: ❌ NO - CREATE NEW Module

---

## 📋 Module Overview

Manufacturing Execution System provides **production scheduling**, **work order management**, **shop floor control**, and **production tracking** for manufacturing businesses requiring **real-time production visibility** and **quality control**.

### Business Value

**Key Benefits**:

- **Production Scheduling**: Optimize production schedules
- **Work Order Management**: Track production orders
- **Shop Floor Control**: Real-time production monitoring
- **Quality Control**: In-process quality checks

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status | Details                     |
| ------------- | ------ | --------------------------- |
| **Database**  | ❌ NEW | MES schema needed           |
| **Services**  | ❌ NEW | MES services needed         |
| **API**       | ❌ NEW | MES APIs needed             |
| **Contracts** | ❌ NEW | MES type definitions needed |

### API Endpoints

**Manufacturing Execution Operations** (8 endpoints):

- ❌ `/api/mes/production-orders` - List production orders
- ❌ `/api/mes/production-orders/[id]` - Get production order details
- ❌ `/api/mes/production-orders/create` - Create new production order
- ❌ `/api/mes/production-orders/[id]/update` - Update production order
- ❌ `/api/mes/work-orders` - List work orders
- ❌ `/api/mes/work-orders/[id]` - Get work order details
- ❌ `/api/mes/work-orders/create` - Create new work order
- ❌ `/api/mes/work-orders/[id]/update` - Update work order

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                         | Page Component              | Purpose                       |
| ----------------------------- | --------------------------- | ----------------------------- |
| `/mes`                        | `MESDashboardPage`          | Production dashboard          |
| `/mes/production-orders`      | `ProductionOrdersPage`      | List production orders        |
| `/mes/production-orders/[id]` | `ProductionOrderDetailPage` | View production order details |
| `/mes/work-orders`            | `WorkOrdersPage`            | List work orders              |
| `/mes/work-orders/[id]`       | `WorkOrderDetailPage`       | View work order details       |

### Component Structure

```
apps/web/app/(dashboard)/mes/
├── page.tsx                    # MES dashboard
├── production-orders/
│   ├── page.tsx               # Production orders list
│   └── [id]/
│       └── page.tsx           # Production order detail
└── work-orders/
    ├── page.tsx               # Work orders list
    └── [id]/
        └── page.tsx           # Work order detail

apps/web/components/mes/
├── ProductionDashboard.tsx    # Production dashboard
├── ProductionOrdersList.tsx  # Production orders list
├── ProductionOrderCard.tsx   # Production order card
├── WorkOrdersList.tsx        # Work orders list
├── WorkOrderCard.tsx         # Work order card
├── ProductionChart.tsx       # Production metrics chart
└── QualityMetrics.tsx        # Quality metrics

apps/web/hooks/mes/
├── useProductionDashboard.ts # Production dashboard hook
├── useProductionOrders.ts   # Production orders hook
├── useWorkOrders.ts         # Work orders hook
└── useProductionMetrics.ts  # Production metrics hook
```

### Server/Client Boundaries

- **Server Components**: Dashboard pages, production orders list (data fetching)
- **Client Components**: Charts, interactive elements, work order forms
- **Feature Flag**: `flags.m63_manufacturing_execution = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose                | Variant                    |
| ----------- | ---------------------- | -------------------------- |
| `DataTable` | List production orders | With filters, pagination   |
| `Card`      | Production metrics     | With charts                |
| `Form`      | Create work order      | With validation            |
| `Button`    | Actions                | Primary, secondary, danger |
| `Chart`     | Production metrics     | Line, bar, pie             |

### Design Tokens

```typescript
// Colors
const colors = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  error: "hsl(var(--error))",
};

// Spacing
const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
};

// Typography
const typography = {
  h1: "text-3xl font-bold",
  h2: "text-2xl font-semibold",
  h3: "text-xl font-medium",
  body: "text-base",
  caption: "text-sm text-muted-foreground",
};
```

### Theme Support

- **Dark Mode**: Default theme
- **Light Mode**: Available via theme toggle
- **High Contrast**: WCAG AAA compliance

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  productionDashboard: ["mes", "dashboard"] as const,
  productionOrders: ["mes", "production-orders"] as const,
  productionOrder: (id: string) => ["mes", "production-orders", id] as const,
  workOrders: ["mes", "work-orders"] as const,
  workOrder: (id: string) => ["mes", "work-orders", id] as const,
  productionMetrics: ["mes", "metrics"] as const,
};
```

### Cache Configuration

| Query Type         | Stale Time | Cache Time | Invalidation            |
| ------------------ | ---------- | ---------- | ----------------------- |
| Production Orders  | 5 minutes  | 15 minutes | On create/update/delete |
| Work Orders        | 2 minutes  | 10 minutes | On status change        |
| Production Metrics | 1 minute   | 5 minutes  | On production update    |
| Dashboard          | 30 seconds | 2 minutes  | On any change           |

### Invalidation Rules

```typescript
// After creating production order
queryClient.invalidateQueries({ queryKey: ["mes", "production-orders"] });
queryClient.invalidateQueries({ queryKey: ["mes", "dashboard"] });

// After updating work order
queryClient.invalidateQueries({ queryKey: ["mes", "work-orders"] });
queryClient.invalidateQueries({ queryKey: ["mes", "work-orders", id] });
queryClient.invalidateQueries({ queryKey: ["mes", "metrics"] });

// After deleting production order
queryClient.invalidateQueries({ queryKey: ["mes", "production-orders"] });
queryClient.removeQueries({ queryKey: ["mes", "production-orders", id] });
```

---

## 🎭 User Experience

### User Flows

#### 1. Production Dashboard

1. User navigates to `/mes`
2. System loads production metrics and charts
3. User can view real-time production status
4. User can drill down into specific metrics

#### 2. Create Production Order

1. User clicks "Create Production Order" button
2. System opens production order form
3. User fills required fields (product, quantity, due date)
4. User submits form
5. System creates production order and redirects to detail page

#### 3. Manage Work Orders

1. User views production order detail page
2. User clicks "Create Work Order" button
3. System opens work order form
4. User assigns work order to workstation
5. User submits form
6. System creates work order and updates production status

### UI States

| State          | Component       | Message                                  |
| -------------- | --------------- | ---------------------------------------- |
| **Empty**      | `MESEmptyState` | "No production orders found"             |
| **Loading**    | `MESSkeleton`   | Loading skeleton                         |
| **Error**      | `MESErrorState` | "Failed to load production data"         |
| **No Results** | `MESNoResults`  | "No production orders match your search" |

### Interactions

- **Hover**: Card elevation, button color change
- **Focus**: Clear focus ring, keyboard navigation
- **Click**: Immediate feedback, loading state
- **Form Validation**: Inline errors, real-time validation

---

## 🚀 Implementation Guide

### Step 1: Setup Database Schema

```sql
-- Production Orders
CREATE TABLE production_orders (
  id UUID PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  priority VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Work Orders
CREATE TABLE work_orders (
  id UUID PRIMARY KEY,
  production_order_id UUID REFERENCES production_orders(id),
  workstation_id UUID NOT NULL,
  operation VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Production Metrics
CREATE TABLE production_metrics (
  id UUID PRIMARY KEY,
  workstation_id UUID NOT NULL,
  metric_type VARCHAR(50) NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  recorded_at TIMESTAMP DEFAULT NOW()
);
```

### Step 2: Create Components

```typescript
// apps/web/components/mes/ProductionDashboard.tsx
"use client";

import { Card } from "@/components/ui/card";
import { useProductionDashboard } from "@/hooks/mes/useProductionDashboard";

export function ProductionDashboard() {
  const { data, isLoading, error } = useProductionDashboard();

  if (isLoading) return <MESSkeleton />;
  if (error) return <MESErrorState />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <h3>Active Orders</h3>
        <p className="text-3xl font-bold">{data.activeOrders}</p>
      </Card>
      <Card>
        <h3>Production Rate</h3>
        <p className="text-3xl font-bold">{data.productionRate}%</p>
      </Card>
      <Card>
        <h3>Quality Score</h3>
        <p className="text-3xl font-bold">{data.qualityScore}%</p>
      </Card>
    </div>
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/mes/useProductionDashboard.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useProductionDashboard() {
  return useQuery({
    queryKey: ["mes", "dashboard"],
    queryFn: () => api.mes.getProductionDashboard(),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCreateProductionOrder() {
  return useMutation({
    mutationFn: (data: ProductionOrderData) =>
      api.mes.createProductionOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["mes", "production-orders"],
      });
      queryClient.invalidateQueries({
        queryKey: ["mes", "dashboard"],
      });
    },
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/mes/page.tsx
import { ProductionDashboard } from "@/components/mes/ProductionDashboard";
import { ProductionChart } from "@/components/mes/ProductionChart";

export default function MESPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manufacturing Execution System</h1>
        <CreateProductionOrderButton />
      </div>
      <ProductionDashboard />
      <ProductionChart />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/mes/__tests__/ProductionDashboard.test.tsx
import { render, screen } from "@testing-library/react";
import { ProductionDashboard } from "@/components/mes/ProductionDashboard";

describe("ProductionDashboard", () => {
  it("renders production dashboard", () => {
    render(<ProductionDashboard />);
    expect(screen.getByText("Active Orders")).toBeInTheDocument();
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

| Shortcut       | Action                  |
| -------------- | ----------------------- |
| `Ctrl/Cmd + N` | Create production order |
| `Ctrl/Cmd + F` | Focus search field      |
| `Escape`       | Close modal/dialog      |
| `Enter`        | Submit form             |

### ARIA Implementation

```typescript
// MES dashboard
<div role="region" aria-label="Production dashboard">
  <div role="group" aria-label="Production metrics">
    <h3>Active Orders</h3>
    <p aria-live="polite">{data.activeOrders}</p>
  </div>
</div>

// Form
<form role="form" aria-label="Create production order">
  <input aria-describedby="order-error" aria-invalid="false" />
  <div id="order-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("ProductionDashboard", () => {
  it("renders production dashboard", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("displays production metrics", () => {});
});

// Hook tests
describe("useProductionDashboard", () => {
  it("fetches production data", () => {});
  it("handles pagination", () => {});
  it("handles filters", () => {});
  it("handles errors", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Manufacturing Execution API Integration", () => {
  it("creates production order successfully", () => {});
  it("updates work order successfully", () => {});
  it("tracks production metrics correctly", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Manufacturing Execution E2E", () => {
  it("complete production order flow", () => {});
  it("complete work order flow", () => {});
  it("production tracking flow", () => {});
  it("search and filter functionality", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("Manufacturing Execution Accessibility", () => {
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
const ProductionOrderCreatePage = lazy(
  () => import("./production-orders/create/page")
);

// Code splitting
const ProductionChart = lazy(() => import("./components/ProductionChart"));

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
  m63_manufacturing_execution: false, // Default: disabled
};

// Usage in components
if (flags.m63_manufacturing_execution) {
  return <ProductionDashboard />;
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

1. **Set feature flag**: `flags.m63_manufacturing_execution = false`
2. **Invalidate cache**: `revalidateTag('mes')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Production order management functional
- [ ] Work order tracking functional
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

**Ready to implement Manufacturing Execution System UI! 🚀**
