# 🎯 M47: Impairment Testing & Goodwill - UI Implementation Runbook

**Module ID**: M47  
**Module Name**: Impairment Testing & Goodwill  
**Priority**: 🔥 HIGH  
**Phase**: Phase 11 - Critical Missing Modules  
**Estimated Effort**: 3 days  
**Last Updated**: 2025-10-06

**Status**: 🔄 HYBRID - Enhance M10-INTANGIBLE-ASSETS

---

## 📋 Module Overview

Impairment Testing & Goodwill provides **impairment testing** and **goodwill management** for businesses requiring **ASC 350/IAS 36 compliance**, **fair value assessments**, and **impairment loss tracking**.

### Business Value

**Key Benefits**:

- **Impairment Testing**: Perform annual and triggering event impairment tests
- **ASC 350/IAS 36 Compliance**: Automated impairment accounting compliance
- **Goodwill Management**: Track goodwill by reporting unit
- **Fair Value Assessment**: Calculate and document fair value assessments

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
| **Database**  | 🔄 PARTIAL | Basic intangible assets exist, needs testing |
| **Services**  | 🔄 PARTIAL | Asset services exist, needs impairment       |
| **API**       | 🔄 PARTIAL | Asset APIs exist, needs impairment           |
| **Contracts** | 🔄 PARTIAL | Asset types exist, needs impairment          |

### API Endpoints

**Impairment Testing** (Enhancement needed):

- 🔄 `/api/intangible-assets` - Enhance with impairment fields
- ❌ `/api/impairment/tests` - Manage impairment tests
- ❌ `/api/impairment/calculate` - Calculate impairment
- ❌ `/api/goodwill` - Manage goodwill by reporting unit
- ❌ `/api/impairment/reports` - Generate impairment reports

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                    | Page Component           | Purpose                |
| ------------------------ | ------------------------ | ---------------------- |
| `/impairment/tests`      | `ImpairmentTestsPage`    | Impairment tests       |
| `/impairment/goodwill`   | `GoodwillManagementPage` | Goodwill management    |
| `/impairment/fair-value` | `FairValuePage`          | Fair value assessments |
| `/impairment/losses`     | `ImpairmentLossesPage`   | Impairment losses      |

### Component Structure

```
apps/web/app/(dashboard)/impairment/
├── tests/
│   └── page.tsx                    # Impairment tests page
├── goodwill/
│   └── page.tsx                    # Goodwill management page
├── fair-value/
│   └── page.tsx                    # Fair value page
└── losses/
    └── page.tsx                    # Impairment losses page

apps/web/components/impairment/
├── ImpairmentTestForm.tsx          # Impairment test form
├── GoodwillByUnit.tsx              # Goodwill by reporting unit
├── FairValueCalculator.tsx         # Fair value calculator
├── ImpairmentLossList.tsx          # Impairment loss list
└── ImpairmentReports.tsx           # Impairment reports

apps/web/hooks/impairment/
├── useImpairmentTests.ts           # Impairment tests hook
├── useGoodwill.ts                  # Goodwill hook
├── useFairValue.ts                 # Fair value hook
└── useImpairmentLosses.ts          # Impairment losses hook
```

### Server/Client Boundaries

- **Server Components**: List pages, report pages
- **Client Components**: Forms, calculators, charts
- **Feature Flag**: `flags.m47_impairment_testing = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose             | Variant                    |
| ----------- | ------------------- | -------------------------- |
| `DataTable` | List tests/goodwill | With filters, pagination   |
| `Card`      | Test details        | With actions               |
| `Form`      | Test forms          | With validation            |
| `Button`    | Actions             | Primary, secondary, danger |
| `Currency`  | Amount input        | With formatting            |
| `Chart`     | Goodwill trends     | With tooltips              |
| `Badge`     | Test status         | With colors                |

### Design Tokens

```typescript
// Impairment testing specific colors
const impairmentColors = {
  goodwill: "hsl(var(--impairment-goodwill))",
  fairValue: "hsl(var(--impairment-fair-value))",
  carryingValue: "hsl(var(--impairment-carrying))",
  impaired: "hsl(var(--impairment-impaired))",
};

// Test status colors
const testStatusColors = {
  scheduled: "bg-blue-100 text-blue-800",
  inProgress: "bg-yellow-100 text-yellow-800",
  passed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  impaired: "bg-red-100 text-red-800",
};
```

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  impairmentTests: ["impairment", "tests"] as const,
  goodwill: ["impairment", "goodwill"] as const,
  fairValue: ["impairment", "fair-value"] as const,
  impairmentLosses: ["impairment", "losses"] as const,
};
```

### Cache Configuration

| Query Type        | Stale Time | Cache Time | Invalidation       |
| ----------------- | ---------- | ---------- | ------------------ |
| Impairment Tests  | 10 minutes | 30 minutes | On test completion |
| Goodwill          | 10 minutes | 30 minutes | On goodwill update |
| Fair Value        | 1 hour     | 4 hours    | On assessment      |
| Impairment Losses | 10 minutes | 30 minutes | On loss recording  |

---

## 🚀 Implementation Guide

### Step 1: Enhance M10-INTANGIBLE-ASSETS

```bash
# Enhance existing intangible assets module
# Add impairment testing fields
# Add goodwill management
# Add fair value assessment
```

### Step 2: Create Components

```typescript
// apps/web/components/impairment/ImpairmentTestForm.tsx
"use client";

import { Form } from "@/components/ui/form";
import { useImpairmentTests } from "@/hooks/impairment/useImpairmentTests";

export function ImpairmentTestForm({ assetId }: { assetId: string }) {
  const { mutate: performTest } = useImpairmentTests();

  return (
    <Form onSubmit={(data) => performTest({ assetId, ...data })}>
      {/* Impairment test form fields */}
    </Form>
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/impairment/useImpairmentTests.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useImpairmentTests(assetId?: string) {
  return useQuery({
    queryKey: ["impairment", "tests", assetId],
    queryFn: () => api.impairment.getImpairmentTests(assetId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePerformImpairmentTest() {
  return useMutation({
    mutationFn: (data: ImpairmentTestData) =>
      api.impairment.performImpairmentTest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["impairment", "tests"],
      });
    },
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/impairment/page.tsx
import { ImpairmentTestList } from "@/components/impairment/ImpairmentTestList";
import { ImpairmentTestFilters } from "@/components/impairment/ImpairmentTestFilters";

export default function ImpairmentPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Impairment Testing</h1>
        <PerformImpairmentTestButton />
      </div>
      <ImpairmentTestFilters />
      <ImpairmentTestList />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/impairment/__tests__/ImpairmentTestList.test.tsx
import { render, screen } from "@testing-library/react";
import { ImpairmentTestList } from "@/components/impairment/ImpairmentTestList";

describe("ImpairmentTestList", () => {
  it("renders list of impairment tests", () => {
    render(<ImpairmentTestList />);
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

| Shortcut       | Action                      |
| -------------- | --------------------------- |
| `Ctrl/Cmd + N` | Perform new impairment test |
| `Ctrl/Cmd + F` | Focus search field          |
| `Escape`       | Close modal/dialog          |
| `Enter`        | Submit form                 |

### ARIA Implementation

```typescript
// Impairment test table
<table role="table" aria-label="Impairment tests list">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" aria-sort="none">Asset</th>
      <th role="columnheader" aria-sort="none">Test Date</th>
      <th role="columnheader" aria-sort="none">Result</th>
    </tr>
  </thead>
</table>

// Form
<form role="form" aria-label="Perform impairment test">
  <input aria-describedby="test-error" aria-invalid="false" />
  <div id="test-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("ImpairmentTestList", () => {
  it("renders list of impairment tests", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles search functionality", () => {});
});

// Hook tests
describe("useImpairmentTests", () => {
  it("fetches impairment test data", () => {});
  it("handles pagination", () => {});
  it("handles filters", () => {});
  it("handles errors", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Impairment Testing API Integration", () => {
  it("performs impairment test successfully", () => {});
  it("updates impairment test successfully", () => {});
  it("calculates fair value correctly", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Impairment Testing E2E", () => {
  it("complete test flow", () => {});
  it("complete edit flow", () => {});
  it("fair value assessment flow", () => {});
  it("search and filter functionality", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("Impairment Testing Accessibility", () => {
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
const ImpairmentTestCreatePage = lazy(() => import("./create/page"));

// Code splitting
const ImpairmentTestForm = lazy(
  () => import("./components/ImpairmentTestForm")
);

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
  m47_impairment_testing: false, // Default: disabled
};

// Usage in components
if (flags.m47_impairment_testing) {
  return <ImpairmentTestList />;
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

1. **Set feature flag**: `flags.m47_impairment_testing = false`
2. **Invalidate cache**: `revalidateTag('impairment-tests')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Impairment testing functional
- [ ] Goodwill management functional
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

**Ready to implement Impairment Testing & Goodwill UI! 🚀**

return (
<Form onSubmit={(data) => performTest({ assetId, ...data })}>
{/_ Impairment test form fields _/}
</Form>
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
  m47_impairment_testing: false, // Default: disabled
};
````

---

## 📝 Definition of Done

### Functional Requirements

- [ ] Impairment testing working
- [ ] Goodwill management functional
- [ ] Fair value assessment working
- [ ] Impairment loss tracking working
- [ ] ASC 350/IAS 36 reporting working
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

**Ready to enhance M10-INTANGIBLE-ASSETS with Impairment Testing! 🚀**
