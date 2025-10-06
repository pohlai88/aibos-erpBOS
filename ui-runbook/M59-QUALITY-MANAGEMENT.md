# 🎯 M59: Quality Management - UI Implementation Runbook

**Module ID**: M59  
**Module Name**: Quality Management  
**Priority**: MEDIUM  
**Phase**: Phase 12 - Operational Modules  
**Estimated Effort**: 3 days  
**Last Updated**: 2025-10-06

**Status**: ❌ NO - CREATE NEW Module

---

## 📋 Module Overview

Quality Management provides **quality control**, **inspection management**, **non-conformance tracking**, and **corrective actions** for businesses requiring **quality assurance** and **compliance management**.

### Business Value

**Key Benefits**:

- **Quality Control**: Systematic quality inspections
- **Non-Conformance Tracking**: Track and resolve quality issues
- **Corrective Actions**: CAPA (Corrective and Preventive Actions)
- **Quality Analytics**: Quality metrics and trends

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
| **Database**  | ❌ NEW | Quality schema needed           |
| **Services**  | ❌ NEW | Quality services needed         |
| **API**       | ❌ NEW | Quality APIs needed             |
| **Contracts** | ❌ NEW | Quality type definitions needed |

### API Endpoints

**Quality Management** (New endpoints needed):

- ❌ `/api/quality/inspections` - List inspections
- ❌ `/api/quality/inspections/[id]` - Get inspection details
- ❌ `/api/quality/non-conformance` - Non-conformance records
- ❌ `/api/quality/capa` - Corrective actions
- ❌ `/api/quality/analytics` - Quality analytics

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                           | Page Component             | Purpose                 |
| ------------------------------- | -------------------------- | ----------------------- |
| `/quality/inspections`          | `InspectionsListPage`      | List inspections        |
| `/quality/inspections/[id]`     | `InspectionDetailPage`     | Inspection details      |
| `/quality/non-conformance`      | `NonConformanceListPage`   | Non-conformance records |
| `/quality/non-conformance/[id]` | `NonConformanceDetailPage` | NCR details             |
| `/quality/capa`                 | `CAPAListPage`             | Corrective actions      |
| `/quality/analytics`            | `QualityAnalyticsPage`     | Quality dashboard       |

### Component Structure

```
apps/web/app/(dashboard)/quality/
├── inspections/
│   ├── page.tsx                # Inspections list page
│   └── [id]/
│       └── page.tsx            # Inspection detail page
├── non-conformance/
│   ├── page.tsx                # NCR list page
│   └── [id]/
│       └── page.tsx            # NCR detail page
├── capa/
│   └── page.tsx                # CAPA list page
└── analytics/
    └── page.tsx                # Analytics page

apps/web/components/quality/
├── InspectionsList.tsx         # Inspections list
├── InspectionForm.tsx          # Inspection form
├── NonConformanceList.tsx      # NCR list
├── CAPAForm.tsx                # CAPA form
└── QualityAnalytics.tsx        # Analytics dashboard

apps/web/hooks/quality/
├── useInspections.ts           # Inspections hook
├── useNonConformance.ts        # NCR hook
├── useCAPA.ts                  # CAPA hook
└── useQualityAnalytics.ts      # Analytics hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages
- **Client Components**: Forms, inspection checklists, analytics charts
- **Feature Flag**: `flags.m59_quality_management = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose              | Variant                  |
| ----------- | -------------------- | ------------------------ |
| `DataTable` | List inspections     | With filters, pagination |
| `Card`      | Inspection details   | With actions             |
| `Form`      | Inspection forms     | With validation          |
| `Checklist` | Inspection checklist | With scoring             |
| `Chart`     | Quality analytics    | Line, bar, pie           |
| `Badge`     | Status indicators    | With colors              |

### Design Tokens

```typescript
// Quality specific colors
const qualityColors = {
  pass: "hsl(var(--quality-pass))",
  fail: "hsl(var(--quality-fail))",
  pending: "hsl(var(--quality-pending))",
  review: "hsl(var(--quality-review))",
};

// Inspection status colors
const inspectionStatusColors = {
  scheduled: "bg-blue-100 text-blue-800",
  inProgress: "bg-yellow-100 text-yellow-800",
  passed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};
```

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  inspections: ["quality", "inspections"] as const,
  inspectionDetail: (id: string) => ["quality", "inspection", id] as const,
  nonConformance: ["quality", "non-conformance"] as const,
  capa: ["quality", "capa"] as const,
  qualityAnalytics: ["quality", "analytics"] as const,
};
```

### Cache Configuration

| Query Type        | Stale Time | Cache Time | Invalidation            |
| ----------------- | ---------- | ---------- | ----------------------- |
| Inspections List  | 5 minutes  | 15 minutes | On create/update/delete |
| Inspection Detail | 10 minutes | 30 minutes | On update               |
| Non-Conformance   | 5 minutes  | 15 minutes | On NCR update           |
| CAPA              | 5 minutes  | 15 minutes | On CAPA update          |
| Quality Analytics | 10 minutes | 30 minutes | On data change          |

---

## 🚀 Implementation Guide

### Step 1: Create Database Schema

```sql
-- Quality tables
CREATE TABLE quality_inspections (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  inspection_number VARCHAR(50) NOT NULL,
  inspection_type VARCHAR(50) NOT NULL,
  inspector_id UUID NOT NULL,
  inspection_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  result VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE quality_non_conformance (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  ncr_number VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  assigned_to UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE quality_capa (
  id UUID PRIMARY KEY,
  ncr_id UUID REFERENCES quality_non_conformance(id),
  action_type VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Step 2: Create Components

```typescript
// apps/web/components/quality/InspectionsList.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useInspections } from "@/hooks/quality/useInspections";

export function InspectionsList() {
  const { data, isLoading, error } = useInspections();

  if (isLoading) return <InspectionsSkeleton />;
  if (error) return <InspectionsErrorState />;
  if (!data?.length) return <InspectionsEmptyState />;

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
// apps/web/hooks/quality/useInspections.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useInspections(inspectionId?: string) {
  return useQuery({
    queryKey: ["quality", "inspections", inspectionId],
    queryFn: () => api.quality.getInspections(inspectionId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateInspection() {
  return useMutation({
    mutationFn: (data: InspectionData) => api.quality.createInspection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["quality", "inspections"],
      });
    },
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/quality/page.tsx
import { InspectionsList } from "@/components/quality/InspectionsList";
import { QualityFilters } from "@/components/quality/QualityFilters";

export default function QualityPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quality Management</h1>
        <CreateInspectionButton />
      </div>
      <QualityFilters />
      <InspectionsList />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/quality/__tests__/InspectionsList.test.tsx
import { render, screen } from "@testing-library/react";
import { InspectionsList } from "@/components/quality/InspectionsList";

describe("InspectionsList", () => {
  it("renders list of inspections", () => {
    render(<InspectionsList />);
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

| Shortcut       | Action                |
| -------------- | --------------------- |
| `Ctrl/Cmd + N` | Create new inspection |
| `Ctrl/Cmd + F` | Focus search field    |
| `Escape`       | Close modal/dialog    |
| `Enter`        | Submit form           |

### ARIA Implementation

```typescript
// Inspections table
<table role="table" aria-label="Inspections list">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" aria-sort="none">Inspection</th>
      <th role="columnheader" aria-sort="none">Status</th>
      <th role="columnheader" aria-sort="none">Result</th>
    </tr>
  </thead>
</table>

// Form
<form role="form" aria-label="Create inspection">
  <input aria-describedby="inspection-error" aria-invalid="false" />
  <div id="inspection-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("InspectionsList", () => {
  it("renders list of inspections", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles search functionality", () => {});
});

// Hook tests
describe("useInspections", () => {
  it("fetches inspections data", () => {});
  it("handles pagination", () => {});
  it("handles filters", () => {});
  it("handles errors", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Quality Management API Integration", () => {
  it("creates inspection successfully", () => {});
  it("updates inspection successfully", () => {});
  it("tracks non-conformance correctly", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Quality Management E2E", () => {
  it("complete inspection flow", () => {});
  it("complete CAPA flow", () => {});
  it("non-conformance tracking flow", () => {});
  it("search and filter functionality", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("Quality Management Accessibility", () => {
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
const InspectionCreatePage = lazy(() => import("./create/page"));

// Code splitting
const InspectionForm = lazy(() => import("./components/InspectionForm"));

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
  m59_quality_management: false, // Default: disabled
};

// Usage in components
if (flags.m59_quality_management) {
  return <InspectionsList />;
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

1. **Set feature flag**: `flags.m59_quality_management = false`
2. **Invalidate cache**: `revalidateTag('quality')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Quality inspections functional
- [ ] Non-conformance tracking functional
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

**Ready to implement Quality Management UI! 🚀**

if (isLoading) return <InspectionsSkeleton />;
if (error) return <InspectionsErrorState />;
if (!data?.length) return <InspectionsEmptyState />;

return (
<DataTable
      data={data}
      columns={columns}
      searchKey="inspection_number"
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
| Bundle size       | ≤350KB    | CI blocks   |

---

## 🚀 Deployment

### Feature Flag

```typescript
const flags = {
  m59_quality_management: false, // Default: disabled
};
````

---

## 📝 Definition of Done

### Functional Requirements

- [ ] Inspection creation working
- [ ] NCR tracking functional
- [ ] CAPA management working
- [ ] Quality analytics working
- [ ] Checklist functionality working
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

**Ready to implement Quality Management! 🚀**
