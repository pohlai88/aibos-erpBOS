# 🎯 M98: Performance Monitoring - UI Implementation Runbook

**Module ID**: M98  
**Module Name**: Performance Monitoring  
**Priority**: 🔥 HIGH  
**Phase**: Phase 17 - Infrastructure Modernization  
**Estimated Effort**: 3 days  
**Last Updated**: 2025-10-06

**Status**: 🔄 HYBRID - Enhance M39-ANALYTICS-BI

---

## 📋 Module Overview

### Business Value

Performance Monitoring provides **comprehensive system performance monitoring and alerting** for businesses requiring real-time system health tracking and optimization.

**Key Benefits**:

- Complete performance monitoring
- Real-time system metrics
- Performance alerting
- Integration with all existing modules

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
| **API**       | ✅ Complete | 15 endpoints available    |
| **Contracts** | ✅ Complete | Type-safe schemas defined |

### API Endpoints

**Performance Monitoring Operations** (15 endpoints):

- ✅ `/api/performance-monitoring/metrics` - List metrics
- ✅ `/api/performance-monitoring/metrics/[id]` - Get metric details
- ✅ `/api/performance-monitoring/metrics/create` - Create metric
- ✅ `/api/performance-monitoring/metrics/[id]/update` - Update metric
- ✅ `/api/performance-monitoring/metrics/[id]/delete` - Delete metric
- ✅ `/api/performance-monitoring/metrics/[id]/collect` - Collect metric
- ✅ `/api/performance-monitoring/metrics/[id]/export` - Export metric
- ✅ `/api/performance-monitoring/alerts` - List alerts
- ✅ `/api/performance-monitoring/alerts/[id]` - Get alert details
- ✅ `/api/performance-monitoring/alerts/create` - Create alert
- ✅ `/api/performance-monitoring/alerts/[id]/update` - Update alert
- ✅ `/api/performance-monitoring/alerts/[id]/delete` - Delete alert
- ✅ `/api/performance-monitoring/alerts/[id]/trigger` - Trigger alert
- ✅ `/api/performance-monitoring/dashboard` - Get dashboard data
- ✅ `/api/performance-monitoring/reports` - Get performance reports

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                                       | Page Component                          | Purpose               |
| ------------------------------------------- | --------------------------------------- | --------------------- |
| `/performance-monitoring`                   | `PerformanceMonitoringPage`             | Main monitoring hub   |
| `/performance-monitoring/metrics`           | `PerformanceMonitoringMetricsPage`      | Metrics management    |
| `/performance-monitoring/metrics/[id]`      | `PerformanceMonitoringMetricDetailPage` | View metric details   |
| `/performance-monitoring/metrics/create`    | `PerformanceMonitoringMetricCreatePage` | Create metric         |
| `/performance-monitoring/metrics/[id]/edit` | `PerformanceMonitoringMetricEditPage`   | Edit metric           |
| `/performance-monitoring/alerts`            | `PerformanceMonitoringAlertsPage`       | Alert management      |
| `/performance-monitoring/alerts/[id]`       | `PerformanceMonitoringAlertDetailPage`  | View alert details    |
| `/performance-monitoring/alerts/create`     | `PerformanceMonitoringAlertCreatePage`  | Create alert          |
| `/performance-monitoring/alerts/[id]/edit`  | `PerformanceMonitoringAlertEditPage`    | Edit alert            |
| `/performance-monitoring/dashboard`         | `PerformanceMonitoringDashboardPage`    | Performance dashboard |
| `/performance-monitoring/reports`           | `PerformanceMonitoringReportsPage`      | Performance reports   |

### Component Structure

```
apps/web/app/(dashboard)/performance-monitoring/
├── page.tsx                    # Main hub page
├── metrics/
│   ├── page.tsx               # Metrics list
│   ├── [id]/
│   │   ├── page.tsx           # Metric details
│   │   └── edit/
│   │       └── page.tsx       # Edit metric
│   └── create/
│       └── page.tsx           # Create metric
├── alerts/
│   ├── page.tsx               # Alerts list
│   ├── [id]/
│   │   ├── page.tsx           # Alert details
│   │   └── edit/
│   │       └── page.tsx       # Edit alert
│   └── create/
│       └── page.tsx           # Create alert
├── dashboard/
│   └── page.tsx               # Dashboard page
└── reports/
    └── page.tsx               # Reports page

apps/web/components/performance-monitoring/
├── PerformanceMonitoringHub.tsx      # Main hub component
├── PerformanceMonitoringMetrics.tsx  # Metrics component
├── PerformanceMonitoringMetricCard.tsx # Metric card
├── PerformanceMonitoringMetricForm.tsx # Metric form
├── PerformanceMonitoringAlerts.tsx # Alerts component
├── PerformanceMonitoringAlertCard.tsx # Alert card
├── PerformanceMonitoringAlertForm.tsx # Alert form
├── PerformanceMonitoringDashboard.tsx # Dashboard component
├── PerformanceMonitoringReports.tsx # Reports component
├── PerformanceMonitoringFilters.tsx  # Filter component
└── PerformanceMonitoringActions.tsx  # Action buttons

apps/web/hooks/performance-monitoring/
├── usePerformanceMonitoringMetrics.ts # Metrics hook
├── usePerformanceMonitoringMetricDetail.ts # Metric detail hook
├── usePerformanceMonitoringMetricCreate.ts # Metric create hook
├── usePerformanceMonitoringMetricUpdate.ts # Metric update hook
├── usePerformanceMonitoringMetricDelete.ts # Metric delete hook
├── usePerformanceMonitoringMetricCollect.ts # Metric collect hook
├── usePerformanceMonitoringMetricExport.ts # Metric export hook
├── usePerformanceMonitoringAlerts.ts # Alerts hook
├── usePerformanceMonitoringAlertDetail.ts # Alert detail hook
├── usePerformanceMonitoringAlertCreate.ts # Alert create hook
├── usePerformanceMonitoringAlertUpdate.ts # Alert update hook
├── usePerformanceMonitoringAlertDelete.ts # Alert delete hook
├── usePerformanceMonitoringAlertTrigger.ts # Alert trigger hook
├── usePerformanceMonitoringDashboard.ts # Dashboard hook
└── usePerformanceMonitoringReports.ts # Reports hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages (data fetching)
- **Client Components**: Forms, interactive elements, modals
- **Feature Flag**: `flags.m98_performance_monitoring = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose             | Variant                    |
| ----------- | ------------------- | -------------------------- |
| `DataTable` | List metrics/alerts | With filters, pagination   |
| `Card`      | Metric details      | With actions               |
| `Form`      | Create/edit forms   | With validation            |
| `Button`    | Actions             | Primary, secondary, danger |
| `Modal`     | Confirmations       | With backdrop              |
| `Tabs`      | Metric tabs         | With content               |
| `Progress`  | Metric progress     | With status                |

### Design Tokens

```typescript
// Performance-specific colors
const performanceColors = {
  cpu: "hsl(var(--cpu))",
  memory: "hsl(var(--memory))",
  disk: "hsl(var(--disk))",
  network: "hsl(var(--network))",
  database: "hsl(var(--database))",
};

// Metric status colors
const metricStatusColors = {
  healthy: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  critical: "bg-red-100 text-red-800",
  unknown: "bg-gray-100 text-gray-800",
  collecting: "bg-blue-100 text-blue-800",
  paused: "bg-gray-100 text-gray-800",
};

// Alert status colors
const alertStatusColors = {
  active: "bg-red-100 text-red-800",
  resolved: "bg-green-100 text-green-800",
  acknowledged: "bg-yellow-100 text-yellow-800",
  suppressed: "bg-gray-100 text-gray-800",
};
```

### Theme Support

- **Dark Mode**: Default theme
- **Light Mode**: Available via theme toggle
- **High Contrast**: WCAG AAA compliance
- **Performance Themes**: Status-based themes

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  metrics: ["performance-monitoring", "metrics"] as const,
  metric: (id: string) => ["performance-monitoring", "metric", id] as const,
  alerts: ["performance-monitoring", "alerts"] as const,
  alert: (id: string) => ["performance-monitoring", "alert", id] as const,
  dashboard: ["performance-monitoring", "dashboard"] as const,
  reports: ["performance-monitoring", "reports"] as const,
};
```

### Cache Configuration

| Query Type | Stale Time | Cache Time | Invalidation            |
| ---------- | ---------- | ---------- | ----------------------- |
| Metrics    | 1 minute   | 5 minutes  | On create/update/delete |
| Metric     | 30 seconds | 2 minutes  | On update/delete        |
| Alerts     | 30 seconds | 2 minutes  | On create/update/delete |
| Alert      | 30 seconds | 2 minutes  | On update/delete        |
| Dashboard  | 30 seconds | 2 minutes  | On metric change        |
| Reports    | 5 minutes  | 15 minutes | On metric change        |

### Invalidation Rules

```typescript
// After creating metric
queryClient.invalidateQueries({
  queryKey: ["performance-monitoring", "metrics"],
});
queryClient.invalidateQueries({
  queryKey: ["performance-monitoring", "dashboard"],
});

// After updating metric
queryClient.invalidateQueries({
  queryKey: ["performance-monitoring", "metric", id],
});
queryClient.invalidateQueries({
  queryKey: ["performance-monitoring", "metrics"],
});

// After triggering alert
queryClient.invalidateQueries({
  queryKey: ["performance-monitoring", "alert", id],
});
queryClient.invalidateQueries({
  queryKey: ["performance-monitoring", "alerts"],
});
```

---

## 🎭 User Experience

### User Flows

#### 1. Create Metric

1. User navigates to performance monitoring page
2. User clicks "Create Metric" button
3. System opens metric creation form
4. User selects metric type
5. User sets metric parameters
6. User configures collection settings
7. User submits metric

#### 2. Create Alert

1. User navigates to alerts page
2. User clicks "Create Alert" button
3. System opens alert creation form
4. User defines alert conditions
5. User sets alert thresholds
6. User configures alert settings
7. User saves alert

#### 3. View Dashboard

1. User navigates to dashboard page
2. System loads performance dashboard
3. User views real-time metrics
4. User interacts with charts
5. User drills down into details
6. User exports dashboard data

### UI States

| State          | Component                         | Message                        |
| -------------- | --------------------------------- | ------------------------------ |
| **Empty**      | `PerformanceMonitoringEmptyState` | "No metrics found"             |
| **Loading**    | `PerformanceMonitoringSkeleton`   | Loading skeleton               |
| **Error**      | `PerformanceMonitoringErrorState` | "Failed to load metrics"       |
| **No Results** | `PerformanceMonitoringNoResults`  | "No metrics match your search" |

### Interactions

- **Hover**: Card elevation, button color change
- **Focus**: Clear focus ring, keyboard navigation
- **Click**: Immediate feedback, loading state
- **Form Validation**: Inline errors, real-time validation
- **Progress**: Metric collection progress, status updates

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
| `Ctrl/Cmd + M` | Create metric      |
| `Ctrl/Cmd + A` | Create alert       |
| `Ctrl/Cmd + D` | View dashboard     |
| `Ctrl/Cmd + R` | Refresh metrics    |
| `Escape`       | Close modal/dialog |
| `Enter`        | Submit form        |

### ARIA Implementation

```typescript
// Metric list
<table role="table" aria-label="Metric list">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" aria-sort="none">Metric Name</th>
      <th role="columnheader" aria-sort="none">Type</th>
      <th role="columnheader" aria-sort="none">Status</th>
      <th role="columnheader" aria-sort="none">Value</th>
    </tr>
  </thead>
</table>

// Metric form
<form role="form" aria-label="Create Metric">
  <input
    aria-describedby="name-error"
    aria-invalid="false"
    aria-label="Metric Name"
  />
  <div id="name-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("PerformanceMonitoringMetrics", () => {
  it("renders list of metrics", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles search functionality", () => {});
});

// Hook tests
describe("usePerformanceMonitoringMetricCreate", () => {
  it("creates metric successfully", () => {});
  it("handles creation errors", () => {});
  it("validates metric data", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Performance Monitoring API Integration", () => {
  it("creates metric successfully", () => {});
  it("collects metric data successfully", () => {});
  it("triggers alert successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Performance Monitoring E2E", () => {
  it("complete metric creation flow", () => {});
  it("complete alert creation flow", () => {});
  it("complete dashboard functionality", () => {});
  it("performance monitoring reports functionality", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("Performance Monitoring Accessibility", () => {
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
const PerformanceMonitoringMetricForm = lazy(
  () => import("./components/PerformanceMonitoringMetricForm")
);
const PerformanceMonitoringDashboard = lazy(
  () => import("./components/PerformanceMonitoringDashboard")
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
mkdir -p apps/web/app/(dashboard)/performance-monitoring
mkdir -p apps/web/components/performance-monitoring
mkdir -p apps/web/hooks/performance-monitoring

# Create feature flag
echo 'flags.m98_performance_monitoring = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/performance-monitoring/PerformanceMonitoringMetrics.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { usePerformanceMonitoringMetrics } from "@/hooks/performance-monitoring/usePerformanceMonitoringMetrics";

export function PerformanceMonitoringMetrics() {
  const { data, isLoading, error } = usePerformanceMonitoringMetrics();

  if (isLoading) return <PerformanceMonitoringSkeleton />;
  if (error) return <PerformanceMonitoringErrorState />;
  if (!data?.length) return <PerformanceMonitoringEmptyState />;

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="metricName"
      filters={filters}
    />
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/performance-monitoring/usePerformanceMonitoringMetrics.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function usePerformanceMonitoringMetrics(
  filters?: PerformanceMonitoringFilters
) {
  return useQuery({
    queryKey: ["performance-monitoring", "metrics", filters],
    queryFn: () => api.performanceMonitoring.metrics.list(filters),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/performance-monitoring/page.tsx
import { PerformanceMonitoringHub } from "@/components/performance-monitoring/PerformanceMonitoringHub";
import { PerformanceMonitoringQuickActions } from "@/components/performance-monitoring/PerformanceMonitoringQuickActions";

export default function PerformanceMonitoringPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Performance Monitoring</h1>
        <PerformanceMonitoringQuickActions />
      </div>
      <PerformanceMonitoringHub />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/performance-monitoring/__tests__/PerformanceMonitoringMetrics.test.tsx
import { render, screen } from "@testing-library/react";
import { PerformanceMonitoringMetrics } from "@/components/performance-monitoring/PerformanceMonitoringMetrics";

describe("PerformanceMonitoringMetrics", () => {
  it("renders list of metrics", () => {
    render(<PerformanceMonitoringMetrics />);
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
  m98_performance_monitoring: false, // Default: disabled
};

// Usage in components
if (flags.m98_performance_monitoring) {
  return <PerformanceMonitoringMetrics />;
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

1. **Set feature flag**: `flags.m98_performance_monitoring = false`
2. **Invalidate cache**: `revalidateTag('performance-monitoring')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Metric management functional
- [ ] Alert management working
- [ ] Dashboard functional
- [ ] Reports working
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

**Ready to implement Performance Monitoring UI! 🚀**
