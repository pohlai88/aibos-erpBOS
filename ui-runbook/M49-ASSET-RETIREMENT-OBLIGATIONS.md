# 🎯 M49: Asset Retirement Obligations (ARO) - UI Implementation Runbook

**Module ID**: M49  
**Module Name**: Asset Retirement Obligations (ARO)  
**Priority**: 🔶 MEDIUM  
**Phase**: Phase 11 - Critical Missing Modules  
**Estimated Effort**: 3.5 days  
**Last Updated**: 2025-10-06

---

## 📋 Module Overview

Asset Retirement Obligations (ARO) provides **retirement obligation tracking** for businesses requiring **decommissioning liability management**, **ASC 410/IAS 37 compliance**, and **accretion expense automation**.

### Business Value

**Key Benefits**:

- **ARO Tracking**: Complete retirement obligation lifecycle management
- **ASC 410/IAS 37 Compliance**: Automated accounting for retirement obligations
- **Accretion Automation**: Automatic accretion expense calculation
- **Decommissioning Planning**: Track decommissioning costs and schedules

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status | Details               |
| ------------- | ------ | --------------------- |
| **Database**  | ❌ NO  | No ARO schema         |
| **Services**  | ❌ NO  | No ARO services       |
| **API**       | ❌ NO  | No ARO APIs           |
| **Contracts** | ❌ NO  | No ARO contract types |

### API Endpoints

**Asset Retirement Obligations** (Implementation needed):

- ❌ `/api/aro` - List AROs
- ❌ `/api/aro/[id]` - Get ARO details
- ❌ `/api/aro/create` - Create new ARO
- ❌ `/api/aro/[id]/update` - Update ARO
- ❌ `/api/aro/accretion` - Calculate accretion expense
- ❌ `/api/aro/settlements` - Record settlements
- ❌ `/api/aro/reports` - Generate ARO reports

---

## 🏗️ UI Architecture

### Pages & Routes

| Route              | Page Component    | Purpose            |
| ------------------ | ----------------- | ------------------ |
| `/aro`             | `AROListPage`     | List AROs          |
| `/aro/[id]`        | `ARODetailPage`   | View ARO details   |
| `/aro/create`      | `AROCreatePage`   | Create new ARO     |
| `/aro/[id]/edit`   | `AROEditPage`     | Edit ARO           |
| `/aro/accretion`   | `AccretionPage`   | Accretion schedule |
| `/aro/settlements` | `SettlementsPage` | Settlement history |

### Component Structure

```
apps/web/app/(dashboard)/aro/
├── page.tsx                   # ARO list page
├── [id]/
│   ├── page.tsx               # ARO detail page
│   └── edit/
│       └── page.tsx           # Edit ARO page
├── create/
│   └── page.tsx               # Create ARO page
├── accretion/
│   └── page.tsx               # Accretion schedule page
└── settlements/
    └── page.tsx               # Settlements page

apps/web/components/aro/
├── AROList.tsx                # ARO list component
├── AROCard.tsx                # ARO card component
├── AROForm.tsx                # ARO form component
├── AccretionSchedule.tsx      # Accretion schedule component
├── SettlementHistory.tsx      # Settlement history component
└── AROReports.tsx             # Reports component

apps/web/hooks/aro/
├── useAROList.ts              # ARO list hook
├── useARODetail.ts            # ARO detail hook
├── useAROCreate.ts            # Create ARO hook
├── useAROUpdate.ts            # Update ARO hook
└── useAccretion.ts            # Accretion hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages (data fetching)
- **Client Components**: Forms, calculators, charts
- **Feature Flag**: `flags.m49_aro = false`

---

## 🎨 Design System

### Components Used

| Component    | Purpose          | Variant                    |
| ------------ | ---------------- | -------------------------- |
| `DataTable`  | List AROs        | With filters, pagination   |
| `Card`       | ARO details      | With actions               |
| `Form`       | ARO forms        | With validation            |
| `Button`     | Actions          | Primary, secondary, danger |
| `Modal`      | Confirmations    | With backdrop              |
| `DatePicker` | Settlement dates | With range                 |
| `Currency`   | Amount input     | With formatting            |
| `Chart`      | Accretion charts | With tooltips              |

### Design Tokens

```typescript
// ARO specific colors
const aroColors = {
  active: "hsl(var(--aro-active))",
  settled: "hsl(var(--aro-settled))",
  accretion: "hsl(var(--aro-accretion))",
  liability: "hsl(var(--aro-liability))",
};

// ARO status colors
const aroStatusColors = {
  active: "bg-blue-100 text-blue-800",
  accretion: "bg-yellow-100 text-yellow-800",
  settled: "bg-green-100 text-green-800",
  revised: "bg-purple-100 text-purple-800",
};
```

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  aro: {
    list: ["aro", "list"] as const,
    detail: (id: string) => ["aro", "detail", id] as const,
    accretion: ["aro", "accretion"] as const,
    settlements: ["aro", "settlements"] as const,
  },
};
```

### Cache Configuration

| Query Type  | Stale Time | Cache Time | Invalidation            |
| ----------- | ---------- | ---------- | ----------------------- |
| ARO List    | 5 minutes  | 15 minutes | On create/update/delete |
| ARO Detail  | 10 minutes | 30 minutes | On update               |
| Accretion   | 1 day      | 7 days     | On ARO update           |
| Settlements | 5 minutes  | 15 minutes | On settlement           |

---

## 🎭 User Experience

### User Flows

#### 1. Create ARO

1. User navigates to `/aro/create`
2. System opens create form
3. User enters ARO details (asset, initial liability, settlement date)
4. User submits form
5. System creates ARO and calculates accretion schedule

#### 2. View Accretion Schedule

1. User navigates to `/aro/accretion`
2. System shows accretion schedule for all AROs
3. User can view accretion expense by period
4. User can see cumulative accretion

#### 3. Record Settlement

1. User views ARO detail page
2. User clicks "Record Settlement"
3. System shows settlement form
4. User enters settlement details
5. System records settlement and closes ARO

### UI States

| State          | Component       | Message                     |
| -------------- | --------------- | --------------------------- |
| **Empty**      | `AROEmptyState` | "No AROs found"             |
| **Loading**    | `AROSkeleton`   | Loading skeleton            |
| **Error**      | `AROErrorState` | "Failed to load AROs"       |
| **No Results** | `ARONoResults`  | "No AROs match your search" |

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
| `Ctrl/Cmd + N` | Create new ARO     |
| `Ctrl/Cmd + F` | Focus search field |
| `Escape`       | Close modal/dialog |
| `Enter`        | Submit form        |

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("AROList", () => {
  it("renders list of AROs", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
});

// Hook tests
describe("useAROList", () => {
  it("fetches ARO list", () => {});
  it("handles pagination", () => {});
  it("handles errors", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("ARO API Integration", () => {
  it("creates ARO successfully", () => {});
  it("calculates accretion successfully", () => {});
  it("records settlement successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("ARO E2E", () => {
  it("complete ARO creation flow", () => {});
  it("complete accretion tracking flow", () => {});
  it("complete settlement flow", () => {});
  it("keyboard navigation", () => {});
});
```

---

## ⚡ Performance

### Bundle Size

- **Target**: ≤350KB gzipped per route
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
mkdir -p apps/web/app/(dashboard)/aro
mkdir -p apps/web/components/aro
mkdir -p apps/web/hooks/aro

# Create feature flag
echo 'flags.m49_aro = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/aro/AROList.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useAROList } from "@/hooks/aro/useAROList";

export function AROList() {
  const { data, isLoading, error } = useAROList();

  if (isLoading) return <AROSkeleton />;
  if (error) return <AROErrorState />;
  if (!data?.length) return <AROEmptyState />;

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="asset"
      filters={filters}
    />
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/aro/useAROList.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useAROList(filters?: AROFilters) {
  return useQuery({
    queryKey: ["aro", "list", filters],
    queryFn: () => api.aro.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/aro/page.tsx
import { AROList } from "@/components/aro/AROList";
import { AROFilters } from "@/components/aro/AROFilters";

export default function AROPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Asset Retirement Obligations</h1>
        <CreateAROButton />
      </div>
      <AROFilters />
      <AROList />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/aro/__tests__/AROList.test.tsx
import { render, screen } from "@testing-library/react";
import { AROList } from "@/components/aro/AROList";

describe("AROList", () => {
  it("renders list of AROs", () => {
    render(<AROList />);
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
  m49_aro: false, // Default: disabled
};

// Usage in components
if (flags.m49_aro) {
  return <AROList />;
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

1. **Set feature flag**: `flags.m49_aro = false`
2. **Invalidate cache**: `revalidateTag("aro")`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All ARO operations working
- [ ] Accretion calculation functional
- [ ] Settlement recording working
- [ ] ASC 410/IAS 37 reporting working
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

**Ready to implement Asset Retirement Obligations UI! 🚀**
