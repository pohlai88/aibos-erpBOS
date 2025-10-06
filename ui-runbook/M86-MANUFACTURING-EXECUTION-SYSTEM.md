# 🎯 M86: Manufacturing Execution System - UI Implementation Runbook

**Module ID**: M86  
**Module Name**: Manufacturing Execution System  
**Priority**: 🔶 MEDIUM  
**Phase**: Phase 16 - Infrastructure Modernization  
**Estimated Effort**: 5 days  
**Last Updated**: 2025-10-06

**Status**: ❌ NO - CREATE NEW Module

---

## 📋 Module Overview

### Business Value

Manufacturing Execution System provides **comprehensive manufacturing process management** for businesses requiring organized production planning and execution.

**Key Benefits**:

- Complete production order management
- Real-time production monitoring
- Manufacturing analytics and optimization
- Integration with existing modules (Inventory, Quality, etc.)

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

**Manufacturing Execution System Operations** (20 endpoints):

- ✅ `/api/mes/production-orders` - List production orders
- ✅ `/api/mes/production-orders/[id]` - Get production order details
- ✅ `/api/mes/production-orders/create` - Create production order
- ✅ `/api/mes/production-orders/[id]/update` - Update production order
- ✅ `/api/mes/production-orders/[id]/delete` - Delete production order
- ✅ `/api/mes/production-orders/[id]/start` - Start production
- ✅ `/api/mes/production-orders/[id]/pause` - Pause production
- ✅ `/api/mes/production-orders/[id]/resume` - Resume production
- ✅ `/api/mes/production-orders/[id]/complete` - Complete production
- ✅ `/api/mes/work-orders` - List work orders
- ✅ `/api/mes/work-orders/[id]` - Get work order details
- ✅ `/api/mes/work-orders/create` - Create work order
- ✅ `/api/mes/work-orders/[id]/update` - Update work order
- ✅ `/api/mes/work-orders/[id]/start` - Start work order
- ✅ `/api/mes/work-orders/[id]/complete` - Complete work order
- ✅ `/api/mes/workstations` - List workstations
- ✅ `/api/mes/workstations/[id]` - Get workstation details
- ✅ `/api/mes/workstations/[id]/status` - Get workstation status
- ✅ `/api/mes/analytics` - Get manufacturing analytics
- ✅ `/api/mes/alerts` - Get manufacturing alerts

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                              | Page Component                 | Purpose                       |
| ---------------------------------- | ------------------------------ | ----------------------------- |
| `/mes/production-orders`           | `MESProductionOrdersPage`      | List production orders        |
| `/mes/production-orders/[id]`      | `MESProductionOrderDetailPage` | View production order details |
| `/mes/production-orders/create`    | `MESProductionOrderCreatePage` | Create production order       |
| `/mes/production-orders/[id]/edit` | `MESProductionOrderEditPage`   | Edit production order         |
| `/mes/work-orders`                 | `MESWorkOrdersPage`            | List work orders              |
| `/mes/work-orders/[id]`            | `MESWorkOrderDetailPage`       | View work order details       |
| `/mes/work-orders/create`          | `MESWorkOrderCreatePage`       | Create work order             |
| `/mes/work-orders/[id]/edit`       | `MESWorkOrderEditPage`         | Edit work order               |
| `/mes/workstations`                | `MESWorkstationsPage`          | List workstations             |
| `/mes/workstations/[id]`           | `MESWorkstationDetailPage`     | View workstation details      |
| `/mes/analytics`                   | `MESAnalyticsPage`             | Manufacturing analytics       |
| `/mes/alerts`                      | `MESAlertsPage`                | Manufacturing alerts          |

### Component Structure

```
apps/web/app/(dashboard)/mes/
├── production-orders/
│   ├── page.tsx               # Production orders list
│   ├── [id]/
│   │   ├── page.tsx           # Production order details
│   │   └── edit/
│   │       └── page.tsx       # Edit production order
│   └── create/
│       └── page.tsx           # Create production order
├── work-orders/
│   ├── page.tsx               # Work orders list
│   ├── [id]/
│   │   ├── page.tsx           # Work order details
│   │   └── edit/
│   │       └── page.tsx       # Edit work order
│   └── create/
│       └── page.tsx           # Create work order
├── workstations/
│   ├── page.tsx               # Workstations list
│   └── [id]/
│       └── page.tsx           # Workstation details
├── analytics/
│   └── page.tsx               # Analytics page
└── alerts/
    └── page.tsx               # Alerts page

apps/web/components/mes/
├── MESProductionOrders.tsx    # Production orders component
├── MESProductionOrderCard.tsx # Production order card
├── MESProductionOrderForm.tsx # Production order form
├── MESWorkOrders.tsx          # Work orders component
├── MESWorkOrderCard.tsx       # Work order card
├── MESWorkOrderForm.tsx       # Work order form
├── MESWorkstations.tsx        # Workstations component
├── MESWorkstationCard.tsx     # Workstation card
├── MESAnalytics.tsx           # Analytics component
├── MESAlerts.tsx              # Alerts component
├── MESFilters.tsx             # Filter component
└── MESActions.tsx             # Action buttons

apps/web/hooks/mes/
├── useMESProductionOrders.ts  # Production orders hook
├── useMESProductionOrderDetail.ts # Production order detail hook
├── useMESProductionOrderCreate.ts # Production order create hook
├── useMESProductionOrderUpdate.ts # Production order update hook
├── useMESProductionOrderStart.ts # Production order start hook
├── useMESProductionOrderPause.ts # Production order pause hook
├── useMESProductionOrderResume.ts # Production order resume hook
├── useMESProductionOrderComplete.ts # Production order complete hook
├── useMESWorkOrders.ts        # Work orders hook
├── useMESWorkOrderDetail.ts   # Work order detail hook
├── useMESWorkOrderCreate.ts   # Work order create hook
├── useMESWorkOrderUpdate.ts   # Work order update hook
├── useMESWorkOrderStart.ts    # Work order start hook
├── useMESWorkOrderComplete.ts # Work order complete hook
├── useMESWorkstations.ts     # Workstations hook
├── useMESWorkstationDetail.ts # Workstation detail hook
├── useMESWorkstationStatus.ts # Workstation status hook
├── useMESAnalytics.ts         # Analytics hook
└── useMESAlerts.ts            # Alerts hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages (data fetching)
- **Client Components**: Forms, interactive elements, modals
- **Feature Flag**: `flags.m86_manufacturing_execution_system = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose                    | Variant                    |
| ----------- | -------------------------- | -------------------------- |
| `DataTable` | List manufacturing records | With filters, pagination   |
| `Card`      | Production order details   | With actions               |
| `Form`      | Create/edit forms          | With validation            |
| `Button`    | Actions                    | Primary, secondary, danger |
| `Modal`     | Confirmations              | With backdrop              |
| `Timeline`  | Production timeline        | With status indicators     |
| `Chart`     | Manufacturing charts       | With metrics               |

### Design Tokens

```typescript
// MES-specific colors
const mesColors = {
  planned: "hsl(var(--mes-planned))",
  released: "hsl(var(--mes-released))",
  inProgress: "hsl(var(--mes-in-progress))",
  paused: "hsl(var(--mes-paused))",
  completed: "hsl(var(--mes-completed))",
  cancelled: "hsl(var(--mes-cancelled))",
};

// MES status colors
const mesStatusColors = {
  planned: "bg-blue-100 text-blue-800",
  released: "bg-yellow-100 text-yellow-800",
  inProgress: "bg-green-100 text-green-800",
  paused: "bg-orange-100 text-orange-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

// MES type colors
const mesTypeColors = {
  assembly: "hsl(var(--mes-assembly))",
  machining: "hsl(var(--mes-machining))",
  welding: "hsl(var(--mes-welding))",
  painting: "hsl(var(--mes-painting))",
  packaging: "hsl(var(--mes-packaging))",
  inspection: "hsl(var(--mes-inspection))",
  other: "hsl(var(--mes-other))",
};
```

### Theme Support

- **Dark Mode**: Default theme
- **Light Mode**: Available via theme toggle
- **High Contrast**: WCAG AAA compliance
- **MES Themes**: Status-based themes

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  productionOrders: ["mes", "production-orders"] as const,
  productionOrder: (id: string) => ["mes", "production-order", id] as const,
  workOrders: ["mes", "work-orders"] as const,
  workOrder: (id: string) => ["mes", "work-order", id] as const,
  workstations: ["mes", "workstations"] as const,
  workstation: (id: string) => ["mes", "workstation", id] as const,
  workstationStatus: (id: string) => ["mes", "workstation-status", id] as const,
  analytics: ["mes", "analytics"] as const,
  alerts: ["mes", "alerts"] as const,
};
```

### Cache Configuration

| Query Type         | Stale Time | Cache Time | Invalidation            |
| ------------------ | ---------- | ---------- | ----------------------- |
| Production Orders  | 5 minutes  | 10 minutes | On create/update/delete |
| Production Order   | 10 minutes | 30 minutes | On update/delete        |
| Work Orders        | 5 minutes  | 15 minutes | On create/update/delete |
| Work Order         | 10 minutes | 30 minutes | On update/delete        |
| Workstations       | 5 minutes  | 15 minutes | On workstation change   |
| Workstation Status | 1 minute   | 5 minutes  | On status update        |
| Analytics          | 15 minutes | 45 minutes | On manufacturing change |
| Alerts             | 1 minute   | 5 minutes  | On alert update         |

### Invalidation Rules

```typescript
// After creating production order
queryClient.invalidateQueries({ queryKey: ["mes", "production-orders"] });
queryClient.invalidateQueries({ queryKey: ["mes", "analytics"] });

// After updating production order
queryClient.invalidateQueries({ queryKey: ["mes", "production-order", id] });
queryClient.invalidateQueries({ queryKey: ["mes", "production-orders"] });

// After starting production
queryClient.invalidateQueries({ queryKey: ["mes", "production-order", id] });
queryClient.invalidateQueries({ queryKey: ["mes", "workstations"] });
```

---

## 🎭 User Experience

### User Flows

#### 1. Create Production Order

1. User navigates to MES production orders page
2. User clicks "Create Production Order" button
3. System opens production order creation form
4. User selects product to manufacture
5. User sets production quantity
6. User schedules production start date
7. User assigns workstations
8. User submits production order

#### 2. Start Production

1. User views production order detail page
2. User clicks "Start Production" button
3. System validates production readiness
4. System creates work orders
5. System updates production status
6. System notifies workstations
7. Production begins

#### 3. Monitor Production

1. User navigates to workstations page
2. User sees real-time production status
3. User can view production progress
4. User can pause/resume production
5. User can view production alerts
6. User can track production metrics

### UI States

| State          | Component       | Message                             |
| -------------- | --------------- | ----------------------------------- |
| **Empty**      | `MESEmptyState` | "No manufacturing records found"    |
| **Loading**    | `MESSkeleton`   | Loading skeleton                    |
| **Error**      | `MESErrorState` | "Failed to load manufacturing data" |
| **No Results** | `MESNoResults`  | "No records match your search"      |

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

| Shortcut       | Action                      |
| -------------- | --------------------------- |
| `Ctrl/Cmd + N` | Create new production order |
| `Ctrl/Cmd + F` | Focus search field          |
| `Ctrl/Cmd + S` | Start production            |
| `Ctrl/Cmd + P` | Pause production            |
| `Escape`       | Close modal/dialog          |
| `Enter`        | Submit form                 |

### ARIA Implementation

```typescript
// MES list
<table role="table" aria-label="Manufacturing production orders list">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" aria-sort="none">Order Number</th>
      <th role="columnheader" aria-sort="none">Product</th>
      <th role="columnheader" aria-sort="none">Status</th>
      <th role="columnheader" aria-sort="none">Progress</th>
    </tr>
  </thead>
</table>

// MES form
<form role="form" aria-label="Create Production Order">
  <input
    aria-describedby="product-error"
    aria-invalid="false"
    aria-label="Product"
  />
  <div id="product-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("MESProductionOrders", () => {
  it("renders list of production orders", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles search functionality", () => {});
});

// Hook tests
describe("useMESProductionOrderCreate", () => {
  it("creates production order successfully", () => {});
  it("handles creation errors", () => {});
  it("validates production order data", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("MES API Integration", () => {
  it("creates production order successfully", () => {});
  it("starts production successfully", () => {});
  it("pauses production successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Manufacturing Execution System E2E", () => {
  it("complete production order creation flow", () => {});
  it("complete production start flow", () => {});
  it("complete production monitoring flow", () => {});
  it("manufacturing analytics functionality", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("Manufacturing Execution System Accessibility", () => {
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
const MESProductionOrderForm = lazy(
  () => import("./components/MESProductionOrderForm")
);
const MESAnalytics = lazy(() => import("./components/MESAnalytics"));

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
mkdir -p apps/web/app/(dashboard)/mes
mkdir -p apps/web/components/mes
mkdir -p apps/web/hooks/mes

# Create feature flag
echo 'flags.m86_manufacturing_execution_system = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/mes/MESProductionOrders.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useMESProductionOrders } from "@/hooks/mes/useMESProductionOrders";

export function MESProductionOrders() {
  const { data, isLoading, error } = useMESProductionOrders();

  if (isLoading) return <MESSkeleton />;
  if (error) return <MESErrorState />;
  if (!data?.length) return <MESEmptyState />;

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="orderNumber"
      filters={filters}
    />
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/mes/useMESProductionOrders.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useMESProductionOrders(filters?: MESFilters) {
  return useQuery({
    queryKey: ["mes", "production-orders", filters],
    queryFn: () => api.mes.productionOrders.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/mes/production-orders/page.tsx
import { MESProductionOrders } from "@/components/mes/MESProductionOrders";
import { MESFilters } from "@/components/mes/MESFilters";

export default function MESProductionOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manufacturing Production Orders</h1>
        <CreateProductionOrderButton />
      </div>
      <MESFilters />
      <MESProductionOrders />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/mes/__tests__/MESProductionOrders.test.tsx
import { render, screen } from "@testing-library/react";
import { MESProductionOrders } from "@/components/mes/MESProductionOrders";

describe("MESProductionOrders", () => {
  it("renders list of production orders", () => {
    render(<MESProductionOrders />);
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
  m86_manufacturing_execution_system: false, // Default: disabled
};

// Usage in components
if (flags.m86_manufacturing_execution_system) {
  return <MESProductionOrders />;
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

1. **Set feature flag**: `flags.m86_manufacturing_execution_system = false`
2. **Invalidate cache**: `revalidateTag('mes')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Production order management functional
- [ ] Work order management working
- [ ] Workstation management functional
- [ ] Production monitoring working
- [ ] Manufacturing analytics functional
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
