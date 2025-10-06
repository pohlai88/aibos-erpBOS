# 🎯 M99: Log Management - UI Implementation Runbook

**Module ID**: M99  
**Module Name**: Log Management  
**Priority**: 🔶 MEDIUM  
**Phase**: Phase 17 - Infrastructure Modernization  
**Estimated Effort**: 2 days  
**Last Updated**: 2025-10-06

**Status**: ❌ NO - CREATE NEW Module

---

## 📋 Module Overview

### Business Value

Log Management provides **comprehensive system log management and analysis** for businesses requiring organized log collection, storage, and analysis.

**Key Benefits**:

- Complete log management
- Log analysis and search
- Log retention policies
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

**Log Management Operations** (15 endpoints):

- ✅ `/api/log-management/logs` - List logs
- ✅ `/api/log-management/logs/[id]` - Get log details
- ✅ `/api/log-management/logs/create` - Create log
- ✅ `/api/log-management/logs/[id]/update` - Update log
- ✅ `/api/log-management/logs/[id]/delete` - Delete log
- ✅ `/api/log-management/logs/[id]/search` - Search logs
- ✅ `/api/log-management/logs/[id]/export` - Export logs
- ✅ `/api/log-management/sources` - List log sources
- ✅ `/api/log-management/sources/[id]` - Get source details
- ✅ `/api/log-management/sources/create` - Create source
- ✅ `/api/log-management/sources/[id]/update` - Update source
- ✅ `/api/log-management/sources/[id]/delete` - Delete source
- ✅ `/api/log-management/sources/[id]/test` - Test source
- ✅ `/api/log-management/analytics` - Get log analytics
- ✅ `/api/log-management/alerts` - Get log alerts

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                               | Page Component                  | Purpose                 |
| ----------------------------------- | ------------------------------- | ----------------------- |
| `/log-management`                   | `LogManagementPage`             | Main log management hub |
| `/log-management/logs`              | `LogManagementLogsPage`         | Log management          |
| `/log-management/logs/[id]`         | `LogManagementLogDetailPage`    | View log details        |
| `/log-management/logs/create`       | `LogManagementLogCreatePage`    | Create log              |
| `/log-management/logs/[id]/edit`    | `LogManagementLogEditPage`      | Edit log                |
| `/log-management/sources`           | `LogManagementSourcesPage`      | Source management       |
| `/log-management/sources/[id]`      | `LogManagementSourceDetailPage` | View source details     |
| `/log-management/sources/create`    | `LogManagementSourceCreatePage` | Create source           |
| `/log-management/sources/[id]/edit` | `LogManagementSourceEditPage`   | Edit source             |
| `/log-management/analytics`         | `LogManagementAnalyticsPage`    | Log analytics           |
| `/log-management/alerts`            | `LogManagementAlertsPage`       | Log alerts              |

### Component Structure

```
apps/web/app/(dashboard)/log-management/
├── page.tsx                    # Main hub page
├── logs/
│   ├── page.tsx               # Logs list
│   ├── [id]/
│   │   ├── page.tsx           # Log details
│   │   └── edit/
│   │       └── page.tsx       # Edit log
│   └── create/
│       └── page.tsx           # Create log
├── sources/
│   ├── page.tsx               # Sources list
│   ├── [id]/
│   │   ├── page.tsx           # Source details
│   │   └── edit/
│   │       └── page.tsx       # Edit source
│   └── create/
│       └── page.tsx           # Create source
├── analytics/
│   └── page.tsx               # Analytics page
└── alerts/
    └── page.tsx               # Alerts page

apps/web/components/log-management/
├── LogManagementHub.tsx      # Main hub component
├── LogManagementLogs.tsx  # Logs component
├── LogManagementLogCard.tsx # Log card
├── LogManagementLogForm.tsx # Log form
├── LogManagementSources.tsx # Sources component
├── LogManagementSourceCard.tsx # Source card
├── LogManagementSourceForm.tsx # Source form
├── LogManagementAnalytics.tsx # Analytics component
├── LogManagementAlerts.tsx   # Alerts component
├── LogManagementFilters.tsx  # Filter component
└── LogManagementActions.tsx  # Action buttons

apps/web/hooks/log-management/
├── useLogManagementLogs.ts # Logs hook
├── useLogManagementLogDetail.ts # Log detail hook
├── useLogManagementLogCreate.ts # Log create hook
├── useLogManagementLogUpdate.ts # Log update hook
├── useLogManagementLogDelete.ts # Log delete hook
├── useLogManagementLogSearch.ts # Log search hook
├── useLogManagementLogExport.ts # Log export hook
├── useLogManagementSources.ts # Sources hook
├── useLogManagementSourceDetail.ts # Source detail hook
├── useLogManagementSourceCreate.ts # Source create hook
├── useLogManagementSourceUpdate.ts # Source update hook
├── useLogManagementSourceDelete.ts # Source delete hook
├── useLogManagementSourceTest.ts # Source test hook
├── useLogManagementAnalytics.ts # Analytics hook
└── useLogManagementAlerts.ts # Alerts hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages (data fetching)
- **Client Components**: Forms, interactive elements, modals
- **Feature Flag**: `flags.m99_log_management = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose           | Variant                    |
| ----------- | ----------------- | -------------------------- |
| `DataTable` | List logs/sources | With filters, pagination   |
| `Card`      | Log details       | With actions               |
| `Form`      | Create/edit forms | With validation            |
| `Button`    | Actions           | Primary, secondary, danger |
| `Modal`     | Confirmations     | With backdrop              |
| `Tabs`      | Log tabs          | With content               |
| `Progress`  | Log progress      | With status                |

### Design Tokens

```typescript
// Log-specific colors
const logColors = {
  info: "hsl(var(--log-info))",
  warning: "hsl(var(--log-warning))",
  error: "hsl(var(--log-error))",
  debug: "hsl(var(--log-debug))",
  trace: "hsl(var(--log-trace))",
};

// Log level colors
const logLevelColors = {
  trace: "bg-gray-100 text-gray-800",
  debug: "bg-blue-100 text-blue-800",
  info: "bg-green-100 text-green-800",
  warn: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800",
  fatal: "bg-red-200 text-red-900",
};

// Source status colors
const sourceStatusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  error: "bg-red-100 text-red-800",
  testing: "bg-yellow-100 text-yellow-800",
};
```

### Theme Support

- **Dark Mode**: Default theme
- **Light Mode**: Available via theme toggle
- **High Contrast**: WCAG AAA compliance
- **Log Themes**: Level-based themes

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  logs: ["log-management", "logs"] as const,
  log: (id: string) => ["log-management", "log", id] as const,
  sources: ["log-management", "sources"] as const,
  source: (id: string) => ["log-management", "source", id] as const,
  analytics: ["log-management", "analytics"] as const,
  alerts: ["log-management", "alerts"] as const,
};
```

### Cache Configuration

| Query Type | Stale Time | Cache Time | Invalidation            |
| ---------- | ---------- | ---------- | ----------------------- |
| Logs       | 1 minute   | 5 minutes  | On create/update/delete |
| Log        | 30 seconds | 2 minutes  | On update/delete        |
| Sources    | 5 minutes  | 15 minutes | On create/update/delete |
| Source     | 5 minutes  | 15 minutes | On update/delete        |
| Analytics  | 5 minutes  | 15 minutes | On log change           |
| Alerts     | 1 minute   | 5 minutes  | On alert update         |

### Invalidation Rules

```typescript
// After creating log
queryClient.invalidateQueries({ queryKey: ["log-management", "logs"] });
queryClient.invalidateQueries({ queryKey: ["log-management", "analytics"] });

// After updating log
queryClient.invalidateQueries({ queryKey: ["log-management", "log", id] });
queryClient.invalidateQueries({ queryKey: ["log-management", "logs"] });

// After testing source
queryClient.invalidateQueries({ queryKey: ["log-management", "source", id] });
queryClient.invalidateQueries({ queryKey: ["log-management", "alerts"] });
```

---

## 🎭 User Experience

### User Flows

#### 1. Create Log Source

1. User navigates to log management page
2. User clicks "Create Source" button
3. System opens source creation form
4. User selects source type
5. User sets source parameters
6. User configures source settings
7. User submits source

#### 2. Search Logs

1. User navigates to logs page
2. User enters search criteria
3. System displays search results
4. User filters results
5. User views log details
6. User exports search results

#### 3. View Log Analytics

1. User navigates to analytics page
2. System loads log analytics
3. User views log trends
4. User interacts with charts
5. User drills down into details
6. User exports analytics data

### UI States

| State          | Component                 | Message                     |
| -------------- | ------------------------- | --------------------------- |
| **Empty**      | `LogManagementEmptyState` | "No logs found"             |
| **Loading**    | `LogManagementSkeleton`   | Loading skeleton            |
| **Error**      | `LogManagementErrorState` | "Failed to load logs"       |
| **No Results** | `LogManagementNoResults`  | "No logs match your search" |

### Interactions

- **Hover**: Card elevation, button color change
- **Focus**: Clear focus ring, keyboard navigation
- **Click**: Immediate feedback, loading state
- **Form Validation**: Inline errors, real-time validation
- **Progress**: Log processing progress, status updates

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
| `Ctrl/Cmd + L` | Create log source  |
| `Ctrl/Cmd + S` | Search logs        |
| `Ctrl/Cmd + A` | View analytics     |
| `Ctrl/Cmd + E` | Export logs        |
| `Escape`       | Close modal/dialog |
| `Enter`        | Submit form        |

### ARIA Implementation

```typescript
// Log list
<table role="table" aria-label="Log list">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" aria-sort="none">Log Level</th>
      <th role="columnheader" aria-sort="none">Message</th>
      <th role="columnheader" aria-sort="none">Source</th>
      <th role="columnheader" aria-sort="none">Timestamp</th>
    </tr>
  </thead>
</table>

// Log form
<form role="form" aria-label="Create Log Source">
  <input
    aria-describedby="name-error"
    aria-invalid="false"
    aria-label="Source Name"
  />
  <div id="name-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("LogManagementLogs", () => {
  it("renders list of logs", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles search functionality", () => {});
});

// Hook tests
describe("useLogManagementLogCreate", () => {
  it("creates log successfully", () => {});
  it("handles creation errors", () => {});
  it("validates log data", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Log Management API Integration", () => {
  it("creates log source successfully", () => {});
  it("searches logs successfully", () => {});
  it("exports logs successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Log Management E2E", () => {
  it("complete log source creation flow", () => {});
  it("complete log search flow", () => {});
  it("complete analytics functionality", () => {});
  it("log management alerts functionality", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("Log Management Accessibility", () => {
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
const LogManagementLogForm = lazy(
  () => import("./components/LogManagementLogForm")
);
const LogManagementAnalytics = lazy(
  () => import("./components/LogManagementAnalytics")
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
mkdir -p apps/web/app/(dashboard)/log-management
mkdir -p apps/web/components/log-management
mkdir -p apps/web/hooks/log-management

# Create feature flag
echo 'flags.m99_log_management = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/log-management/LogManagementLogs.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useLogManagementLogs } from "@/hooks/log-management/useLogManagementLogs";

export function LogManagementLogs() {
  const { data, isLoading, error } = useLogManagementLogs();

  if (isLoading) return <LogManagementSkeleton />;
  if (error) return <LogManagementErrorState />;
  if (!data?.length) return <LogManagementEmptyState />;

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="logMessage"
      filters={filters}
    />
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/log-management/useLogManagementLogs.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useLogManagementLogs(filters?: LogManagementFilters) {
  return useQuery({
    queryKey: ["log-management", "logs", filters],
    queryFn: () => api.logManagement.logs.list(filters),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/log-management/page.tsx
import { LogManagementHub } from "@/components/log-management/LogManagementHub";
import { LogManagementQuickActions } from "@/components/log-management/LogManagementQuickActions";

export default function LogManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Log Management</h1>
        <LogManagementQuickActions />
      </div>
      <LogManagementHub />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/log-management/__tests__/LogManagementLogs.test.tsx
import { render, screen } from "@testing-library/react";
import { LogManagementLogs } from "@/components/log-management/LogManagementLogs";

describe("LogManagementLogs", () => {
  it("renders list of logs", () => {
    render(<LogManagementLogs />);
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
  m99_log_management: false, // Default: disabled
};

// Usage in components
if (flags.m99_log_management) {
  return <LogManagementLogs />;
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

1. **Set feature flag**: `flags.m99_log_management = false`
2. **Invalidate cache**: `revalidateTag('log-management')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Log management functional
- [ ] Source management working
- [ ] Log search functional
- [ ] Analytics working
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

**Ready to implement Log Management UI! 🚀**
