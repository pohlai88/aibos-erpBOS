# 🎯 M48: Stock-Based Compensation - UI Implementation Runbook

**Module ID**: M48  
**Module Name**: Stock-Based Compensation  
**Priority**: 🔥 HIGH  
**Phase**: Phase 11 - Critical Missing Modules  
**Estimated Effort**: 4 days  
**Last Updated**: 2025-10-06

---

## 📋 Module Overview

Stock-Based Compensation provides **equity compensation management** for businesses requiring **stock options**, **RSUs**, **ESOP tracking**, and **ASC 718/IFRS 2 compliance**.

### Business Value

**Key Benefits**:

- **Equity Management**: Complete stock option and RSU tracking
- **ASC 718/IFRS 2 Compliance**: Automated accounting for stock compensation
- **Vesting Schedules**: Track vesting periods and exercise windows
- **Tax Reporting**: W-2, 1099, and international tax compliance

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status | Details                         |
| ------------- | ------ | ------------------------------- |
| **Database**  | ❌ NO  | No stock compensation schema    |
| **Services**  | ❌ NO  | No equity compensation services |
| **API**       | ❌ NO  | No stock compensation APIs      |
| **Contracts** | ❌ NO  | No stock compensation types     |

### API Endpoints

**Stock-Based Compensation** (Implementation needed):

- ❌ `/api/equity/grants` - List equity grants
- ❌ `/api/equity/grants/[id]` - Get grant details
- ❌ `/api/equity/grants/create` - Create new grant
- ❌ `/api/equity/vesting` - Track vesting schedules
- ❌ `/api/equity/exercises` - Record option exercises
- ❌ `/api/equity/valuations` - Fair value calculations
- ❌ `/api/equity/reports` - Generate equity reports

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                   | Page Component          | Purpose                 |
| ----------------------- | ----------------------- | ----------------------- |
| `/equity/grants`        | `EquityGrantListPage`   | List equity grants      |
| `/equity/grants/[id]`   | `EquityGrantDetailPage` | View grant details      |
| `/equity/grants/create` | `EquityGrantCreatePage` | Create new grant        |
| `/equity/vesting`       | `VestingSchedulePage`   | Vesting schedules       |
| `/equity/exercises`     | `ExerciseHistoryPage`   | Exercise history        |
| `/equity/valuations`    | `ValuationPage`         | Fair value calculations |
| `/equity/reports`       | `EquityReportsPage`     | Equity reports          |

### Component Structure

```
apps/web/app/(dashboard)/equity/
├── grants/
│   ├── page.tsx               # Equity grant list page
│   ├── create/
│   │   └── page.tsx           # Create grant page
│   └── [id]/
│       └── page.tsx           # Grant detail page
├── vesting/
│   └── page.tsx               # Vesting schedule page
├── exercises/
│   └── page.tsx               # Exercise history page
├── valuations/
│   └── page.tsx               # Valuation page
└── reports/
    └── page.tsx               # Equity reports page

apps/web/components/equity/
├── EquityGrantList.tsx        # Grant list component
├── EquityGrantCard.tsx        # Grant card component
├── EquityGrantForm.tsx        # Grant form component
├── VestingSchedule.tsx        # Vesting schedule component
├── ExerciseHistory.tsx        # Exercise history component
├── ValuationCalculator.tsx    # Valuation calculator component
└── EquityReports.tsx          # Reports component

apps/web/hooks/equity/
├── useEquityGrants.ts         # Equity grants hook
├── useEquityGrantDetail.ts    # Grant detail hook
├── useVestingSchedule.ts      # Vesting schedule hook
├── useExerciseHistory.ts      # Exercise history hook
└── useValuations.ts           # Valuations hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages (data fetching)
- **Client Components**: Forms, calculators, charts
- **Feature Flag**: `flags.m48_stock_compensation = false`

---

## 🎨 Design System

### Components Used

| Component    | Purpose           | Variant                    |
| ------------ | ----------------- | -------------------------- |
| `DataTable`  | List grants       | With filters, pagination   |
| `Card`       | Grant details     | With actions               |
| `Form`       | Grant forms       | With validation            |
| `Button`     | Actions           | Primary, secondary, danger |
| `Modal`      | Confirmations     | With backdrop              |
| `Select`     | Grant type picker | With search                |
| `Badge`      | Status tags       | With colors                |
| `Tabs`       | Grant sections    | With icons                 |
| `DatePicker` | Vesting dates     | With range                 |
| `Currency`   | Amount input      | With formatting            |
| `Chart`      | Vesting charts    | With tooltips              |

### Design Tokens

```typescript
// Stock compensation specific colors
const equityColors = {
  options: "hsl(var(--options))",
  rsu: "hsl(var(--rsu))",
  esop: "hsl(var(--esop))",
  vested: "hsl(var(--vested))",
  exercised: "hsl(var(--exercised))",
};

// Grant status colors
const grantStatusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  vested: "bg-blue-100 text-blue-800",
  exercised: "bg-purple-100 text-purple-800",
  expired: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};
```

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  equity: {
    grants: ["equity", "grants"] as const,
    grantDetail: (id: string) => ["equity", "grant", id] as const,
    vesting: ["equity", "vesting"] as const,
    exercises: ["equity", "exercises"] as const,
    valuations: ["equity", "valuations"] as const,
    reports: ["equity", "reports"] as const,
  },
};
```

### Cache Configuration

| Query Type    | Stale Time | Cache Time | Invalidation            |
| ------------- | ---------- | ---------- | ----------------------- |
| Equity Grants | 5 minutes  | 15 minutes | On create/update/delete |
| Vesting       | 10 minutes | 30 minutes | On vesting event        |
| Exercises     | 5 minutes  | 15 minutes | On exercise             |
| Valuations    | 1 day      | 7 days     | On valuation update     |

---

## 🎭 User Experience

### User Flows

#### 1. Create Equity Grant

1. User navigates to `/equity/grants/create`
2. System opens create form
3. User selects grant type (Options, RSU, ESOP)
4. User sets grant amount, vesting schedule, exercise price
5. User submits form
6. System creates grant and shows confirmation

#### 2. Track Vesting Schedule

1. User navigates to `/equity/vesting`
2. System shows vesting calendar
3. User can view upcoming vesting events
4. User can see vested vs unvested amounts
5. User can view vesting charts

#### 3. Record Option Exercise

1. User navigates to `/equity/exercises`
2. User clicks "Record Exercise"
3. System shows exercise form
4. User enters exercise details
5. System records exercise and updates grant status

### UI States

| State          | Component          | Message                       |
| -------------- | ------------------ | ----------------------------- |
| **Empty**      | `EquityEmptyState` | "No equity grants found"      |
| **Loading**    | `EquitySkeleton`   | Loading skeleton              |
| **Error**      | `EquityErrorState` | "Failed to load equity data"  |
| **No Results** | `EquityNoResults`  | "No grants match your search" |

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
| `Ctrl/Cmd + N` | Create new grant   |
| `Ctrl/Cmd + F` | Focus search field |
| `Escape`       | Close modal/dialog |
| `Enter`        | Submit form        |

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("EquityGrantList", () => {
  it("renders list of equity grants", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles grant creation", () => {});
});

// Hook tests
describe("useEquityGrants", () => {
  it("fetches equity grants", () => {});
  it("handles grant creation", () => {});
  it("handles errors", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Equity API Integration", () => {
  it("creates grant successfully", () => {});
  it("records exercise successfully", () => {});
  it("calculates fair value successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Equity E2E", () => {
  it("complete grant creation flow", () => {});
  it("complete vesting tracking flow", () => {});
  it("complete exercise recording flow", () => {});
  it("keyboard navigation", () => {});
});
```

---

## ⚡ Performance

### Bundle Size

- **Target**: ≤400KB gzipped per route
- **Current**: <CURRENT_SIZE>KB
- **Optimization**: Code splitting, lazy loading

### Loading Performance

- **TTFB**: ≤70ms (Time to First Byte)
- **TTI**: ≤200ms (Time to Interactive)
- **LCP**: ≤2.5s (Largest Contentful Paint)

---

## 🚀 Implementation Guide

### Step 1: Setup

```bash
# Create directory structure
mkdir -p apps/web/app/(dashboard)/equity
mkdir -p apps/web/components/equity
mkdir -p apps/web/hooks/equity

# Create feature flag
echo 'flags.m48_stock_compensation = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/equity/EquityGrantList.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useEquityGrants } from "@/hooks/equity/useEquityGrants";

export function EquityGrantList() {
  const { data, isLoading, error } = useEquityGrants();

  if (isLoading) return <EquitySkeleton />;
  if (error) return <EquityErrorState />;
  if (!data?.length) return <EquityEmptyState />;

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="grantee"
      filters={filters}
    />
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/equity/useEquityGrants.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useEquityGrants(filters?: EquityFilters) {
  return useQuery({
    queryKey: ["equity", "grants", filters],
    queryFn: () => api.equity.grants(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/equity/grants/page.tsx
import { EquityGrantList } from "@/components/equity/EquityGrantList";
import { EquityFilters } from "@/components/equity/EquityFilters";

export default function EquityGrantPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Equity Grants</h1>
        <CreateGrantButton />
      </div>
      <EquityFilters />
      <EquityGrantList />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/equity/grants/__tests__/EquityGrantList.test.tsx
import { render, screen } from "@testing-library/react";
import { EquityGrantList } from "@/components/equity/EquityGrantList";

describe("EquityGrantList", () => {
  it("renders list of equity grants", () => {
    render(<EquityGrantList />);
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
  m48_stock_compensation: false, // Default: disabled
};

// Usage in components
if (flags.m48_stock_compensation) {
  return <EquityGrantList />;
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

1. **Set feature flag**: `flags.m48_stock_compensation = false`
2. **Invalidate cache**: `revalidateTag("equity")`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All equity grant operations working
- [ ] Vesting schedule tracking functional
- [ ] Option exercise recording working
- [ ] Fair value calculations working
- [ ] ASC 718/IFRS 2 reporting working
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

**Ready to implement Stock-Based Compensation UI! 🚀**
