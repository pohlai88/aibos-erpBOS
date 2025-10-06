# 🎯 M58: Asset Maintenance - UI Implementation Runbook

**Module ID**: M58  
**Module Name**: Asset Maintenance  
**Priority**: 🔥 HIGH  
**Phase**: Phase 12 - Operational Modules  
**Estimated Effort**: 3 days  
**Last Updated**: 2025-10-06

**Status**: 🔄 HYBRID - Enhance M08-FIXED-ASSETS

---

## 📋 Module Overview

Asset Maintenance provides **preventive maintenance scheduling**, **work order management**, **maintenance tracking**, and **asset downtime analysis** for businesses requiring **asset maintenance management** and **reliability optimization**.

### Business Value

**Key Benefits**:

- **Preventive Maintenance**: Scheduled maintenance planning
- **Work Order Management**: Track maintenance work orders
- **Maintenance History**: Complete maintenance records
- **Downtime Analysis**: Minimize asset downtime

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status     | Details                               |
| ------------- | ---------- | ------------------------------------- |
| **Database**  | 🔄 PARTIAL | Asset tables exist, needs maintenance |
| **Services**  | 🔄 PARTIAL | Asset services exist                  |
| **API**       | 🔄 PARTIAL | Asset APIs exist                      |
| **Contracts** | 🔄 PARTIAL | Asset types exist, needs maintenance  |

### API Endpoints

**Asset Maintenance** (Enhancement needed):

- 🔄 `/api/assets` - Enhance with maintenance fields
- ❌ `/api/assets/[id]/maintenance` - Maintenance schedule
- ❌ `/api/assets/[id]/work-orders` - Work orders
- ❌ `/api/assets/[id]/history` - Maintenance history
- ❌ `/api/assets/downtime` - Downtime analytics

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                          | Page Component            | Purpose                |
| ------------------------------ | ------------------------- | ---------------------- |
| `/assets/maintenance`          | `MaintenanceListPage`     | List maintenance tasks |
| `/assets/[id]/maintenance`     | `AssetMaintenancePage`    | Asset maintenance      |
| `/assets/work-orders`          | `WorkOrdersListPage`      | List work orders       |
| `/assets/work-orders/[id]`     | `WorkOrderDetailPage`     | Work order details     |
| `/assets/maintenance/schedule` | `MaintenanceSchedulePage` | Maintenance calendar   |
| `/assets/downtime`             | `DowntimeAnalyticsPage`   | Downtime dashboard     |

### Component Structure

```
apps/web/app/(dashboard)/assets/
├── maintenance/
│   ├── page.tsx                # Maintenance list page
│   └── schedule/
│       └── page.tsx            # Schedule page
├── work-orders/
│   ├── page.tsx                # Work orders list page
│   └── [id]/
│       └── page.tsx            # Work order detail page
├── downtime/
│   └── page.tsx                # Downtime analytics page
└── [id]/
    └── maintenance/
        └── page.tsx            # Asset maintenance page

apps/web/components/assets/
├── MaintenanceList.tsx         # Maintenance list
├── MaintenanceSchedule.tsx     # Maintenance calendar
├── WorkOrderForm.tsx           # Work order form
├── MaintenanceHistory.tsx      # History timeline
└── DowntimeAnalytics.tsx       # Downtime dashboard

apps/web/hooks/assets/
├── useMaintenance.ts           # Maintenance hook
├── useWorkOrders.ts            # Work orders hook
├── useMaintenanceHistory.ts    # History hook
└── useDowntimeAnalytics.ts     # Analytics hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages
- **Client Components**: Forms, calendar, analytics charts
- **Feature Flag**: `flags.m58_asset_maintenance = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose              | Variant                  |
| ----------- | -------------------- | ------------------------ |
| `DataTable` | List maintenance     | With filters, pagination |
| `Card`      | Work order details   | With actions             |
| `Calendar`  | Maintenance schedule | With events              |
| `Form`      | Work order forms     | With validation          |
| `Timeline`  | Maintenance history  | With milestones          |
| `Chart`     | Downtime analytics   | Line, bar                |

### Design Tokens

```typescript
// Maintenance specific colors
const maintenanceColors = {
  scheduled: "hsl(var(--maintenance-scheduled))",
  inProgress: "hsl(var(--maintenance-in-progress))",
  completed: "hsl(var(--maintenance-completed))",
  overdue: "hsl(var(--maintenance-overdue))",
};

// Work order status colors
const workOrderStatusColors = {
  open: "bg-blue-100 text-blue-800",
  inProgress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
};
```

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  maintenance: ["maintenance", "list"] as const,
  maintenanceDetail: (id: string) => ["maintenance", "detail", id] as const,
  workOrders: ["work-orders", "list"] as const,
  maintenanceHistory: (id: string) => ["maintenance", "history", id] as const,
  downtimeAnalytics: ["maintenance", "downtime"] as const,
};
```

### Cache Configuration

| Query Type          | Stale Time | Cache Time | Invalidation            |
| ------------------- | ---------- | ---------- | ----------------------- |
| Maintenance List    | 5 minutes  | 15 minutes | On create/update/delete |
| Maintenance Detail  | 10 minutes | 30 minutes | On update               |
| Work Orders         | 5 minutes  | 15 minutes | On work order update    |
| Maintenance History | 15 minutes | 60 minutes | On maintenance complete |
| Downtime Analytics  | 10 minutes | 30 minutes | On data change          |

---

## 🚀 Implementation Guide

### Step 1: Enhance M08-FIXED-ASSETS

```bash
# Enhance existing fixed assets module
# Add maintenance scheduling
# Add work order management
# Add maintenance tracking
```

### Step 2: Create Components

```typescript
// apps/web/components/assets/MaintenanceList.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useMaintenance } from "@/hooks/assets/useMaintenance";

export function MaintenanceList() {
  const { data, isLoading, error } = useMaintenance();

  if (isLoading) return <MaintenanceSkeleton />;
  if (error) return <MaintenanceErrorState />;
  if (!data?.length) return <MaintenanceEmptyState />;

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="description"
      filters={filters}
    />
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/assets/useMaintenance.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useMaintenance(assetId?: string) {
  return useQuery({
    queryKey: ["assets", "maintenance", assetId],
    queryFn: () => api.assets.getMaintenance(assetId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateWorkOrder() {
  return useMutation({
    mutationFn: (data: WorkOrderData) => api.assets.createWorkOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["assets", "maintenance"],
      });
    },
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/assets/maintenance/page.tsx
import { MaintenanceList } from "@/components/assets/MaintenanceList";
import { MaintenanceFilters } from "@/components/assets/MaintenanceFilters";

export default function MaintenancePage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Asset Maintenance</h1>
        <CreateWorkOrderButton />
      </div>
      <MaintenanceFilters />
      <MaintenanceList />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/assets/maintenance/__tests__/MaintenanceList.test.tsx
import { render, screen } from "@testing-library/react";
import { MaintenanceList } from "@/components/assets/MaintenanceList";

describe("MaintenanceList", () => {
  it("renders list of maintenance records", () => {
    render(<MaintenanceList />);
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

| Shortcut       | Action             |
| -------------- | ------------------ |
| `Ctrl/Cmd + N` | Create work order  |
| `Ctrl/Cmd + F` | Focus search field |
| `Escape`       | Close modal/dialog |
| `Enter`        | Submit form        |

### ARIA Implementation

```typescript
// Maintenance table
<table role="table" aria-label="Maintenance records list">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" aria-sort="none">Asset</th>
      <th role="columnheader" aria-sort="none">Type</th>
      <th role="columnheader" aria-sort="none">Status</th>
    </tr>
  </thead>
</table>

// Form
<form role="form" aria-label="Create work order">
  <input aria-describedby="maintenance-error" aria-invalid="false" />
  <div id="maintenance-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("MaintenanceList", () => {
  it("renders list of maintenance records", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles search functionality", () => {});
});

// Hook tests
describe("useMaintenance", () => {
  it("fetches maintenance data", () => {});
  it("handles pagination", () => {});
  it("handles filters", () => {});
  it("handles errors", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Asset Maintenance API Integration", () => {
  it("creates work order successfully", () => {});
  it("updates maintenance record successfully", () => {});
  it("schedules maintenance correctly", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Asset Maintenance E2E", () => {
  it("complete work order flow", () => {});
  it("complete maintenance scheduling flow", () => {});
  it("maintenance history flow", () => {});
  it("search and filter functionality", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("Asset Maintenance Accessibility", () => {
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
const WorkOrderCreatePage = lazy(() => import("./create/page"));

// Code splitting
const MaintenanceForm = lazy(() => import("./components/MaintenanceForm"));

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
  m58_asset_maintenance: false, // Default: disabled
};

// Usage in components
if (flags.m58_asset_maintenance) {
  return <MaintenanceList />;
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

1. **Set feature flag**: `flags.m58_asset_maintenance = false`
2. **Invalidate cache**: `revalidateTag('maintenance')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Work order management functional
- [ ] Maintenance scheduling functional
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

**Ready to implement Asset Maintenance UI! 🚀**

if (isLoading) return <MaintenanceSkeleton />;
if (error) return <MaintenanceErrorState />;
if (!data?.length) return <MaintenanceEmptyState />;

return (
<DataTable
      data={data}
      columns={columns}
      searchKey="description"
      filters={filters}
    />
);
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
| Bundle size       | ≤350KB    | CI blocks   |

---

## 🚀 Deployment

### Feature Flag

```typescript
const flags = {
  m58_asset_maintenance: false, // Default: disabled
};
````

---

## 📝 Definition of Done

### Functional Requirements

- [ ] Maintenance scheduling working
- [ ] Work order management functional
- [ ] Maintenance tracking working
- [ ] History tracking working
- [ ] Downtime analytics working
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

**Ready to enhance M08-FIXED-ASSETS with Asset Maintenance! 🚀**
