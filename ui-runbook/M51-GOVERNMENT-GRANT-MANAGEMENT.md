# 🎯 M51: Government Grant Management - UI Implementation Runbook

**Module ID**: M51  
**Module Name**: Government Grant Management  
**Priority**: 🔶 MEDIUM  
**Phase**: Phase 12 - Operational Modules  
**Estimated Effort**: 3 days  
**Last Updated**: 2025-10-06

---

## 📋 Module Overview

Government Grant Management provides **grant tracking** and **compliance management** for businesses requiring **grant lifecycle management**, **compliance reporting**, and **grant income recognition**.

### Business Value

**Key Benefits**:

- **Grant Tracking**: Complete grant lifecycle from application to completion
- **Compliance Management**: Track grant conditions and compliance requirements
- **Income Recognition**: Proper grant income recognition (IAS 20/ASC 958)
- **Reporting**: Generate grant compliance and utilization reports

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status | Details           |
| ------------- | ------ | ----------------- |
| **Database**  | ❌ NO  | No grant schema   |
| **Services**  | ❌ NO  | No grant services |
| **API**       | ❌ NO  | No grant APIs     |
| **Contracts** | ❌ NO  | No grant types    |

### API Endpoints

**Government Grant Management** (Implementation needed):

- ❌ `/api/grants` - List grants
- ❌ `/api/grants/[id]` - Get grant details
- ❌ `/api/grants/create` - Create new grant
- ❌ `/api/grants/[id]/update` - Update grant
- ❌ `/api/grants/[id]/compliance` - Track compliance
- ❌ `/api/grants/[id]/utilization` - Track utilization
- ❌ `/api/grants/reports` - Generate grant reports

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                 | Page Component    | Purpose              |
| --------------------- | ----------------- | -------------------- |
| `/grants`             | `GrantsListPage`  | List grants          |
| `/grants/[id]`        | `GrantDetailPage` | View grant details   |
| `/grants/create`      | `GrantCreatePage` | Create new grant     |
| `/grants/[id]/edit`   | `GrantEditPage`   | Edit grant           |
| `/grants/compliance`  | `CompliancePage`  | Compliance tracking  |
| `/grants/utilization` | `UtilizationPage` | Utilization tracking |

### Component Structure

```
apps/web/app/(dashboard)/grants/
├── page.tsx                    # Grants list page
├── [id]/
│   ├── page.tsx                # Grant detail page
│   └── edit/
│       └── page.tsx            # Edit grant page
├── create/
│   └── page.tsx                # Create grant page
├── compliance/
│   └── page.tsx                # Compliance page
└── utilization/
    └── page.tsx                # Utilization page

apps/web/components/grants/
├── GrantsList.tsx              # Grants list
├── GrantCard.tsx               # Grant card
├── GrantForm.tsx               # Grant form
├── ComplianceTracker.tsx       # Compliance tracker
├── UtilizationTracker.tsx      # Utilization tracker
└── GrantReports.tsx            # Grant reports

apps/web/hooks/grants/
├── useGrants.ts                # Grants hook
├── useGrantDetail.ts           # Grant detail hook
├── useGrantCreate.ts           # Create grant hook
├── useGrantUpdate.ts           # Update grant hook
└── useCompliance.ts            # Compliance hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages
- **Client Components**: Forms, trackers, charts
- **Feature Flag**: `flags.m51_government_grants = false`

---

## 🎨 Design System

### Components Used

| Component    | Purpose         | Variant                    |
| ------------ | --------------- | -------------------------- |
| `DataTable`  | List grants     | With filters, pagination   |
| `Card`       | Grant details   | With actions               |
| `Form`       | Grant forms     | With validation            |
| `Button`     | Actions         | Primary, secondary, danger |
| `Badge`      | Status tags     | With colors                |
| `Progress`   | Utilization bar | With percentage            |
| `DatePicker` | Grant dates     | With range                 |
| `Currency`   | Amount input    | With formatting            |

### Design Tokens

```typescript
// Grant specific colors
const grantColors = {
  applied: "hsl(var(--grant-applied))",
  approved: "hsl(var(--grant-approved))",
  active: "hsl(var(--grant-active))",
  completed: "hsl(var(--grant-completed))",
};

// Grant status colors
const grantStatusColors = {
  applied: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  active: "bg-purple-100 text-purple-800",
  completed: "bg-teal-100 text-teal-800",
  rejected: "bg-red-100 text-red-800",
};
```

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  grants: ["grants", "list"] as const,
  grantDetail: (id: string) => ["grants", "detail", id] as const,
  compliance: ["grants", "compliance"] as const,
  utilization: ["grants", "utilization"] as const,
};
```

### Cache Configuration

| Query Type   | Stale Time | Cache Time | Invalidation            |
| ------------ | ---------- | ---------- | ----------------------- |
| Grants List  | 5 minutes  | 15 minutes | On create/update/delete |
| Grant Detail | 10 minutes | 30 minutes | On update               |
| Compliance   | 5 minutes  | 15 minutes | On compliance update    |
| Utilization  | 5 minutes  | 15 minutes | On utilization update   |

---

## 🎭 User Experience

### User Flows

#### 1. Create Grant

1. User navigates to `/grants/create`
2. System opens grant form
3. User enters grant details (grantor, amount, conditions)
4. User submits form
5. System creates grant and shows confirmation

#### 2. Track Compliance

1. User navigates to `/grants/compliance`
2. System shows compliance requirements for all grants
3. User can mark compliance milestones as complete
4. System updates compliance status

#### 3. Track Utilization

1. User navigates to `/grants/utilization`
2. System shows grant utilization by grant
3. User can view spending vs budget
4. System shows utilization percentage

### UI States

| State          | Component          | Message                       |
| -------------- | ------------------ | ----------------------------- |
| **Empty**      | `GrantsEmptyState` | "No grants found"             |
| **Loading**    | `GrantsSkeleton`   | Loading skeleton              |
| **Error**      | `GrantsErrorState` | "Failed to load grants"       |
| **No Results** | `GrantsNoResults`  | "No grants match your search" |

---

## 🚀 Implementation Guide

### Step 1: Setup

```bash
# Create directory structure
mkdir -p apps/web/app/(dashboard)/grants
mkdir -p apps/web/components/grants
mkdir -p apps/web/hooks/grants

# Create feature flag
echo 'flags.m51_government_grants = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/grants/GrantForm.tsx
"use client";

import { Form } from "@/components/ui/form";
import { useGovernmentGrants } from "@/hooks/grants/useGovernmentGrants";

export function GrantForm({ grantId }: { grantId?: string }) {
  const { mutate: createGrant } = useGovernmentGrants();

  return (
    <Form onSubmit={(data) => createGrant(data)}>
      {/* Grant form fields */}
    </Form>
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/grants/useGovernmentGrants.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useGovernmentGrants(grantId?: string) {
  return useQuery({
    queryKey: ["grants", "government", grantId],
    queryFn: () => api.grants.getGovernmentGrants(grantId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateGrant() {
  return useMutation({
    mutationFn: (data: GrantData) => api.grants.createGrant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["grants", "government"],
      });
    },
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/grants/page.tsx
import { GrantList } from "@/components/grants/GrantList";
import { GrantFilters } from "@/components/grants/GrantFilters";

export default function GrantsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Government Grants</h1>
        <CreateGrantButton />
      </div>
      <GrantFilters />
      <GrantList />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/grants/__tests__/GrantList.test.tsx
import { render, screen } from "@testing-library/react";
import { GrantList } from "@/components/grants/GrantList";

describe("GrantList", () => {
  it("renders list of grants", () => {
    render(<GrantList />);
    expect(screen.getByRole("table")).toBeInTheDocument();
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

| Shortcut       | Action             |
| -------------- | ------------------ |
| `Ctrl/Cmd + N` | Create new grant   |
| `Ctrl/Cmd + F` | Focus search field |
| `Escape`       | Close modal/dialog |
| `Enter`        | Submit form        |

### ARIA Implementation

```typescript
// Grant table
<table role="table" aria-label="Government grants list">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" aria-sort="none">Grant</th>
      <th role="columnheader" aria-sort="none">Agency</th>
      <th role="columnheader" aria-sort="none">Amount</th>
    </tr>
  </thead>
</table>

// Form
<form role="form" aria-label="Create grant">
  <input aria-describedby="grant-error" aria-invalid="false" />
  <div id="grant-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("GrantList", () => {
  it("renders list of grants", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles search functionality", () => {});
});

// Hook tests
describe("useGovernmentGrants", () => {
  it("fetches grant data", () => {});
  it("handles pagination", () => {});
  it("handles filters", () => {});
  it("handles errors", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Government Grant API Integration", () => {
  it("creates grant successfully", () => {});
  it("updates grant successfully", () => {});
  it("tracks compliance correctly", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Government Grant E2E", () => {
  it("complete create flow", () => {});
  it("complete edit flow", () => {});
  it("compliance tracking flow", () => {});
  it("search and filter functionality", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("Government Grant Accessibility", () => {
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
const GrantCreatePage = lazy(() => import("./create/page"));

// Code splitting
const GrantForm = lazy(() => import("./components/GrantForm"));

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
  m51_government_grants: false, // Default: disabled
};

// Usage in components
if (flags.m51_government_grants) {
  return <GrantList />;
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

1. **Set feature flag**: `flags.m51_government_grants = false`
2. **Invalidate cache**: `revalidateTag('grants')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Grant tracking functional
- [ ] Compliance management functional
- [ ] Search and filtering functional
- [ ] Pagination working correctly
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

**Ready to implement Government Grant Management UI! 🚀**
// apps/web/components/grants/GrantsList.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useGrants } from "@/hooks/grants/useGrants";

export function GrantsList() {
const { data, isLoading, error } = useGrants();

if (isLoading) return <GrantsSkeleton />;
if (error) return <GrantsErrorState />;
if (!data?.length) return <GrantsEmptyState />;

return (
<DataTable
      data={data}
      columns={columns}
      searchKey="grantor"
      filters={filters}
    />
);
}

````

---

## ✅ Quality Gates

### Code Quality

| Gate              | Threshold | Enforcement |
| ----------------- | --------- | ----------- |
| TypeScript errors | 0         | CI blocks   |
| ESLint errors     | 0         | CI blocks   |
| Test coverage     | ≥90%      | CI blocks   |
| Bundle size       | ≤300KB    | CI blocks   |

---

## 🚀 Deployment

### Feature Flag

```typescript
const flags = {
  m51_government_grants: false, // Default: disabled
};
````

### Rollout Plan

| Environment | Cohort           | Success Criteria  | Duration |
| ----------- | ---------------- | ----------------- | -------- |
| Dev         | All developers   | Manual QA passes  | 1 day    |
| Staging     | QA team          | All tests pass    | 2 days   |
| Production  | Beta users (5%)  | Error rate < 0.1% | 3 days   |
| Production  | All users (100%) | Monitor for 24h   | Ongoing  |

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All grant operations working
- [ ] Compliance tracking functional
- [ ] Utilization tracking working
- [ ] Grant income recognition working
- [ ] IAS 20/ASC 958 reporting working
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

**Ready to implement Government Grant Management UI! 🚀**
