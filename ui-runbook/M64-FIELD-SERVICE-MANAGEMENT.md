# 🎯 M64: Field Service Management - UI Implementation Runbook

**Module ID**: M64  
**Module Name**: Field Service Management  
**Priority**: MEDIUM  
**Phase**: Phase 13 - Extended Modules  
**Estimated Effort**: 4 days  
**Last Updated**: 2025-10-06

**Status**: ❌ NO - CREATE NEW Module

---

## 📋 Module Overview

Field Service Management provides **service scheduling**, **technician dispatch**, **work order management**, and **mobile field service** for businesses requiring **field service operations** and **customer service excellence**.

### Business Value

**Key Benefits**:

- **Service Scheduling**: Optimize technician schedules
- **Technician Dispatch**: Real-time dispatch management
- **Work Order Management**: Complete service tracking
- **Mobile Field Service**: Mobile app for technicians

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
| **Database**  | ❌ NEW | FSM schema needed           |
| **Services**  | ❌ NEW | FSM services needed         |
| **API**       | ❌ NEW | FSM APIs needed             |
| **Contracts** | ❌ NEW | FSM type definitions needed |

### API Endpoints

**Field Service Management Operations** (8 endpoints):

- ❌ `/api/fsm/service-orders` - List service orders
- ❌ `/api/fsm/service-orders/[id]` - Get service order details
- ❌ `/api/fsm/service-orders/create` - Create new service order
- ❌ `/api/fsm/service-orders/[id]/update` - Update service order
- ❌ `/api/fsm/technicians` - List technicians
- ❌ `/api/fsm/technicians/[id]` - Get technician details
- ❌ `/api/fsm/dispatch` - Dispatch technician
- ❌ `/api/fsm/schedule` - Schedule service

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                      | Page Component           | Purpose                    |
| -------------------------- | ------------------------ | -------------------------- |
| `/fsm`                     | `FSMDashboardPage`       | Service dashboard          |
| `/fsm/service-orders`      | `ServiceOrdersPage`      | List service orders        |
| `/fsm/service-orders/[id]` | `ServiceOrderDetailPage` | View service order details |
| `/fsm/technicians`         | `TechniciansPage`        | List technicians           |
| `/fsm/technicians/[id]`    | `TechnicianDetailPage`   | View technician details    |

### Component Structure

```
apps/web/app/(dashboard)/fsm/
├── page.tsx                    # FSM dashboard
├── service-orders/
│   ├── page.tsx               # Service orders list
│   └── [id]/
│       └── page.tsx           # Service order detail
└── technicians/
    ├── page.tsx               # Technicians list
    └── [id]/
        └── page.tsx           # Technician detail

apps/web/components/fsm/
├── ServiceDashboard.tsx       # Service dashboard
├── ServiceOrdersList.tsx     # Service orders list
├── ServiceOrderCard.tsx      # Service order card
├── TechniciansList.tsx       # Technicians list
├── TechnicianCard.tsx        # Technician card
├── TechnicianMap.tsx         # Technician location map
└── ServiceMetrics.tsx        # Service metrics

apps/web/hooks/fsm/
├── useServiceDashboard.ts    # Service dashboard hook
├── useServiceOrders.ts      # Service orders hook
├── useTechnicians.ts        # Technicians hook
└── useDispatch.ts           # Dispatch hook
```

### Server/Client Boundaries

- **Server Components**: Dashboard pages, service orders list (data fetching)
- **Client Components**: Maps, interactive elements, dispatch forms
- **Feature Flag**: `flags.m64_field_service_management = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose              | Variant                    |
| ----------- | -------------------- | -------------------------- |
| `DataTable` | List service orders  | With filters, pagination   |
| `Card`      | Service metrics      | With charts                |
| `Form`      | Create service order | With validation            |
| `Button`    | Actions              | Primary, secondary, danger |
| `Map`       | Technician locations | Interactive map            |

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
  serviceDashboard: ["fsm", "dashboard"] as const,
  serviceOrders: ["fsm", "service-orders"] as const,
  serviceOrder: (id: string) => ["fsm", "service-orders", id] as const,
  technicians: ["fsm", "technicians"] as const,
  technician: (id: string) => ["fsm", "technicians", id] as const,
  dispatch: ["fsm", "dispatch"] as const,
};
```

### Cache Configuration

| Query Type     | Stale Time | Cache Time | Invalidation            |
| -------------- | ---------- | ---------- | ----------------------- |
| Service Orders | 5 minutes  | 15 minutes | On create/update/delete |
| Technicians    | 10 minutes | 30 minutes | On status change        |
| Dispatch       | 1 minute   | 5 minutes  | On dispatch update      |
| Dashboard      | 30 seconds | 2 minutes  | On any change           |

### Invalidation Rules

```typescript
// After creating service order
queryClient.invalidateQueries({ queryKey: ["fsm", "service-orders"] });
queryClient.invalidateQueries({ queryKey: ["fsm", "dashboard"] });

// After dispatching technician
queryClient.invalidateQueries({ queryKey: ["fsm", "technicians"] });
queryClient.invalidateQueries({ queryKey: ["fsm", "dispatch"] });
queryClient.invalidateQueries({ queryKey: ["fsm", "dashboard"] });

// After updating service order
queryClient.invalidateQueries({ queryKey: ["fsm", "service-orders"] });
queryClient.invalidateQueries({ queryKey: ["fsm", "service-orders", id] });
```

---

## 🎭 User Experience

### User Flows

#### 1. Service Dashboard

1. User navigates to `/fsm`
2. System loads service metrics and technician map
3. User can view real-time service status
4. User can drill down into specific metrics

#### 2. Create Service Order

1. User clicks "Create Service Order" button
2. System opens service order form
3. User fills required fields (customer, service type, location)
4. User submits form
5. System creates service order and redirects to detail page

#### 3. Dispatch Technician

1. User views service order detail page
2. User clicks "Dispatch Technician" button
3. System shows available technicians
4. User selects technician and assigns
5. System dispatches technician and updates status

### UI States

| State          | Component       | Message                               |
| -------------- | --------------- | ------------------------------------- |
| **Empty**      | `FSMEmptyState` | "No service orders found"             |
| **Loading**    | `FSMSkeleton`   | Loading skeleton                      |
| **Error**      | `FSMErrorState` | "Failed to load service data"         |
| **No Results** | `FSMNoResults`  | "No service orders match your search" |

### Interactions

- **Hover**: Card elevation, button color change
- **Focus**: Clear focus ring, keyboard navigation
- **Click**: Immediate feedback, loading state
- **Form Validation**: Inline errors, real-time validation

---

## 🚀 Implementation Guide

### Step 1: Setup Database Schema

```sql
-- Service Orders
CREATE TABLE service_orders (
  id UUID PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  location GEOGRAPHY(POINT) NOT NULL,
  scheduled_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  priority VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Technicians
CREATE TABLE technicians (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  skills TEXT[],
  current_location GEOGRAPHY(POINT),
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Service Dispatch
CREATE TABLE service_dispatch (
  id UUID PRIMARY KEY,
  service_order_id UUID REFERENCES service_orders(id),
  technician_id UUID REFERENCES technicians(id),
  dispatched_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) NOT NULL
);
```

### Step 2: Create Components

```typescript
// apps/web/components/fsm/ServiceDashboard.tsx
"use client";

import { Card } from "@/components/ui/card";
import { useServiceDashboard } from "@/hooks/fsm/useServiceDashboard";

export function ServiceDashboard() {
  const { data, isLoading, error } = useServiceDashboard();

  if (isLoading) return <FSMSkeleton />;
  if (error) return <FSMErrorState />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <h3>Active Jobs</h3>
        <p className="text-3xl font-bold">{data.activeJobs}</p>
      </Card>
      <Card>
        <h3>Technicians</h3>
        <p className="text-3xl font-bold">{data.technicians}</p>
      </Card>
      <Card>
        <h3>Completion Rate</h3>
        <p className="text-3xl font-bold">{data.completionRate}%</p>
      </Card>
      <Card>
        <h3>Customer Rating</h3>
        <p className="text-3xl font-bold">{data.customerRating}/5</p>
      </Card>
    </div>
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/fsm/useServiceDashboard.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useServiceDashboard() {
  return useQuery({
    queryKey: ["fsm", "dashboard"],
    queryFn: () => api.fsm.getServiceDashboard(),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCreateServiceOrder() {
  return useMutation({
    mutationFn: (data: ServiceOrderData) => api.fsm.createServiceOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fsm", "service-orders"],
      });
      queryClient.invalidateQueries({
        queryKey: ["fsm", "dashboard"],
      });
    },
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/fsm/page.tsx
import { ServiceDashboard } from "@/components/fsm/ServiceDashboard";
import { TechnicianMap } from "@/components/fsm/TechnicianMap";

export default function FSMPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Field Service Management</h1>
        <CreateServiceOrderButton />
      </div>
      <ServiceDashboard />
      <TechnicianMap />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/fsm/__tests__/ServiceDashboard.test.tsx
import { render, screen } from "@testing-library/react";
import { ServiceDashboard } from "@/components/fsm/ServiceDashboard";

describe("ServiceDashboard", () => {
  it("renders service dashboard", () => {
    render(<ServiceDashboard />);
    expect(screen.getByText("Active Jobs")).toBeInTheDocument();
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

| Shortcut       | Action               |
| -------------- | -------------------- |
| `Ctrl/Cmd + N` | Create service order |
| `Ctrl/Cmd + F` | Focus search field   |
| `Escape`       | Close modal/dialog   |
| `Enter`        | Submit form          |

### ARIA Implementation

```typescript
// FSM dashboard
<div role="region" aria-label="Service dashboard">
  <div role="group" aria-label="Service metrics">
    <h3>Active Jobs</h3>
    <p aria-live="polite">{data.activeJobs}</p>
  </div>
</div>

// Form
<form role="form" aria-label="Create service order">
  <input aria-describedby="service-error" aria-invalid="false" />
  <div id="service-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("ServiceDashboard", () => {
  it("renders service dashboard", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("displays service metrics", () => {});
});

// Hook tests
describe("useServiceDashboard", () => {
  it("fetches service data", () => {});
  it("handles pagination", () => {});
  it("handles filters", () => {});
  it("handles errors", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Field Service Management API Integration", () => {
  it("creates service order successfully", () => {});
  it("dispatches technician successfully", () => {});
  it("tracks service completion correctly", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Field Service Management E2E", () => {
  it("complete service order flow", () => {});
  it("complete technician dispatch flow", () => {});
  it("service completion flow", () => {});
  it("search and filter functionality", () => {});
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
const ServiceOrderCreatePage = lazy(
  () => import("./service-orders/create/page")
);

// Code splitting
const TechnicianMap = lazy(() => import("./components/TechnicianMap"));

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
  m64_field_service_management: false, // Default: disabled
};

// Usage in components
if (flags.m64_field_service_management) {
  return <ServiceDashboard />;
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

1. **Set feature flag**: `flags.m64_field_service_management = false`
2. **Invalidate cache**: `revalidateTag('fsm')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Service order management functional
- [ ] Technician dispatch functional
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

**Ready to implement Field Service Management UI! 🚀**
