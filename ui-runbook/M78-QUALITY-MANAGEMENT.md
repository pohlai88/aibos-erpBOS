# 🎯 M78: Quality Management - UI Implementation Runbook

**Module ID**: M78  
**Module Name**: Quality Management  
**Priority**: 🔶 MEDIUM  
**Phase**: Phase 15 - User Experience  
**Estimated Effort**: 4 days  
**Last Updated**: 2025-10-06

**Status**: ❌ NO - CREATE NEW Module

---

## 📋 Module Overview

### Business Value

Quality Management provides **comprehensive quality control and assurance** for businesses requiring organized quality processes and compliance tracking.

**Key Benefits**:

- Quality inspection and testing management
- Non-conformance tracking and CAPA (Corrective and Preventive Action)
- Quality metrics and analytics
- Integration with existing modules (Inventory, Manufacturing, etc.)

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
| **API**       | ✅ Complete | 18 endpoints available    |
| **Contracts** | ✅ Complete | Type-safe schemas defined |

### API Endpoints

**Quality Management Operations** (18 endpoints):

- ✅ `/api/quality/inspections` - List inspections
- ✅ `/api/quality/inspections/[id]` - Get inspection details
- ✅ `/api/quality/inspections/create` - Create inspection
- ✅ `/api/quality/inspections/[id]/update` - Update inspection
- ✅ `/api/quality/inspections/[id]/delete` - Delete inspection
- ✅ `/api/quality/inspections/[id]/complete` - Complete inspection
- ✅ `/api/quality/inspections/[id]/approve` - Approve inspection
- ✅ `/api/quality/inspections/[id]/reject` - Reject inspection
- ✅ `/api/quality/non-conformance` - List non-conformance records
- ✅ `/api/quality/non-conformance/[id]` - Get NCR details
- ✅ `/api/quality/non-conformance/[id]/create` - Create NCR
- ✅ `/api/quality/non-conformance/[id]/update` - Update NCR
- ✅ `/api/quality/non-conformance/[id]/close` - Close NCR
- ✅ `/api/quality/capa` - List CAPA records
- ✅ `/api/quality/capa/[id]` - Get CAPA details
- ✅ `/api/quality/capa/[id]/create` - Create CAPA
- ✅ `/api/quality/capa/[id]/update` - Update CAPA
- ✅ `/api/quality/analytics` - Get quality analytics
- ✅ `/api/quality/alerts` - Get quality alerts

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                             | Page Component                | Purpose                 |
| --------------------------------- | ----------------------------- | ----------------------- |
| `/quality/inspections`            | `QualityInspectionsPage`      | List inspections        |
| `/quality/inspections/[id]`       | `QualityInspectionDetailPage` | View inspection details |
| `/quality/inspections/create`     | `QualityInspectionCreatePage` | Create inspection       |
| `/quality/inspections/[id]/edit`  | `QualityInspectionEditPage`   | Edit inspection         |
| `/quality/non-conformance`        | `QualityNonConformancePage`   | List NCRs               |
| `/quality/non-conformance/[id]`   | `QualityNCRDetailPage`        | View NCR details        |
| `/quality/non-conformance/create` | `QualityNCRCreatePage`        | Create NCR              |
| `/quality/capa`                   | `QualityCAPAPage`             | List CAPA records       |
| `/quality/capa/[id]`              | `QualityCAPADetailPage`       | View CAPA details       |
| `/quality/capa/create`            | `QualityCAPACreatePage`       | Create CAPA             |
| `/quality/analytics`              | `QualityAnalyticsPage`        | Quality analytics       |
| `/quality/alerts`                 | `QualityAlertsPage`           | Quality alerts          |

### Component Structure

```
apps/web/app/(dashboard)/quality/
├── inspections/
│   ├── page.tsx               # Inspections list
│   ├── [id]/
│   │   ├── page.tsx         # Inspection details
│   │   └── edit/
│   │       └── page.tsx     # Edit inspection
│   └── create/
│       └── page.tsx         # Create inspection
├── non-conformance/
│   ├── page.tsx             # NCR list
│   ├── [id]/
│   │   └── page.tsx         # NCR details
│   └── create/
│       └── page.tsx         # Create NCR
├── capa/
│   ├── page.tsx             # CAPA list
│   ├── [id]/
│   │   └── page.tsx         # CAPA details
│   └── create/
│       └── page.tsx         # Create CAPA
├── analytics/
│   └── page.tsx             # Analytics page
└── alerts/
    └── page.tsx             # Alerts page

apps/web/components/quality/
├── QualityInspections.tsx   # Inspections component
├── QualityInspectionCard.tsx # Inspection card
├── QualityInspectionForm.tsx # Inspection form
├── QualityNonConformance.tsx # NCR component
├── QualityNCRCard.tsx        # NCR card
├── QualityNCRForm.tsx        # NCR form
├── QualityCAPA.tsx           # CAPA component
├── QualityCAPACard.tsx       # CAPA card
├── QualityCAPAForm.tsx       # CAPA form
├── QualityAnalytics.tsx     # Analytics component
├── QualityAlerts.tsx         # Alerts component
├── QualityFilters.tsx        # Filter component
└── QualityActions.tsx        # Action buttons

apps/web/hooks/quality/
├── useQualityInspections.ts  # Inspections hook
├── useQualityInspectionDetail.ts # Inspection detail hook
├── useQualityInspectionCreate.ts # Inspection create hook
├── useQualityInspectionUpdate.ts # Inspection update hook
├── useQualityNonConformance.ts # NCR hook
├── useQualityNCRCreate.ts   # NCR create hook
├── useQualityNCRUpdate.ts    # NCR update hook
├── useQualityCAPA.ts         # CAPA hook
├── useQualityCAPACreate.ts   # CAPA create hook
├── useQualityCAPAUpdate.ts   # CAPA update hook
└── useQualityAnalytics.ts   # Analytics hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages (data fetching)
- **Client Components**: Forms, interactive elements, modals
- **Feature Flag**: `flags.m78_quality_management = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose              | Variant                    |
| ----------- | -------------------- | -------------------------- |
| `DataTable` | List quality records | With filters, pagination   |
| `Card`      | Quality details      | With actions               |
| `Form`      | Create/edit forms    | With validation            |
| `Button`    | Actions              | Primary, secondary, danger |
| `Modal`     | Confirmations        | With backdrop              |
| `Timeline`  | Quality timeline     | With status indicators     |
| `Chart`     | Quality charts       | With metrics               |

### Design Tokens

```typescript
// Quality-specific colors
const qualityColors = {
  pass: "hsl(var(--quality-pass))",
  fail: "hsl(var(--quality-fail))",
  pending: "hsl(var(--quality-pending))",
  approved: "hsl(var(--quality-approved))",
  rejected: "hsl(var(--quality-rejected))",
  closed: "hsl(var(--quality-closed))",
};

// Quality status colors
const qualityStatusColors = {
  pass: "bg-green-100 text-green-800",
  fail: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  closed: "bg-gray-100 text-gray-800",
};

// Quality type colors
const qualityTypeColors = {
  inspection: "hsl(var(--quality-inspection))",
  testing: "hsl(var(--quality-testing))",
  audit: "hsl(var(--quality-audit))",
  review: "hsl(var(--quality-review))",
  verification: "hsl(var(--quality-verification))",
  validation: "hsl(var(--quality-validation))",
  other: "hsl(var(--quality-other))",
};
```

### Theme Support

- **Dark Mode**: Default theme
- **Light Mode**: Available via theme toggle
- **High Contrast**: WCAG AAA compliance
- **Quality Themes**: Status-based themes

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  inspections: ["quality", "inspections"] as const,
  inspection: (id: string) => ["quality", "inspection", id] as const,
  nonConformance: ["quality", "non-conformance"] as const,
  ncr: (id: string) => ["quality", "ncr", id] as const,
  capa: ["quality", "capa"] as const,
  capaRecord: (id: string) => ["quality", "capa", id] as const,
  analytics: ["quality", "analytics"] as const,
  alerts: ["quality", "alerts"] as const,
};
```

### Cache Configuration

| Query Type  | Stale Time | Cache Time | Invalidation            |
| ----------- | ---------- | ---------- | ----------------------- |
| Inspections | 5 minutes  | 10 minutes | On create/update/delete |
| Inspection  | 10 minutes | 30 minutes | On update/delete        |
| NCR         | 5 minutes  | 15 minutes | On create/update/close  |
| CAPA        | 5 minutes  | 15 minutes | On create/update/close  |
| Analytics   | 15 minutes | 45 minutes | On quality change       |
| Alerts      | 1 minute   | 5 minutes  | On alert update         |

### Invalidation Rules

```typescript
// After creating inspection
queryClient.invalidateQueries({ queryKey: ["quality", "inspections"] });
queryClient.invalidateQueries({ queryKey: ["quality", "analytics"] });

// After updating inspection
queryClient.invalidateQueries({ queryKey: ["quality", "inspection", id] });
queryClient.invalidateQueries({ queryKey: ["quality", "inspections"] });

// After creating NCR
queryClient.invalidateQueries({ queryKey: ["quality", "non-conformance"] });
queryClient.invalidateQueries({ queryKey: ["quality", "alerts"] });
```

---

## 🎭 User Experience

### User Flows

#### 1. Create Quality Inspection

1. User navigates to quality inspections page
2. User clicks "Create Inspection" button
3. System opens inspection creation form
4. User selects product/item to inspect
5. User defines inspection criteria
6. User assigns inspector
7. User schedules inspection
8. User submits inspection

#### 2. Complete Quality Inspection

1. User views inspection detail page
2. User clicks "Start Inspection" button
3. System updates status to "In Progress"
4. User performs inspection tasks
5. User records inspection results
6. User clicks "Complete Inspection" button
7. System updates status to "Completed"

#### 3. Create Non-Conformance Record

1. User navigates to non-conformance page
2. User clicks "Create NCR" button
3. System opens NCR creation form
4. User describes non-conformance
5. User assigns severity level
6. User assigns responsible person
7. User submits NCR

### UI States

| State          | Component           | Message                        |
| -------------- | ------------------- | ------------------------------ |
| **Empty**      | `QualityEmptyState` | "No quality records found"     |
| **Loading**    | `QualitySkeleton`   | Loading skeleton               |
| **Error**      | `QualityErrorState` | "Failed to load quality data"  |
| **No Results** | `QualityNoResults`  | "No records match your search" |

### Interactions

- **Hover**: Card elevation, button color change
- **Focus**: Clear focus ring, keyboard navigation
- **Click**: Immediate feedback, loading state
- **Form Validation**: Inline errors, real-time validation
- **Chart**: Interactive charts, drill-down capabilities

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
| `Ctrl/Cmd + C` | Complete inspection   |
| `Ctrl/Cmd + R` | Create NCR            |
| `Escape`       | Close modal/dialog    |
| `Enter`        | Submit form           |

### ARIA Implementation

```typescript
// Quality list
<table role="table" aria-label="Quality inspections list">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" aria-sort="none">Inspection ID</th>
      <th role="columnheader" aria-sort="none">Product</th>
      <th role="columnheader" aria-sort="none">Status</th>
      <th role="columnheader" aria-sort="none">Inspector</th>
    </tr>
  </thead>
</table>

// Quality form
<form role="form" aria-label="Create Quality Inspection">
  <input
    aria-describedby="product-error"
    aria-invalid="false"
    aria-label="Product"
  />
  <div id="product-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("QualityInspections", () => {
  it("renders list of inspections", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles search functionality", () => {});
});

// Hook tests
describe("useQualityInspectionCreate", () => {
  it("creates inspection successfully", () => {});
  it("handles creation errors", () => {});
  it("validates inspection data", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Quality API Integration", () => {
  it("creates inspection successfully", () => {});
  it("completes inspection successfully", () => {});
  it("creates NCR successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Quality Management E2E", () => {
  it("complete inspection creation flow", () => {});
  it("complete inspection completion flow", () => {});
  it("complete NCR creation flow", () => {});
  it("complete CAPA creation flow", () => {});
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
const QualityInspectionForm = lazy(
  () => import("./components/QualityInspectionForm")
);
const QualityAnalytics = lazy(() => import("./components/QualityAnalytics"));

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
mkdir -p apps/web/app/(dashboard)/quality
mkdir -p apps/web/components/quality
mkdir -p apps/web/hooks/quality

# Create feature flag
echo 'flags.m78_quality_management = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/quality/QualityInspections.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useQualityInspections } from "@/hooks/quality/useQualityInspections";

export function QualityInspections() {
  const { data, isLoading, error } = useQualityInspections();

  if (isLoading) return <QualitySkeleton />;
  if (error) return <QualityErrorState />;
  if (!data?.length) return <QualityEmptyState />;

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="inspectionId"
      filters={filters}
    />
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/quality/useQualityInspections.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useQualityInspections(filters?: QualityFilters) {
  return useQuery({
    queryKey: ["quality", "inspections", filters],
    queryFn: () => api.quality.inspections.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/quality/inspections/page.tsx
import { QualityInspections } from "@/components/quality/QualityInspections";
import { QualityFilters } from "@/components/quality/QualityFilters";

export default function QualityInspectionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quality Inspections</h1>
        <CreateInspectionButton />
      </div>
      <QualityFilters />
      <QualityInspections />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/quality/__tests__/QualityInspections.test.tsx
import { render, screen } from "@testing-library/react";
import { QualityInspections } from "@/components/quality/QualityInspections";

describe("QualityInspections", () => {
  it("renders list of inspections", () => {
    render(<QualityInspections />);
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
  m78_quality_management: false, // Default: disabled
};

// Usage in components
if (flags.m78_quality_management) {
  return <QualityInspections />;
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

1. **Set feature flag**: `flags.m78_quality_management = false`
2. **Invalidate cache**: `revalidateTag('quality')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Quality inspection functional
- [ ] Quality testing working
- [ ] Non-conformance tracking functional
- [ ] CAPA management working
- [ ] Quality analytics functional
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
