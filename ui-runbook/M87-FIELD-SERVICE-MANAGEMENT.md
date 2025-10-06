# 🎯 M87: Field Service Management - UI Implementation Runbook

**Module ID**: M87  
**Module Name**: Field Service Management  
**Priority**: 🔶 MEDIUM  
**Phase**: Phase 16 - Infrastructure Modernization  
**Estimated Effort**: 4 days  
**Last Updated**: 2025-10-06

**Status**: ❌ NO - CREATE NEW Module

---

## 📋 Module Overview

### Business Value

Field Service Management provides **comprehensive field service operations** for businesses requiring organized service delivery and technician management.

**Key Benefits**:

- Complete service order management
- Technician scheduling and dispatch
- Field service analytics and optimization
- Integration with existing modules (CRM, Inventory, etc.)

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

**Field Service Management Operations** (18 endpoints):

- ✅ `/api/fsm/service-orders` - List service orders
- ✅ `/api/fsm/service-orders/[id]` - Get service order details
- ✅ `/api/fsm/service-orders/create` - Create service order
- ✅ `/api/fsm/service-orders/[id]/update` - Update service order
- ✅ `/api/fsm/service-orders/[id]/delete` - Delete service order
- ✅ `/api/fsm/service-orders/[id]/schedule` - Schedule service order
- ✅ `/api/fsm/service-orders/[id]/dispatch` - Dispatch service order
- ✅ `/api/fsm/service-orders/[id]/start` - Start service
- ✅ `/api/fsm/service-orders/[id]/complete` - Complete service
- ✅ `/api/fsm/service-orders/[id]/cancel` - Cancel service
- ✅ `/api/fsm/technicians` - List technicians
- ✅ `/api/fsm/technicians/[id]` - Get technician details
- ✅ `/api/fsm/technicians/create` - Create technician
- ✅ `/api/fsm/technicians/[id]/update` - Update technician
- ✅ `/api/fsm/technicians/[id]/schedule` - Get technician schedule
- ✅ `/api/fsm/technicians/[id]/location` - Update technician location
- ✅ `/api/fsm/analytics` - Get field service analytics
- ✅ `/api/fsm/alerts` - Get field service alerts

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                           | Page Component              | Purpose                    |
| ------------------------------- | --------------------------- | -------------------------- |
| `/fsm/service-orders`           | `FSMServiceOrdersPage`      | List service orders        |
| `/fsm/service-orders/[id]`      | `FSMServiceOrderDetailPage` | View service order details |
| `/fsm/service-orders/create`    | `FSMServiceOrderCreatePage` | Create service order       |
| `/fsm/service-orders/[id]/edit` | `FSMServiceOrderEditPage`   | Edit service order         |
| `/fsm/technicians`              | `FSMTechniciansPage`        | List technicians           |
| `/fsm/technicians/[id]`         | `FSMTechnicianDetailPage`   | View technician details    |
| `/fsm/technicians/create`       | `FSMTechnicianCreatePage`   | Create technician          |
| `/fsm/technicians/[id]/edit`    | `FSMTechnicianEditPage`     | Edit technician            |
| `/fsm/schedule`                 | `FSMSchedulePage`           | Service scheduling         |
| `/fsm/dispatch`                 | `FSMDispatchPage`           | Service dispatch           |
| `/fsm/analytics`                | `FSMAnalyticsPage`          | Field service analytics    |
| `/fsm/alerts`                   | `FSMAlertsPage`             | Field service alerts       |

### Component Structure

```
apps/web/app/(dashboard)/fsm/
├── service-orders/
│   ├── page.tsx               # Service orders list
│   ├── [id]/
│   │   ├── page.tsx           # Service order details
│   │   └── edit/
│   │       └── page.tsx       # Edit service order
│   └── create/
│       └── page.tsx           # Create service order
├── technicians/
│   ├── page.tsx               # Technicians list
│   ├── [id]/
│   │   ├── page.tsx           # Technician details
│   │   └── edit/
│   │       └── page.tsx       # Edit technician
│   └── create/
│       └── page.tsx           # Create technician
├── schedule/
│   └── page.tsx               # Schedule page
├── dispatch/
│   └── page.tsx               # Dispatch page
├── analytics/
│   └── page.tsx               # Analytics page
└── alerts/
    └── page.tsx               # Alerts page

apps/web/components/fsm/
├── FSMServiceOrders.tsx       # Service orders component
├── FSMServiceOrderCard.tsx    # Service order card
├── FSMServiceOrderForm.tsx    # Service order form
├── FSMTechnicians.tsx         # Technicians component
├── FSMTechnicianCard.tsx      # Technician card
├── FSMTechnicianForm.tsx      # Technician form
├── FSMSchedule.tsx            # Schedule component
├── FSMDispatch.tsx            # Dispatch component
├── FSMAnalytics.tsx           # Analytics component
├── FSMAlerts.tsx              # Alerts component
├── FSMFilters.tsx              # Filter component
└── FSMActions.tsx             # Action buttons

apps/web/hooks/fsm/
├── useFSMServiceOrders.ts     # Service orders hook
├── useFSMServiceOrderDetail.ts # Service order detail hook
├── useFSMServiceOrderCreate.ts # Service order create hook
├── useFSMServiceOrderUpdate.ts # Service order update hook
├── useFSMServiceOrderSchedule.ts # Service order schedule hook
├── useFSMServiceOrderDispatch.ts # Service order dispatch hook
├── useFSMServiceOrderStart.ts # Service order start hook
├── useFSMServiceOrderComplete.ts # Service order complete hook
├── useFSMTechnicians.ts       # Technicians hook
├── useFSMTechnicianDetail.ts  # Technician detail hook
├── useFSMTechnicianCreate.ts  # Technician create hook
├── useFSMTechnicianUpdate.ts  # Technician update hook
├── useFSMTechnicianSchedule.ts # Technician schedule hook
├── useFSMTechnicianLocation.ts # Technician location hook
├── useFSMAnalytics.ts         # Analytics hook
└── useFSMAlerts.ts            # Alerts hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages (data fetching)
- **Client Components**: Forms, interactive elements, modals
- **Feature Flag**: `flags.m87_field_service_management = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose                    | Variant                    |
| ----------- | -------------------------- | -------------------------- |
| `DataTable` | List field service records | With filters, pagination   |
| `Card`      | Service order details      | With actions               |
| `Form`      | Create/edit forms          | With validation            |
| `Button`    | Actions                    | Primary, secondary, danger |
| `Modal`     | Confirmations              | With backdrop              |
| `Timeline`  | Service timeline           | With status indicators     |
| `Map`       | Service locations          | With technician tracking   |

### Design Tokens

```typescript
// FSM-specific colors
const fsmColors = {
  scheduled: "hsl(var(--fsm-scheduled))",
  dispatched: "hsl(var(--fsm-dispatched))",
  inProgress: "hsl(var(--fsm-in-progress))",
  completed: "hsl(var(--fsm-completed))",
  cancelled: "hsl(var(--fsm-cancelled))",
  overdue: "hsl(var(--fsm-overdue))",
};

// FSM status colors
const fsmStatusColors = {
  scheduled: "bg-blue-100 text-blue-800",
  dispatched: "bg-yellow-100 text-yellow-800",
  inProgress: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
  overdue: "bg-red-100 text-red-800",
};

// FSM type colors
const fsmTypeColors = {
  installation: "hsl(var(--fsm-installation))",
  maintenance: "hsl(var(--fsm-maintenance))",
  repair: "hsl(var(--fsm-repair))",
  inspection: "hsl(var(--fsm-inspection))",
  training: "hsl(var(--fsm-training))",
  other: "hsl(var(--fsm-other))",
};
```

### Theme Support

- **Dark Mode**: Default theme
- **Light Mode**: Available via theme toggle
- **High Contrast**: WCAG AAA compliance
- **FSM Themes**: Status-based themes

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  serviceOrders: ["fsm", "service-orders"] as const,
  serviceOrder: (id: string) => ["fsm", "service-order", id] as const,
  technicians: ["fsm", "technicians"] as const,
  technician: (id: string) => ["fsm", "technician", id] as const,
  technicianSchedule: (id: string) =>
    ["fsm", "technician-schedule", id] as const,
  technicianLocation: (id: string) =>
    ["fsm", "technician-location", id] as const,
  schedule: ["fsm", "schedule"] as const,
  dispatch: ["fsm", "dispatch"] as const,
  analytics: ["fsm", "analytics"] as const,
  alerts: ["fsm", "alerts"] as const,
};
```

### Cache Configuration

| Query Type          | Stale Time | Cache Time | Invalidation            |
| ------------------- | ---------- | ---------- | ----------------------- |
| Service Orders      | 5 minutes  | 10 minutes | On create/update/delete |
| Service Order       | 10 minutes | 30 minutes | On update/delete        |
| Technicians         | 5 minutes  | 15 minutes | On create/update/delete |
| Technician          | 10 minutes | 30 minutes | On update/delete        |
| Technician Schedule | 1 minute   | 5 minutes  | On schedule update      |
| Technician Location | 30 seconds | 2 minutes  | On location update      |
| Schedule            | 1 minute   | 5 minutes  | On schedule change      |
| Dispatch            | 1 minute   | 5 minutes  | On dispatch change      |
| Analytics           | 15 minutes | 45 minutes | On field service change |
| Alerts              | 1 minute   | 5 minutes  | On alert update         |

### Invalidation Rules

```typescript
// After creating service order
queryClient.invalidateQueries({ queryKey: ["fsm", "service-orders"] });
queryClient.invalidateQueries({ queryKey: ["fsm", "schedule"] });

// After updating service order
queryClient.invalidateQueries({ queryKey: ["fsm", "service-order", id] });
queryClient.invalidateQueries({ queryKey: ["fsm", "service-orders"] });

// After dispatching service order
queryClient.invalidateQueries({ queryKey: ["fsm", "service-order", id] });
queryClient.invalidateQueries({ queryKey: ["fsm", "dispatch"] });
```

---

## 🎭 User Experience

### User Flows

#### 1. Create Service Order

1. User navigates to FSM service orders page
2. User clicks "Create Service Order" button
3. System opens service order creation form
4. User selects customer and service type
5. User schedules service date and time
6. User assigns technician
7. User submits service order

#### 2. Dispatch Service Order

1. User navigates to dispatch page
2. User sees pending service orders
3. User selects service order to dispatch
4. User assigns technician
5. User sends dispatch notification
6. System updates service order status
7. Technician receives notification

#### 3. Track Service Progress

1. User views service order detail page
2. User sees real-time service status
3. User can view technician location
4. User can communicate with technician
5. User can update service details
6. User can complete service

### UI States

| State          | Component       | Message                             |
| -------------- | --------------- | ----------------------------------- |
| **Empty**      | `FSMEmptyState` | "No field service records found"    |
| **Loading**    | `FSMSkeleton`   | Loading skeleton                    |
| **Error**      | `FSMErrorState` | "Failed to load field service data" |
| **No Results** | `FSMNoResults`  | "No records match your search"      |

### Interactions

- **Hover**: Card elevation, button color change
- **Focus**: Clear focus ring, keyboard navigation
- **Click**: Immediate feedback, loading state
- **Form Validation**: Inline errors, real-time validation
- **Map**: Interactive maps, technician tracking

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
| `Ctrl/Cmd + N` | Create new service order |
| `Ctrl/Cmd + F` | Focus search field       |
| `Ctrl/Cmd + D` | Dispatch service order   |
| `Ctrl/Cmd + T` | Track technician         |
| `Escape`       | Close modal/dialog       |
| `Enter`        | Submit form              |

### ARIA Implementation

```typescript
// FSM list
<table role="table" aria-label="Field service orders list">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" aria-sort="none">Order Number</th>
      <th role="columnheader" aria-sort="none">Customer</th>
      <th role="columnheader" aria-sort="none">Status</th>
      <th role="columnheader" aria-sort="none">Technician</th>
    </tr>
  </thead>
</table>

// FSM form
<form role="form" aria-label="Create Service Order">
  <input
    aria-describedby="customer-error"
    aria-invalid="false"
    aria-label="Customer"
  />
  <div id="customer-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("FSMServiceOrders", () => {
  it("renders list of service orders", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles search functionality", () => {});
});

// Hook tests
describe("useFSMServiceOrderCreate", () => {
  it("creates service order successfully", () => {});
  it("handles creation errors", () => {});
  it("validates service order data", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("FSM API Integration", () => {
  it("creates service order successfully", () => {});
  it("dispatches service order successfully", () => {});
  it("tracks technician location successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Field Service Management E2E", () => {
  it("complete service order creation flow", () => {});
  it("complete service dispatch flow", () => {});
  it("complete service tracking flow", () => {});
  it("field service analytics functionality", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("Field Service Management Accessibility", () => {
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
const FSMServiceOrderForm = lazy(
  () => import("./components/FSMServiceOrderForm")
);
const FSMAnalytics = lazy(() => import("./components/FSMAnalytics"));

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
mkdir -p apps/web/app/(dashboard)/fsm
mkdir -p apps/web/components/fsm
mkdir -p apps/web/hooks/fsm

# Create feature flag
echo 'flags.m87_field_service_management = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/fsm/FSMServiceOrders.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useFSMServiceOrders } from "@/hooks/fsm/useFSMServiceOrders";

export function FSMServiceOrders() {
  const { data, isLoading, error } = useFSMServiceOrders();

  if (isLoading) return <FSMSkeleton />;
  if (error) return <FSMErrorState />;
  if (!data?.length) return <FSMEmptyState />;

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
// apps/web/hooks/fsm/useFSMServiceOrders.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useFSMServiceOrders(filters?: FSMFilters) {
  return useQuery({
    queryKey: ["fsm", "service-orders", filters],
    queryFn: () => api.fsm.serviceOrders.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/fsm/service-orders/page.tsx
import { FSMServiceOrders } from "@/components/fsm/FSMServiceOrders";
import { FSMFilters } from "@/components/fsm/FSMFilters";

export default function FSMServiceOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Field Service Orders</h1>
        <CreateServiceOrderButton />
      </div>
      <FSMFilters />
      <FSMServiceOrders />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/fsm/__tests__/FSMServiceOrders.test.tsx
import { render, screen } from "@testing-library/react";
import { FSMServiceOrders } from "@/components/fsm/FSMServiceOrders";

describe("FSMServiceOrders", () => {
  it("renders list of service orders", () => {
    render(<FSMServiceOrders />);
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
  m87_field_service_management: false, // Default: disabled
};

// Usage in components
if (flags.m87_field_service_management) {
  return <FSMServiceOrders />;
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

1. **Set feature flag**: `flags.m87_field_service_management = false`
2. **Invalidate cache**: `revalidateTag('fsm')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Service order management functional
- [ ] Technician management working
- [ ] Service scheduling functional
- [ ] Service dispatch working
- [ ] Service tracking functional
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

**Ready to implement Field Service Management UI! 🚀**
