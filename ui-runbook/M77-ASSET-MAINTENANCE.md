# 🎯 M77: Asset Maintenance - UI Implementation Runbook

**Module ID**: M77  
**Module Name**: Asset Maintenance  
**Priority**: 🔶 MEDIUM  
**Phase**: Phase 15 - User Experience  
**Estimated Effort**: 3 days  
**Last Updated**: 2025-10-06

**Status**: 🔄 HYBRID - Enhance M58-ASSET-MAINTENANCE

---

## 📋 Module Overview

### Business Value

Asset Maintenance provides **comprehensive asset maintenance management** for businesses requiring organized asset care and maintenance scheduling.

**Key Benefits**:

- Preventive and corrective maintenance scheduling
- Maintenance history tracking and analytics
- Integration with existing modules (Fixed Assets, Inventory, etc.)
- Maintenance cost tracking and optimization

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
| **API**       | ✅ Complete | 16 endpoints available    |
| **Contracts** | ✅ Complete | Type-safe schemas defined |

### API Endpoints

**Asset Maintenance Operations** (16 endpoints):

- ✅ `/api/maintenance` - List maintenance records
- ✅ `/api/maintenance/[id]` - Get maintenance details
- ✅ `/api/maintenance/create` - Create maintenance record
- ✅ `/api/maintenance/[id]/update` - Update maintenance
- ✅ `/api/maintenance/[id]/delete` - Delete maintenance
- ✅ `/api/maintenance/[id]/complete` - Complete maintenance
- ✅ `/api/maintenance/[id]/cancel` - Cancel maintenance
- ✅ `/api/maintenance/[id]/reschedule` - Reschedule maintenance
- ✅ `/api/maintenance/schedules` - Get maintenance schedules
- ✅ `/api/maintenance/schedules/create` - Create schedule
- ✅ `/api/maintenance/schedules/[id]` - Update schedule
- ✅ `/api/maintenance/schedules/[id]/delete` - Delete schedule
- ✅ `/api/maintenance/technicians` - Get technicians
- ✅ `/api/maintenance/technicians/[id]` - Get technician details
- ✅ `/api/maintenance/analytics` - Get maintenance analytics
- ✅ `/api/maintenance/alerts` - Get maintenance alerts

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                           | Page Component                  | Purpose                   |
| ------------------------------- | ------------------------------- | ------------------------- |
| `/maintenance`                  | `MaintenanceListPage`           | List maintenance records  |
| `/maintenance/[id]`             | `MaintenanceDetailPage`         | View maintenance details  |
| `/maintenance/create`           | `MaintenanceCreatePage`         | Create maintenance record |
| `/maintenance/[id]/edit`        | `MaintenanceEditPage`           | Edit maintenance record   |
| `/maintenance/schedules`        | `MaintenanceSchedulesPage`      | View schedules            |
| `/maintenance/schedules/create` | `MaintenanceScheduleCreatePage` | Create schedule           |
| `/maintenance/technicians`      | `MaintenanceTechniciansPage`    | View technicians          |
| `/maintenance/analytics`        | `MaintenanceAnalyticsPage`      | Maintenance analytics     |
| `/maintenance/alerts`           | `MaintenanceAlertsPage`         | Maintenance alerts        |

### Component Structure

```
apps/web/app/(dashboard)/maintenance/
├── page.tsx                    # List page
├── [id]/
│   ├── page.tsx               # Detail page
│   └── edit/
│       └── page.tsx           # Edit page
├── create/
│   └── page.tsx               # Create page
├── schedules/
│   ├── page.tsx               # Schedules list
│   └── create/
│       └── page.tsx           # Create schedule
├── technicians/
│   └── page.tsx               # Technicians page
├── analytics/
│   └── page.tsx               # Analytics page
└── alerts/
    └── page.tsx               # Alerts page

apps/web/components/maintenance/
├── MaintenanceList.tsx        # List component
├── MaintenanceCard.tsx        # Card component
├── MaintenanceForm.tsx        # Form component
├── MaintenanceSchedules.tsx   # Schedules component
├── MaintenanceTechnicians.tsx # Technicians component
├── MaintenanceAnalytics.tsx   # Analytics component
├── MaintenanceAlerts.tsx      # Alerts component
├── MaintenanceFilters.tsx    # Filter component
└── MaintenanceActions.tsx    # Action buttons

apps/web/hooks/maintenance/
├── useMaintenanceList.ts      # List hook
├── useMaintenanceDetail.ts    # Detail hook
├── useMaintenanceCreate.ts    # Create hook
├── useMaintenanceUpdate.ts    # Update hook
├── useMaintenanceComplete.ts  # Complete hook
├── useMaintenanceSchedules.ts # Schedules hook
├── useMaintenanceTechnicians.ts # Technicians hook
└── useMaintenanceAnalytics.ts # Analytics hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages (data fetching)
- **Client Components**: Forms, interactive elements, modals
- **Feature Flag**: `flags.m77_asset_maintenance = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose              | Variant                    |
| ----------- | -------------------- | -------------------------- |
| `DataTable` | List maintenance     | With filters, pagination   |
| `Card`      | Maintenance details  | With actions               |
| `Form`      | Create/edit forms    | With validation            |
| `Button`    | Actions              | Primary, secondary, danger |
| `Modal`     | Confirmations        | With backdrop              |
| `Timeline`  | Maintenance timeline | With status indicators     |
| `Calendar`  | Maintenance calendar | With scheduled dates       |

### Design Tokens

```typescript
// Maintenance-specific colors
const maintenanceColors = {
  scheduled: "hsl(var(--maintenance-scheduled))",
  inProgress: "hsl(var(--maintenance-in-progress))",
  completed: "hsl(var(--maintenance-completed))",
  cancelled: "hsl(var(--maintenance-cancelled))",
  overdue: "hsl(var(--maintenance-overdue))",
  emergency: "hsl(var(--maintenance-emergency))",
};

// Maintenance status colors
const maintenanceStatusColors = {
  scheduled: "bg-blue-100 text-blue-800",
  inProgress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
  overdue: "bg-red-100 text-red-800",
  emergency: "bg-red-100 text-red-800",
};

// Maintenance type colors
const maintenanceTypeColors = {
  preventive: "hsl(var(--maintenance-preventive))",
  corrective: "hsl(var(--maintenance-corrective))",
  emergency: "hsl(var(--maintenance-emergency))",
  inspection: "hsl(var(--maintenance-inspection))",
  calibration: "hsl(var(--maintenance-calibration))",
  cleaning: "hsl(var(--maintenance-cleaning))",
  other: "hsl(var(--maintenance-other))",
};
```

### Theme Support

- **Dark Mode**: Default theme
- **Light Mode**: Available via theme toggle
- **High Contrast**: WCAG AAA compliance
- **Maintenance Themes**: Status-based themes

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  list: ["maintenance", "list"] as const,
  detail: (id: string) => ["maintenance", "detail", id] as const,
  schedules: ["maintenance", "schedules"] as const,
  technicians: ["maintenance", "technicians"] as const,
  analytics: ["maintenance", "analytics"] as const,
  alerts: ["maintenance", "alerts"] as const,
};
```

### Cache Configuration

| Query Type  | Stale Time | Cache Time | Invalidation            |
| ----------- | ---------- | ---------- | ----------------------- |
| List        | 5 minutes  | 10 minutes | On create/update/delete |
| Detail      | 10 minutes | 30 minutes | On update/delete        |
| Schedules   | 5 minutes  | 15 minutes | On schedule change      |
| Technicians | 15 minutes | 45 minutes | On technician update    |
| Analytics   | 15 minutes | 45 minutes | On maintenance change   |
| Alerts      | 1 minute   | 5 minutes  | On alert update         |

### Invalidation Rules

```typescript
// After creating maintenance
queryClient.invalidateQueries({ queryKey: ["maintenance", "list"] });
queryClient.invalidateQueries({ queryKey: ["maintenance", "analytics"] });

// After updating maintenance
queryClient.invalidateQueries({ queryKey: ["maintenance", "detail", id] });
queryClient.invalidateQueries({ queryKey: ["maintenance", "list"] });

// After completing maintenance
queryClient.invalidateQueries({ queryKey: ["maintenance", "detail", id] });
queryClient.invalidateQueries({ queryKey: ["maintenance", "alerts"] });
```

---

## 🎭 User Experience

### User Flows

#### 1. Create Maintenance Record

1. User navigates to maintenance page
2. User clicks "Create Maintenance" button
3. System opens maintenance creation form
4. User selects asset and maintenance type
5. User schedules maintenance date
6. User assigns technician
7. User submits maintenance record

#### 2. Complete Maintenance

1. User views maintenance detail page
2. User clicks "Start Maintenance" button
3. System updates status to "In Progress"
4. User performs maintenance tasks
5. User clicks "Complete Maintenance" button
6. User fills completion details
7. System updates status to "Completed"

#### 3. Schedule Maintenance

1. User navigates to schedules page
2. User clicks "Create Schedule" button
3. System opens schedule creation form
4. User selects asset and maintenance type
5. User sets recurrence pattern
6. User assigns technician
7. User saves schedule

### UI States

| State          | Component               | Message                              |
| -------------- | ----------------------- | ------------------------------------ |
| **Empty**      | `MaintenanceEmptyState` | "No maintenance records found"       |
| **Loading**    | `MaintenanceSkeleton`   | Loading skeleton                     |
| **Error**      | `MaintenanceErrorState` | "Failed to load maintenance"         |
| **No Results** | `MaintenanceNoResults`  | "No maintenance matches your search" |

### Interactions

- **Hover**: Card elevation, button color change
- **Focus**: Clear focus ring, keyboard navigation
- **Click**: Immediate feedback, loading state
- **Form Validation**: Inline errors, real-time validation
- **Calendar**: Date selection, schedule visualization

---

## ♿ Accessibility

### WCAG 2.2 AA Compliance

- **Color Contrast**: ≥4.5:1 for normal text, ≥3:1 for large text
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Reader**: Proper ARIA labels and descriptions
- **Focus Management**: Clear focus indicators, logical tab order

### Keyboard Shortcuts

| Shortcut       | Action                 |
| -------------- | ---------------------- |
| `Ctrl/Cmd + N` | Create new maintenance |
| `Ctrl/Cmd + F` | Focus search field     |
| `Ctrl/Cmd + C` | Complete maintenance   |
| `Ctrl/Cmd + S` | Schedule maintenance   |
| `Escape`       | Close modal/dialog     |
| `Enter`        | Submit form            |

### ARIA Implementation

```typescript
// Maintenance list
<table role="table" aria-label="Maintenance records list">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" aria-sort="none">Asset</th>
      <th role="columnheader" aria-sort="none">Type</th>
      <th role="columnheader" aria-sort="none">Status</th>
      <th role="columnheader" aria-sort="none">Scheduled Date</th>
    </tr>
  </thead>
</table>

// Maintenance form
<form role="form" aria-label="Create Maintenance">
  <input
    aria-describedby="asset-error"
    aria-invalid="false"
    aria-label="Asset"
  />
  <div id="asset-error" role="alert" aria-live="polite" />
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
describe("useMaintenanceCreate", () => {
  it("creates maintenance successfully", () => {});
  it("handles creation errors", () => {});
  it("validates maintenance data", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Maintenance API Integration", () => {
  it("creates maintenance successfully", () => {});
  it("completes maintenance successfully", () => {});
  it("schedules maintenance successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Asset Maintenance E2E", () => {
  it("complete maintenance creation flow", () => {});
  it("complete maintenance completion flow", () => {});
  it("complete maintenance scheduling flow", () => {});
  it("maintenance calendar functionality", () => {});
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

- **Target**: ≤350KB gzipped per route
- **Current**: <CURRENT_SIZE>KB
- **Optimization**: Code splitting, lazy loading, form optimization

### Loading Performance

- **TTFB**: ≤70ms (Time to First Byte)
- **TTI**: ≤200ms (Time to Interactive)
- **LCP**: ≤2.5s (Largest Contentful Paint)

### Optimization Strategies

```typescript
// Lazy loading
const MaintenanceForm = lazy(() => import("./components/MaintenanceForm"));
const MaintenanceAnalytics = lazy(
  () => import("./components/MaintenanceAnalytics")
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
mkdir -p apps/web/app/(dashboard)/maintenance
mkdir -p apps/web/components/maintenance
mkdir -p apps/web/hooks/maintenance

# Create feature flag
echo 'flags.m77_asset_maintenance = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/maintenance/MaintenanceList.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useMaintenanceList } from "@/hooks/maintenance/useMaintenanceList";

export function MaintenanceList() {
  const { data, isLoading, error } = useMaintenanceList();

  if (isLoading) return <MaintenanceSkeleton />;
  if (error) return <MaintenanceErrorState />;
  if (!data?.length) return <MaintenanceEmptyState />;

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="assetName"
      filters={filters}
    />
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/maintenance/useMaintenanceList.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useMaintenanceList(filters?: MaintenanceFilters) {
  return useQuery({
    queryKey: ["maintenance", "list", filters],
    queryFn: () => api.maintenance.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/maintenance/page.tsx
import { MaintenanceList } from "@/components/maintenance/MaintenanceList";
import { MaintenanceFilters } from "@/components/maintenance/MaintenanceFilters";

export default function MaintenancePage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Asset Maintenance</h1>
        <CreateMaintenanceButton />
      </div>
      <MaintenanceFilters />
      <MaintenanceList />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/maintenance/__tests__/MaintenanceList.test.tsx
import { render, screen } from "@testing-library/react";
import { MaintenanceList } from "@/components/maintenance/MaintenanceList";

describe("MaintenanceList", () => {
  it("renders list of maintenance records", () => {
    render(<MaintenanceList />);
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
| Bundle size       | ≤350KB    | CI blocks   |

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
  m77_asset_maintenance: false, // Default: disabled
};

// Usage in components
if (flags.m77_asset_maintenance) {
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

1. **Set feature flag**: `flags.m77_asset_maintenance = false`
2. **Invalidate cache**: `revalidateTag('maintenance')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Maintenance creation functional
- [ ] Maintenance completion working
- [ ] Maintenance scheduling functional
- [ ] Technician management working
- [ ] Maintenance analytics functional
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
