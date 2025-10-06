# 🎯 M41: Accruals, Prepaids & Provisions - UI Implementation Runbook

**Module ID**: M41  
**Module Name**: Accruals, Prepaids & Provisions  
**Priority**: 🚨 CRITICAL  
**Phase**: Financial Operations  
**Estimated Effort**: 3 days  
**Last Updated**: 2025-10-06

---

## 📋 Module Overview

Accruals, Prepaids & Provisions provides **month-end close management** for businesses requiring **accrual accounting**, **prepaid expense tracking**, and **provision management**.

### Business Value

**Key Benefits**:

- **Month-End Close**: Automated accrual processing
- **Compliance**: Proper accrual accounting standards
- **Cash Flow**: Accurate prepaid expense tracking
- **Risk Management**: Provision for future liabilities

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status | Details             |
| ------------- | ------ | ------------------- |
| **Database**  | ❌ NO  | No accruals schema  |
| **Services**  | ❌ NO  | No accrual services |
| **API**       | ❌ NO  | No accrual APIs     |
| **Contracts** | ❌ NO  | No accrual types    |

### API Endpoints

**Accruals, Prepaids & Provisions** (Implementation needed):

- ❌ `/api/accruals` - List accruals
- ❌ `/api/accruals/[id]` - Get accrual details
- ❌ `/api/accruals/create` - Create new accrual
- ❌ `/api/prepaids` - List prepaids
- ❌ `/api/prepaids/[id]` - Get prepaid details
- ❌ `/api/provisions` - List provisions
- ❌ `/api/provisions/[id]` - Get provision details

---

## 🏗️ UI Architecture

### Pages & Routes

| Route              | Page Component        | Purpose                |
| ------------------ | --------------------- | ---------------------- |
| `/accruals`        | `AccrualListPage`     | List accruals          |
| `/accruals/[id]`   | `AccrualDetailPage`   | View accrual details   |
| `/accruals/create` | `AccrualCreatePage`   | Create new accrual     |
| `/prepaids`        | `PrepaidListPage`     | List prepaids          |
| `/prepaids/[id]`   | `PrepaidDetailPage`   | View prepaid details   |
| `/provisions`      | `ProvisionListPage`   | List provisions        |
| `/provisions/[id]` | `ProvisionDetailPage` | View provision details |

### Component Structure

```
apps/web/app/(dashboard)/accruals/
├── page.tsx                    # Accrual list page
├── [id]/
│   └── page.tsx               # Accrual detail page
└── create/
    └── page.tsx               # Create accrual page

apps/web/app/(dashboard)/prepaids/
├── page.tsx                    # Prepaid list page
└── [id]/
    └── page.tsx               # Prepaid detail page

apps/web/app/(dashboard)/provisions/
├── page.tsx                    # Provision list page
└── [id]/
    └── page.tsx               # Provision detail page

apps/web/components/accruals/
├── AccrualList.tsx            # Accrual list component
├── AccrualCard.tsx            # Accrual card component
├── AccrualForm.tsx            # Accrual form component
├── AccrualDetail.tsx          # Accrual detail component
└── AccrualFilters.tsx         # Accrual filters component

apps/web/components/prepaids/
├── PrepaidList.tsx            # Prepaid list component
├── PrepaidCard.tsx            # Prepaid card component
├── PrepaidForm.tsx            # Prepaid form component
└── PrepaidDetail.tsx          # Prepaid detail component

apps/web/components/provisions/
├── ProvisionList.tsx          # Provision list component
├── ProvisionCard.tsx          # Provision card component
├── ProvisionForm.tsx          # Provision form component
└── ProvisionDetail.tsx       # Provision detail component

apps/web/hooks/accruals/
├── useAccrualList.ts          # Accrual list hook
├── useAccrualDetail.ts        # Accrual detail hook
├── useAccrualCreate.ts        # Accrual create hook
└── useAccrualUpdate.ts        # Accrual update hook

apps/web/hooks/prepaids/
├── usePrepaidList.ts          # Prepaid list hook
├── usePrepaidDetail.ts        # Prepaid detail hook
└── usePrepaidCreate.ts        # Prepaid create hook

apps/web/hooks/provisions/
├── useProvisionList.ts        # Provision list hook
├── useProvisionDetail.ts      # Provision detail hook
└── useProvisionCreate.ts      # Provision create hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages (data fetching)
- **Client Components**: Forms, calculations, date pickers
- **Feature Flag**: `flags.m41_accruals_prepaids = false`

---

## 🎨 Design System

### Components Used

| Component    | Purpose             | Variant                    |
| ------------ | ------------------- | -------------------------- |
| `DataTable`  | List accruals       | With filters, pagination   |
| `Card`       | Accrual details     | With actions               |
| `Form`       | Create/edit accrual | With validation            |
| `Button`     | Actions             | Primary, secondary, danger |
| `Modal`      | Confirmations       | With backdrop              |
| `Select`     | Account picker      | With search                |
| `Badge`      | Status tags         | With colors                |
| `Tabs`       | Accrual sections    | With icons                 |
| `DatePicker` | Date selection      | With range                 |
| `Currency`   | Amount input        | With formatting            |

### Design Tokens

```typescript
// Accrual-specific colors
const accrualColors = {
  accrual: "hsl(var(--accrual))",
  prepaid: "hsl(var(--prepaid))",
  provision: "hsl(var(--provision))",
  pending: "hsl(var(--pending))",
  posted: "hsl(var(--posted))",
};

// Accrual status colors
const accrualStatusColors = {
  draft: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  posted: "bg-green-100 text-green-800",
  reversed: "bg-red-100 text-red-800",
};
```

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  accruals: {
    list: ["accruals", "list"] as const,
    detail: (id: string) => ["accruals", "detail", id] as const,
    create: ["accruals", "create"] as const,
    update: (id: string) => ["accruals", "update", id] as const,
  },
  prepaids: {
    list: ["prepaids", "list"] as const,
    detail: (id: string) => ["prepaids", "detail", id] as const,
    create: ["prepaids", "create"] as const,
  },
  provisions: {
    list: ["provisions", "list"] as const,
    detail: (id: string) => ["provisions", "detail", id] as const,
    create: ["provisions", "create"] as const,
  },
};
```

### Cache Configuration

| Query Type     | Stale Time | Cache Time | Invalidation            |
| -------------- | ---------- | ---------- | ----------------------- |
| Accrual List   | 5 minutes  | 15 minutes | On create/update/delete |
| Accrual Detail | 10 minutes | 30 minutes | On update/delete        |
| Prepaid List   | 5 minutes  | 15 minutes | On create/update/delete |
| Provision List | 5 minutes  | 15 minutes | On create/update/delete |

---

## 🎭 User Experience

### User Flows

#### 1. Create Accrual

1. User navigates to `/accruals/create`
2. System opens create form
3. User selects account and amount
4. User sets accrual date and description
5. User submits form
6. System creates accrual and redirects to detail page

#### 2. View Accrual Details

1. User navigates to `/accruals`
2. System loads accruals with pagination
3. User clicks on accrual to view details
4. System shows accrual details and related entries

#### 3. Manage Prepaids

1. User navigates to `/prepaids`
2. System shows prepaid expenses
3. User can create new prepaid entries
4. User can track prepaid amortization
5. User can view prepaid schedules

#### 4. Create Provisions

1. User navigates to `/provisions/create`
2. System opens provision form
3. User sets provision amount and reason
4. User selects provision account
5. User submits form
6. System creates provision entry

### UI States

| State          | Component           | Message                         |
| -------------- | ------------------- | ------------------------------- |
| **Empty**      | `AccrualEmptyState` | "No accruals found"             |
| **Loading**    | `AccrualSkeleton`   | Loading skeleton                |
| **Error**      | `AccrualErrorState` | "Failed to load accruals"       |
| **No Results** | `AccrualNoResults`  | "No accruals match your search" |

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
| `Ctrl/Cmd + N` | Create new accrual |
| `Ctrl/Cmd + F` | Focus search field |
| `Escape`       | Close modal/dialog |
| `Enter`        | Submit form        |

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("AccrualList", () => {
  it("renders list of accruals", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles accrual creation", () => {});
  it("handles accrual updates", () => {});
});

// Hook tests
describe("useAccrualList", () => {
  it("fetches accrual list", () => {});
  it("handles accrual creation", () => {});
  it("handles accrual updates", () => {});
  it("handles errors", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Accrual API Integration", () => {
  it("creates accrual successfully", () => {});
  it("updates accrual successfully", () => {});
  it("creates prepaid successfully", () => {});
  it("creates provision successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Accrual E2E", () => {
  it("complete accrual creation flow", () => {});
  it("complete prepaid management flow", () => {});
  it("complete provision creation flow", () => {});
  it("search and filter functionality", () => {});
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
mkdir -p apps/web/app/(dashboard)/accruals
mkdir -p apps/web/app/(dashboard)/prepaids
mkdir -p apps/web/app/(dashboard)/provisions
mkdir -p apps/web/components/accruals
mkdir -p apps/web/components/prepaids
mkdir -p apps/web/components/provisions
mkdir -p apps/web/hooks/accruals
mkdir -p apps/web/hooks/prepaids
mkdir -p apps/web/hooks/provisions

# Create feature flag
echo 'flags.m41_accruals_prepaids = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/accruals/AccrualList.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useAccrualList } from "@/hooks/accruals/useAccrualList";

export function AccrualList() {
  const { data, isLoading, error } = useAccrualList();

  if (isLoading) return <AccrualSkeleton />;
  if (error) return <AccrualErrorState />;
  if (!data?.length) return <AccrualEmptyState />;

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
// apps/web/hooks/accruals/useAccrualList.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useAccrualList(filters?: AccrualFilters) {
  return useQuery({
    queryKey: ["accruals", "list", filters],
    queryFn: () => api.accruals.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/accruals/page.tsx
import { AccrualList } from "@/components/accruals/AccrualList";
import { AccrualFilters } from "@/components/accruals/AccrualFilters";

export default function AccrualPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Accruals</h1>
        <CreateAccrualButton />
      </div>
      <AccrualFilters />
      <AccrualList />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/accruals/__tests__/AccrualList.test.tsx
import { render, screen } from "@testing-library/react";
import { AccrualList } from "@/components/accruals/AccrualList";

describe("AccrualList", () => {
  it("renders list of accruals", () => {
    render(<AccrualList />);
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
  m41_accruals_prepaids: false, // Default: disabled
};

// Usage in components
if (flags.m41_accruals_prepaids) {
  return <AccrualList />;
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

1. **Set feature flag**: `flags.m41_accruals_prepaids = false`
2. **Invalidate cache**: `revalidateTag("accruals")`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All accrual operations working
- [ ] Prepaid management functional
- [ ] Provision management working
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

**Ready to implement Accruals, Prepaids & Provisions UI! 🚀**
