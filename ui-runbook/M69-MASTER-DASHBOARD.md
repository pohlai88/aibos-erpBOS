# 🎯 M69: Master Dashboard (Kernel Dashboard) - UI Implementation Runbook

**Module ID**: M69  
**Module Name**: Master Dashboard (Kernel Dashboard)  
**Priority**: 🔥 CRITICAL  
**Phase**: Phase 14 - User Experience  
**Estimated Effort**: 4 days  
**Last Updated**: 2025-10-06

**Status**: 🔄 HYBRID - Enhance M30-CLOSE-INSIGHTS

---

## 📋 Module Overview

Master Dashboard provides **executive overview**, **key metrics**, **real-time insights**, and **customizable widgets** for business leaders requiring **comprehensive business visibility** and **decision support**.

### Business Value

**Key Benefits**:

- **Executive Overview**: Complete business snapshot
- **Key Metrics**: Real-time KPIs and metrics
- **Customizable Widgets**: Personalized dashboard
- **Drill-Down Analytics**: Detailed insights on demand

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status     | Details                                      |
| ------------- | ---------- | -------------------------------------------- |
| **Database**  | 🔄 PARTIAL | Close insights exist, needs master dashboard |
| **Services**  | 🔄 PARTIAL | Insights services exist                      |
| **API**       | 🔄 PARTIAL | Insights APIs exist                          |
| **Contracts** | 🔄 PARTIAL | Insights types exist, needs dashboard        |

### API Endpoints

**Master Dashboard Operations** (8 endpoints):

- 🔄 `/api/dashboard/metrics` - Get key metrics (enhance existing)
- 🔄 `/api/dashboard/insights` - Get business insights (enhance existing)
- 🔄 `/api/dashboard/widgets` - Get dashboard widgets (enhance existing)
- 🔄 `/api/dashboard/customize` - Customize dashboard (enhance existing)
- ❌ `/api/dashboard/executive` - Executive summary
- ❌ `/api/dashboard/realtime` - Real-time updates
- ❌ `/api/dashboard/alerts` - Dashboard alerts
- ❌ `/api/dashboard/export` - Export dashboard

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                  | Page Component           | Purpose             |
| ---------------------- | ------------------------ | ------------------- |
| `/dashboard`           | `MasterDashboardPage`    | Master dashboard    |
| `/dashboard/customize` | `DashboardCustomizePage` | Customize dashboard |
| `/dashboard/widgets`   | `DashboardWidgetsPage`   | Manage widgets      |
| `/dashboard/export`    | `DashboardExportPage`    | Export dashboard    |

### Component Structure

```
apps/web/app/(dashboard)/dashboard/
├── page.tsx                    # Master dashboard
├── customize/
│   └── page.tsx               # Customize dashboard
├── widgets/
│   └── page.tsx               # Manage widgets
└── export/
    └── page.tsx               # Export dashboard

apps/web/components/dashboard/
├── MasterDashboard.tsx        # Master dashboard
├── DashboardWidget.tsx        # Dashboard widget
├── MetricsWidget.tsx         # Metrics widget
├── ChartWidget.tsx           # Chart widget
├── TableWidget.tsx           # Table widget
├── ExecutiveSummary.tsx     # Executive summary
└── RealtimeUpdates.tsx      # Real-time updates

apps/web/hooks/dashboard/
├── useMasterDashboard.ts     # Master dashboard hook
├── useDashboardWidgets.ts    # Dashboard widgets hook
├── useRealtimeUpdates.ts     # Real-time updates hook
└── useDashboardCustomization.ts # Customization hook
```

### Server/Client Boundaries

- **Server Components**: Dashboard pages, executive summary (data fetching)
- **Client Components**: Widgets, interactive elements, real-time updates
- **Feature Flag**: `flags.m69_master_dashboard = false`

---

## 🎨 Design System

### Components Used

| Component | Purpose              | Variant                    |
| --------- | -------------------- | -------------------------- |
| `Card`    | Dashboard widgets    | With actions               |
| `Chart`   | Data visualization   | Line, bar, pie, area       |
| `Table`   | Data tables          | With sorting, filtering    |
| `Button`  | Actions              | Primary, secondary, danger |
| `Modal`   | Widget customization | With backdrop              |

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
  masterDashboard: ["dashboard", "master"] as const,
  dashboardWidgets: ["dashboard", "widgets"] as const,
  dashboardMetrics: ["dashboard", "metrics"] as const,
  dashboardInsights: ["dashboard", "insights"] as const,
  realtimeUpdates: ["dashboard", "realtime"] as const,
};
```

### Cache Configuration

| Query Type        | Stale Time | Cache Time | Invalidation       |
| ----------------- | ---------- | ---------- | ------------------ |
| Master Dashboard  | 30 seconds | 2 minutes  | On any data change |
| Dashboard Widgets | 5 minutes  | 15 minutes | On widget change   |
| Dashboard Metrics | 1 minute   | 5 minutes  | On metric update   |
| Real-time Updates | 10 seconds | 30 seconds | Continuous updates |

### Invalidation Rules

```typescript
// After updating dashboard
queryClient.invalidateQueries({ queryKey: ["dashboard", "master"] });
queryClient.invalidateQueries({ queryKey: ["dashboard", "widgets"] });

// After updating metrics
queryClient.invalidateQueries({ queryKey: ["dashboard", "metrics"] });
queryClient.invalidateQueries({ queryKey: ["dashboard", "master"] });

// After customizing dashboard
queryClient.invalidateQueries({ queryKey: ["dashboard", "widgets"] });
queryClient.invalidateQueries({ queryKey: ["dashboard", "master"] });
```

---

## 🎭 User Experience

### User Flows

#### 1. Master Dashboard

1. User navigates to `/dashboard`
2. System loads master dashboard with widgets
3. User can view key metrics and insights
4. User can customize dashboard layout

#### 2. Customize Dashboard

1. User clicks "Customize Dashboard" button
2. System opens customization modal
3. User can add/remove/reorder widgets
4. User saves changes
5. System updates dashboard layout

#### 3. View Widget Details

1. User clicks on a widget
2. System opens detailed view
3. User can drill down into specific metrics
4. User can export data or view trends

### UI States

| State       | Component             | Message                    |
| ----------- | --------------------- | -------------------------- |
| **Empty**   | `DashboardEmptyState` | "No widgets configured"    |
| **Loading** | `DashboardSkeleton`   | Loading skeleton           |
| **Error**   | `DashboardErrorState` | "Failed to load dashboard" |
| **No Data** | `DashboardNoData`     | "No data available"        |

### Interactions

- **Hover**: Widget elevation, button color change
- **Focus**: Clear focus ring, keyboard navigation
- **Click**: Immediate feedback, loading state
- **Drag & Drop**: Widget reordering, visual feedback

---

## 🚀 Implementation Guide

### Step 1: Enhance M30-CLOSE-INSIGHTS

```bash
# Enhance existing close insights module
# Add master dashboard functionality
# Add widget system
# Add real-time updates
```

### Step 2: Create Components

```typescript
// apps/web/components/dashboard/MasterDashboard.tsx
"use client";

import { Card } from "@/components/ui/card";
import { useMasterDashboard } from "@/hooks/dashboard/useMasterDashboard";

export function MasterDashboard() {
  const { data, isLoading, error } = useMasterDashboard();

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <DashboardErrorState />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.widgets.map((widget) => (
        <DashboardWidget key={widget.id} widget={widget} />
      ))}
    </div>
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/dashboard/useMasterDashboard.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useMasterDashboard() {
  return useQuery({
    queryKey: ["dashboard", "master"],
    queryFn: () => api.dashboard.getMasterDashboard(),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCustomizeDashboard() {
  return useMutation({
    mutationFn: (data: DashboardCustomizationData) =>
      api.dashboard.customize(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "master"],
      });
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "widgets"],
      });
    },
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/dashboard/page.tsx
import { MasterDashboard } from "@/components/dashboard/MasterDashboard";
import { ExecutiveSummary } from "@/components/dashboard/ExecutiveSummary";

export default function MasterDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Master Dashboard</h1>
        <CustomizeDashboardButton />
      </div>
      <ExecutiveSummary />
      <MasterDashboard />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/dashboard/__tests__/MasterDashboard.test.tsx
import { render, screen } from "@testing-library/react";
import { MasterDashboard } from "@/components/dashboard/MasterDashboard";

describe("MasterDashboard", () => {
  it("renders master dashboard", () => {
    render(<MasterDashboard />);
    expect(screen.getByRole("main")).toBeInTheDocument();
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

| Shortcut       | Action              |
| -------------- | ------------------- |
| `Ctrl/Cmd + C` | Customize dashboard |
| `Ctrl/Cmd + R` | Refresh dashboard   |
| `Escape`       | Close modal/dialog  |
| `Tab`          | Navigate widgets    |

### ARIA Implementation

```typescript
// Master dashboard
<main role="main" aria-label="Master dashboard">
  <div role="region" aria-label="Dashboard widgets">
    <h2>Key Metrics</h2>
    <div role="group" aria-label="Metrics widgets">
      <DashboardWidget widget={widget} />
    </div>
  </div>
</main>

// Widget
<div role="region" aria-label={widget.title}>
  <h3>{widget.title}</h3>
  <div aria-live="polite">{widget.content}</div>
</div>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("MasterDashboard", () => {
  it("renders master dashboard", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("displays widgets correctly", () => {});
});

// Hook tests
describe("useMasterDashboard", () => {
  it("fetches dashboard data", () => {});
  it("handles real-time updates", () => {});
  it("handles errors", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Master Dashboard API Integration", () => {
  it("loads dashboard successfully", () => {});
  it("customizes dashboard successfully", () => {});
  it("handles real-time updates correctly", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Master Dashboard E2E", () => {
  it("complete dashboard view flow", () => {});
  it("complete customization flow", () => {});
  it("widget interaction flow", () => {});
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
const DashboardCustomizePage = lazy(() => import("./customize/page"));

// Code splitting
const ChartWidget = lazy(() => import("./components/ChartWidget"));

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
  m69_master_dashboard: false, // Default: disabled
};

// Usage in components
if (flags.m69_master_dashboard) {
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

1. **Set feature flag**: `flags.m69_master_dashboard = false`
2. **Invalidate cache**: `revalidateTag('dashboard')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All dashboard widgets working
- [ ] Real-time updates functional
- [ ] Dashboard customization functional
- [ ] Executive summary functional
- [ ] Widget interactions working
- [ ] Export functionality working
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
