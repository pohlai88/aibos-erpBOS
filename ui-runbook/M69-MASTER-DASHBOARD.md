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

**Master Dashboard** (Enhancement needed):

- 🔄 `/api/close/board` - Enhance with master dashboard fields
- ❌ `/api/dashboard/master` - Master dashboard data
- ❌ `/api/dashboard/widgets` - Widget configuration
- ❌ `/api/dashboard/metrics` - Real-time metrics
- ❌ `/api/dashboard/alerts` - Dashboard alerts

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                  | Page Component        | Purpose             |
| ---------------------- | --------------------- | ------------------- |
| `/dashboard`           | `MasterDashboardPage` | Master dashboard    |
| `/dashboard/customize` | `CustomizePage`       | Customize dashboard |
| `/dashboard/widgets`   | `WidgetsPage`         | Widget library      |

### Component Structure

```
apps/web/app/(dashboard)/dashboard/
├── page.tsx                    # Master dashboard page
├── customize/
│   └── page.tsx                # Customize page
└── widgets/
    └── page.tsx                # Widgets library page

apps/web/components/dashboard/
├── MasterDashboard.tsx         # Master dashboard
├── DashboardWidget.tsx         # Widget component
├── WidgetLibrary.tsx           # Widget library
├── MetricsCard.tsx             # Metrics card
├── AlertsPanel.tsx             # Alerts panel
└── CustomizeDashboard.tsx      # Customize UI

apps/web/hooks/dashboard/
├── useMasterDashboard.ts       # Master dashboard hook
├── useWidgets.ts               # Widgets hook
├── useMetrics.ts               # Metrics hook
└── useAlerts.ts                # Alerts hook
```

### Server/Client Boundaries

- **Server Components**: Dashboard layout, static widgets
- **Client Components**: Interactive widgets, customization, real-time updates
- **Feature Flag**: `flags.m69_master_dashboard = false`

---

## 🎨 Design System

### Components Used

| Component | Purpose               | Variant                 |
| --------- | --------------------- | ----------------------- |
| `Grid`    | Dashboard layout      | Responsive grid         |
| `Card`    | Widget container      | With actions            |
| `Chart`   | Metrics visualization | Line, bar, pie, gauge   |
| `Table`   | Data tables           | With sorting, filtering |
| `Badge`   | Status indicators     | With colors             |
| `Alert`   | Dashboard alerts      | With severity           |

### Design Tokens

```typescript
// Dashboard specific colors
const dashboardColors = {
  primary: "hsl(var(--dashboard-primary))",
  secondary: "hsl(var(--dashboard-secondary))",
  success: "hsl(var(--dashboard-success))",
  warning: "hsl(var(--dashboard-warning))",
  danger: "hsl(var(--dashboard-danger))",
};

// Widget type colors
const widgetTypeColors = {
  metrics: "bg-blue-100 text-blue-800",
  chart: "bg-green-100 text-green-800",
  table: "bg-purple-100 text-purple-800",
  alert: "bg-red-100 text-red-800",
};
```

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  masterDashboard: ["dashboard", "master"] as const,
  widgets: ["dashboard", "widgets"] as const,
  metrics: ["dashboard", "metrics"] as const,
  alerts: ["dashboard", "alerts"] as const,
};
```

### Cache Configuration

| Query Type       | Stale Time | Cache Time | Invalidation     |
| ---------------- | ---------- | ---------- | ---------------- |
| Master Dashboard | 2 minutes  | 10 minutes | On data change   |
| Widgets          | 10 minutes | 30 minutes | On widget update |
| Metrics          | 1 minute   | 5 minutes  | On metric update |
| Alerts           | 30 seconds | 5 minutes  | On alert trigger |

---

## 🚀 Implementation Guide

### Step 1: Enhance M30-CLOSE-INSIGHTS

```bash
# Enhance existing close insights module
# Add master dashboard
# Add customizable widgets
# Add real-time metrics
```

### Step 2: Create Components

```typescript
// apps/web/components/dashboard/MasterDashboard.tsx
"use client";

import { Grid } from "@/components/ui/grid";
import { DashboardWidget } from "./DashboardWidget";
import { useMasterDashboard } from "@/hooks/dashboard/useMasterDashboard";

export function MasterDashboard() {
  const { data, isLoading, error } = useMasterDashboard();

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <DashboardErrorState />;

  return (
    <Grid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.widgets.map((widget) => (
        <DashboardWidget key={widget.id} widget={widget} />
      ))}
    </Grid>
  );
}
```

### Step 3: Widget System

```typescript
// apps/web/components/dashboard/DashboardWidget.tsx
"use client";

import { Card } from "@/components/ui/card";
import { MetricsWidget } from "./widgets/MetricsWidget";
import { ChartWidget } from "./widgets/ChartWidget";
import { TableWidget } from "./widgets/TableWidget";

export function DashboardWidget({ widget }) {
  const renderWidget = () => {
    switch (widget.type) {
      case "metrics":
        return <MetricsWidget data={widget.data} />;
      case "chart":
        return <ChartWidget data={widget.data} />;
      case "table":
        return <TableWidget data={widget.data} />;
      default:
        return null;
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{widget.title}</h3>
      {renderWidget()}
    </Card>
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
| Bundle size       | ≤500KB    | CI blocks   |

---

## 🚀 Deployment

### Feature Flag

```typescript
const flags = {
  m69_master_dashboard: false, // Default: disabled
};
```

---

## 📝 Definition of Done

### Functional Requirements

- [ ] Master dashboard rendering working
- [ ] Widget system functional
- [ ] Customization working
- [ ] Real-time metrics working
- [ ] Alerts panel working
- [ ] Drill-down navigation working
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

**Ready to enhance M30-CLOSE-INSIGHTS with Master Dashboard! 🚀**
