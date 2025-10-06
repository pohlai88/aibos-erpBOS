# 🎯 M89: Master Dashboard - UI Implementation Runbook

**Module ID**: M89  
**Module Name**: Master Dashboard  
**Priority**: 🚨 CRITICAL  
**Phase**: Phase 16 - Infrastructure Modernization  
**Estimated Effort**: 2 days  
**Last Updated**: 2025-10-06

**Status**: 🔄 HYBRID - Enhance M69-MASTER-DASHBOARD

---

## 📋 Module Overview

### Business Value

Master Dashboard provides **comprehensive business intelligence and analytics** for businesses requiring organized data visualization and key performance indicators.

**Key Benefits**:

- Centralized business intelligence dashboard
- Real-time KPI monitoring and alerts
- Customizable dashboard widgets
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

**Master Dashboard Operations** (15 endpoints):

- ✅ `/api/dashboard/kpis` - Get KPI data
- ✅ `/api/dashboard/kpis/[id]` - Get specific KPI details
- ✅ `/api/dashboard/kpis/create` - Create custom KPI
- ✅ `/api/dashboard/kpis/[id]/update` - Update KPI
- ✅ `/api/dashboard/kpis/[id]/delete` - Delete KPI
- ✅ `/api/dashboard/widgets` - Get dashboard widgets
- ✅ `/api/dashboard/widgets/[id]` - Get widget details
- ✅ `/api/dashboard/widgets/create` - Create widget
- ✅ `/api/dashboard/widgets/[id]/update` - Update widget
- ✅ `/api/dashboard/widgets/[id]/delete` - Delete widget
- ✅ `/api/dashboard/layout` - Get dashboard layout
- ✅ `/api/dashboard/layout/update` - Update layout
- ✅ `/api/dashboard/alerts` - Get dashboard alerts
- ✅ `/api/dashboard/analytics` - Get dashboard analytics
- ✅ `/api/dashboard/export` - Export dashboard data

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                       | Page Component              | Purpose             |
| --------------------------- | --------------------------- | ------------------- |
| `/dashboard`                | `MasterDashboardPage`       | Main dashboard      |
| `/dashboard/kpis`           | `DashboardKPIsPage`         | KPI management      |
| `/dashboard/kpis/[id]`      | `DashboardKPIDetailPage`    | View KPI details    |
| `/dashboard/kpis/create`    | `DashboardKPICreatePage`    | Create KPI          |
| `/dashboard/widgets`        | `DashboardWidgetsPage`      | Widget management   |
| `/dashboard/widgets/[id]`   | `DashboardWidgetDetailPage` | View widget details |
| `/dashboard/widgets/create` | `DashboardWidgetCreatePage` | Create widget       |
| `/dashboard/layout`         | `DashboardLayoutPage`       | Layout management   |
| `/dashboard/alerts`         | `DashboardAlertsPage`       | Dashboard alerts    |
| `/dashboard/analytics`      | `DashboardAnalyticsPage`    | Dashboard analytics |

### Component Structure

```
apps/web/app/(dashboard)/
├── page.tsx                    # Main dashboard
├── kpis/
│   ├── page.tsx               # KPIs list
│   ├── [id]/
│   │   └── page.tsx           # KPI details
│   └── create/
│       └── page.tsx           # Create KPI
├── widgets/
│   ├── page.tsx               # Widgets list
│   ├── [id]/
│   │   └── page.tsx           # Widget details
│   └── create/
│       └── page.tsx           # Create widget
├── layout/
│   └── page.tsx               # Layout management
├── alerts/
│   └── page.tsx               # Alerts page
└── analytics/
    └── page.tsx               # Analytics page

apps/web/components/dashboard/
├── MasterDashboard.tsx        # Main dashboard component
├── DashboardKPIs.tsx          # KPIs component
├── DashboardKPI.tsx           # KPI component
├── DashboardKPIForm.tsx       # KPI form
├── DashboardWidgets.tsx       # Widgets component
├── DashboardWidget.tsx        # Widget component
├── DashboardWidgetForm.tsx    # Widget form
├── DashboardLayout.tsx        # Layout component
├── DashboardAlerts.tsx        # Alerts component
├── DashboardAnalytics.tsx     # Analytics component
├── DashboardFilters.tsx       # Filter component
└── DashboardActions.tsx       # Action buttons

apps/web/hooks/dashboard/
├── useDashboardKPIs.ts        # KPIs hook
├── useDashboardKPIDetail.ts   # KPI detail hook
├── useDashboardKPICreate.ts   # KPI create hook
├── useDashboardKPIUpdate.ts   # KPI update hook
├── useDashboardWidgets.ts     # Widgets hook
├── useDashboardWidgetDetail.ts # Widget detail hook
├── useDashboardWidgetCreate.ts # Widget create hook
├── useDashboardWidgetUpdate.ts # Widget update hook
├── useDashboardLayout.ts      # Layout hook
├── useDashboardAlerts.ts      # Alerts hook
└── useDashboardAnalytics.ts   # Analytics hook
```

### Server/Client Boundaries

- **Server Components**: Main dashboard, KPI pages (data fetching)
- **Client Components**: Interactive widgets, forms, modals
- **Feature Flag**: `flags.m89_master_dashboard = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose            | Variant                    |
| ----------- | ------------------ | -------------------------- |
| `Dashboard` | Main dashboard     | With widgets, customizable |
| `Card`      | KPI details        | With actions               |
| `Form`      | Create/edit forms  | With validation            |
| `Button`    | Actions            | Primary, secondary, danger |
| `Modal`     | Confirmations      | With backdrop              |
| `Chart`     | Data visualization | With metrics               |
| `Widget`    | Dashboard widgets  | Draggable, resizable       |

### Design Tokens

```typescript
// Dashboard-specific colors
const dashboardColors = {
  primary: "hsl(var(--dashboard-primary))",
  secondary: "hsl(var(--dashboard-secondary))",
  success: "hsl(var(--dashboard-success))",
  warning: "hsl(var(--dashboard-warning))",
  error: "hsl(var(--dashboard-error))",
  info: "hsl(var(--dashboard-info))",
};

// KPI status colors
const kpiStatusColors = {
  good: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  critical: "bg-red-100 text-red-800",
  neutral: "bg-gray-100 text-gray-800",
};

// Widget type colors
const widgetTypeColors = {
  chart: "hsl(var(--widget-chart))",
  table: "hsl(var(--widget-table))",
  metric: "hsl(var(--widget-metric))",
  alert: "hsl(var(--widget-alert))",
  text: "hsl(var(--widget-text))",
  image: "hsl(var(--widget-image))",
};
```

### Theme Support

- **Dark Mode**: Default theme
- **Light Mode**: Available via theme toggle
- **High Contrast**: WCAG AAA compliance
- **Dashboard Themes**: Customizable themes

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  kpis: ["dashboard", "kpis"] as const,
  kpi: (id: string) => ["dashboard", "kpi", id] as const,
  widgets: ["dashboard", "widgets"] as const,
  widget: (id: string) => ["dashboard", "widget", id] as const,
  layout: ["dashboard", "layout"] as const,
  alerts: ["dashboard", "alerts"] as const,
  analytics: ["dashboard", "analytics"] as const,
};
```

### Cache Configuration

| Query Type | Stale Time | Cache Time | Invalidation        |
| ---------- | ---------- | ---------- | ------------------- |
| KPIs       | 5 minutes  | 10 minutes | On KPI change       |
| KPI        | 10 minutes | 30 minutes | On KPI update       |
| Widgets    | 5 minutes  | 15 minutes | On widget change    |
| Widget     | 10 minutes | 30 minutes | On widget update    |
| Layout     | 15 minutes | 45 minutes | On layout change    |
| Alerts     | 1 minute   | 5 minutes  | On alert update     |
| Analytics  | 15 minutes | 45 minutes | On analytics change |

### Invalidation Rules

```typescript
// After creating KPI
queryClient.invalidateQueries({ queryKey: ["dashboard", "kpis"] });
queryClient.invalidateQueries({ queryKey: ["dashboard", "analytics"] });

// After updating KPI
queryClient.invalidateQueries({ queryKey: ["dashboard", "kpi", id] });
queryClient.invalidateQueries({ queryKey: ["dashboard", "kpis"] });

// After creating widget
queryClient.invalidateQueries({ queryKey: ["dashboard", "widgets"] });
queryClient.invalidateQueries({ queryKey: ["dashboard", "layout"] });
```

---

## 🎭 User Experience

### User Flows

#### 1. View Master Dashboard

1. User navigates to main dashboard
2. System loads dashboard layout
3. System displays KPI widgets
4. System shows real-time data
5. User can interact with widgets
6. User can customize layout

#### 2. Create Custom KPI

1. User navigates to KPIs page
2. User clicks "Create KPI" button
3. System opens KPI creation form
4. User defines KPI metrics
5. User sets KPI thresholds
6. User configures KPI display
7. User saves KPI

#### 3. Customize Dashboard Layout

1. User navigates to layout page
2. User sees current dashboard layout
3. User can drag and drop widgets
4. User can resize widgets
5. User can add/remove widgets
6. User saves layout changes

### UI States

| State          | Component             | Message                         |
| -------------- | --------------------- | ------------------------------- |
| **Empty**      | `DashboardEmptyState` | "No dashboard data available"   |
| **Loading**    | `DashboardSkeleton`   | Loading skeleton                |
| **Error**      | `DashboardErrorState` | "Failed to load dashboard data" |
| **No Results** | `DashboardNoResults`  | "No data matches your criteria" |

### Interactions

- **Hover**: Widget elevation, button color change
- **Focus**: Clear focus ring, keyboard navigation
- **Click**: Immediate feedback, loading state
- **Drag**: Widget reordering, visual feedback
- **Resize**: Widget resizing, visual feedback
- **Form Validation**: Inline errors, real-time validation

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
| `Ctrl/Cmd + K` | Create new KPI     |
| `Ctrl/Cmd + W` | Create new widget  |
| `Ctrl/Cmd + L` | Customize layout   |
| `Ctrl/Cmd + R` | Refresh dashboard  |
| `Escape`       | Close modal/dialog |
| `Enter`        | Submit form        |

### ARIA Implementation

```typescript
// Dashboard
<div role="application" aria-label="Master Dashboard">
  <div role="region" aria-label="KPI Widgets">
    <div role="button" aria-label="Revenue KPI" tabIndex={0}>
      <h3>Revenue</h3>
      <p aria-live="polite">$1,234,567</p>
    </div>
  </div>
</div>

// KPI form
<form role="form" aria-label="Create KPI">
  <input
    aria-describedby="name-error"
    aria-invalid="false"
    aria-label="KPI Name"
  />
  <div id="name-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("MasterDashboard", () => {
  it("renders dashboard with widgets", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles widget interactions", () => {});
});

// Hook tests
describe("useDashboardKPIs", () => {
  it("fetches KPI data successfully", () => {});
  it("handles KPI creation", () => {});
  it("handles KPI updates", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Dashboard API Integration", () => {
  it("loads dashboard data successfully", () => {});
  it("creates KPI successfully", () => {});
  it("creates widget successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Master Dashboard E2E", () => {
  it("complete dashboard view flow", () => {});
  it("complete KPI creation flow", () => {});
  it("complete widget creation flow", () => {});
  it("complete layout customization flow", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("Master Dashboard Accessibility", () => {
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
- **Optimization**: Code splitting, lazy loading, widget optimization

### Loading Performance

- **TTFB**: ≤70ms (Time to First Byte)
- **TTI**: ≤200ms (Time to Interactive)
- **LCP**: ≤2.5s (Largest Contentful Paint)

### Optimization Strategies

```typescript
// Lazy loading
const MasterDashboard = lazy(() => import("./components/MasterDashboard"));
const DashboardKPIs = lazy(() => import("./components/DashboardKPIs"));

// Widget lazy loading
const ChartWidget = lazy(() => import("./components/ChartWidget"));
const TableWidget = lazy(() => import("./components/TableWidget"));

// Virtual scrolling for large lists
import { FixedSizeList as List } from "react-window";
```

---

## 🚀 Implementation Guide

### Step 1: Setup

```bash
# Create directory structure
mkdir -p apps/web/app/(dashboard)
mkdir -p apps/web/components/dashboard
mkdir -p apps/web/hooks/dashboard

# Create feature flag
echo 'flags.m89_master_dashboard = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/dashboard/MasterDashboard.tsx
"use client";

import { Dashboard } from "@/components/ui/dashboard";
import { useDashboardKPIs } from "@/hooks/dashboard/useDashboardKPIs";
import { useDashboardWidgets } from "@/hooks/dashboard/useDashboardWidgets";

export function MasterDashboard() {
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();
  const { data: widgets, isLoading: widgetsLoading } = useDashboardWidgets();

  if (kpisLoading || widgetsLoading) return <DashboardSkeleton />;

  return (
    <Dashboard
      kpis={kpis}
      widgets={widgets}
      onLayoutChange={handleLayoutChange}
    />
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/dashboard/useDashboardKPIs.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useDashboardKPIs() {
  return useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: () => api.dashboard.kpis.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/page.tsx
import { MasterDashboard } from "@/components/dashboard/MasterDashboard";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Master Dashboard</h1>
        <DashboardQuickActions />
      </div>
      <MasterDashboard />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/__tests__/MasterDashboard.test.tsx
import { render, screen } from "@testing-library/react";
import { MasterDashboard } from "@/components/dashboard/MasterDashboard";

describe("MasterDashboard", () => {
  it("renders master dashboard", () => {
    render(<MasterDashboard />);
    expect(
      screen.getByRole("application", { name: /master dashboard/i })
    ).toBeInTheDocument();
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
  m89_master_dashboard: false, // Default: disabled
};

// Usage in components
if (flags.m89_master_dashboard) {
  return <MasterDashboard />;
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

1. **Set feature flag**: `flags.m89_master_dashboard = false`
2. **Invalidate cache**: `revalidateTag('dashboard')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] KPI management functional
- [ ] Widget management working
- [ ] Dashboard layout functional
- [ ] Dashboard alerts working
- [ ] Dashboard analytics functional
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

**Ready to implement Master Dashboard UI! 🚀**
