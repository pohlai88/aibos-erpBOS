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
```

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
