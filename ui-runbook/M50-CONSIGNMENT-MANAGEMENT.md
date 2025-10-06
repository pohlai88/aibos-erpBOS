# 🎯 M50: Consignment Management - UI Implementation Runbook

**Module ID**: M50  
**Module Name**: Consignment Management  
**Priority**: 🔶 MEDIUM  
**Phase**: Phase 11 - Critical Missing Modules  
**Estimated Effort**: 3.5 days  
**Last Updated**: 2025-10-06

---

## 📋 Module Overview

Consignment Management provides **consignment inventory tracking** for businesses requiring **consignee/consignor management**, **consignment sales tracking**, and **automated settlement processing**.

### Business Value

**Key Benefits**:

- **Consignment Tracking**: Complete consignment inventory lifecycle
- **Dual Perspective**: Consignor and consignee views
- **Automated Settlement**: Automatic settlement calculation and processing
- **Revenue Recognition**: Proper revenue recognition on consignment sales

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status | Details                       |
| ------------- | ------ | ----------------------------- |
| **Database**  | ❌ NO  | No consignment schema         |
| **Services**  | ❌ NO  | No consignment services       |
| **API**       | ❌ NO  | No consignment APIs           |
| **Contracts** | ❌ NO  | No consignment contract types |

### API Endpoints

**Consignment Management** (Implementation needed):

- ❌ `/api/consignment` - List consignments
- ❌ `/api/consignment/[id]` - Get consignment details
- ❌ `/api/consignment/create` - Create new consignment
- ❌ `/api/consignment/[id]/ship` - Ship consignment
- ❌ `/api/consignment/[id]/receive` - Receive consignment
- ❌ `/api/consignment/[id]/sell` - Record consignment sale
- ❌ `/api/consignment/[id]/settle` - Settle consignment
- ❌ `/api/consignment/reports` - Generate consignment reports

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                      | Page Component            | Purpose                  |
| -------------------------- | ------------------------- | ------------------------ |
| `/consignment`             | `ConsignmentListPage`     | List consignments        |
| `/consignment/[id]`        | `ConsignmentDetailPage`   | View consignment details |
| `/consignment/create`      | `ConsignmentCreatePage`   | Create new consignment   |
| `/consignment/outgoing`    | `OutgoingConsignmentPage` | Consignor view           |
| `/consignment/incoming`    | `IncomingConsignmentPage` | Consignee view           |
| `/consignment/settlements` | `SettlementsPage`         | Settlement history       |

### Component Structure

```
apps/web/app/(dashboard)/consignment/
├── page.tsx                       # Consignment list page
├── [id]/
│   └── page.tsx                   # Consignment detail page
├── create/
│   └── page.tsx                   # Create consignment page
├── outgoing/
│   └── page.tsx                   # Outgoing consignments (consignor)
├── incoming/
│   └── page.tsx                   # Incoming consignments (consignee)
└── settlements/
    └── page.tsx                   # Settlements page

apps/web/components/consignment/
├── ConsignmentList.tsx            # Consignment list component
├── ConsignmentCard.tsx            # Consignment card component
├── ConsignmentForm.tsx            # Consignment form component
├── ConsignmentShipment.tsx        # Shipment component
├── ConsignmentSales.tsx           # Sales tracking component
├── SettlementHistory.tsx          # Settlement history component
└── ConsignmentReports.tsx         # Reports component

apps/web/hooks/consignment/
├── useConsignmentList.ts          # Consignment list hook
├── useConsignmentDetail.ts        # Consignment detail hook
├── useConsignmentCreate.ts        # Create consignment hook
├── useConsignmentShip.ts          # Ship consignment hook
└── useConsignmentSettle.ts        # Settle consignment hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages (data fetching)
- **Client Components**: Forms, shipment tracking, sales recording
- **Feature Flag**: `flags.m50_consignment = false`

---

## 🎨 Design System

### Components Used

| Component    | Purpose             | Variant                    |
| ------------ | ------------------- | -------------------------- |
| `DataTable`  | List consignments   | With filters, pagination   |
| `Card`       | Consignment details | With actions               |
| `Form`       | Consignment forms   | With validation            |
| `Button`     | Actions             | Primary, secondary, danger |
| `Modal`      | Confirmations       | With backdrop              |
| `Badge`      | Status tags         | With colors                |
| `Tabs`       | Consignor/Consignee | With icons                 |
| `DatePicker` | Shipment dates      | With range                 |
| `Currency`   | Amount input        | With formatting            |

### Design Tokens

```typescript
// Consignment specific colors
const consignmentColors = {
  outgoing: "hsl(var(--consignment-outgoing))",
  incoming: "hsl(var(--consignment-incoming))",
  sold: "hsl(var(--consignment-sold))",
  settled: "hsl(var(--consignment-settled))",
};

// Consignment status colors
const consignmentStatusColors = {
  draft: "bg-gray-100 text-gray-800",
  shipped: "bg-blue-100 text-blue-800",
  received: "bg-purple-100 text-purple-800",
  sold: "bg-green-100 text-green-800",
  settled: "bg-teal-100 text-teal-800",
  returned: "bg-red-100 text-red-800",
};
```

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  consignment: {
    list: ["consignment", "list"] as const,
    detail: (id: string) => ["consignment", "detail", id] as const,
    outgoing: ["consignment", "outgoing"] as const,
    incoming: ["consignment", "incoming"] as const,
    settlements: ["consignment", "settlements"] as const,
  },
};
```

### Cache Configuration

| Query Type         | Stale Time | Cache Time | Invalidation            |
| ------------------ | ---------- | ---------- | ----------------------- |
| Consignment List   | 5 minutes  | 15 minutes | On create/update/delete |
| Consignment Detail | 10 minutes | 30 minutes | On update               |
| Settlements        | 5 minutes  | 15 minutes | On settlement           |

---

## 🎭 User Experience

### User Flows

#### 1. Create Consignment (Consignor)

1. User navigates to `/consignment/create`
2. System opens create form
3. User enters consignment details (consignee, items, terms)
4. User submits form
5. System creates consignment and generates shipment

#### 2. Receive Consignment (Consignee)

1. User navigates to `/consignment/incoming`
2. System shows incoming consignments
3. User clicks "Receive" on consignment
4. System records receipt and updates inventory

#### 3. Record Consignment Sale

1. User views consignment detail page
2. User clicks "Record Sale"
3. System shows sales form
4. User enters sale details
5. System records sale and calculates settlement

### UI States

| State          | Component               | Message                             |
| -------------- | ----------------------- | ----------------------------------- |
| **Empty**      | `ConsignmentEmptyState` | "No consignments found"             |
| **Loading**    | `ConsignmentSkeleton`   | Loading skeleton                    |
| **Error**      | `ConsignmentErrorState` | "Failed to load consignments"       |
| **No Results** | `ConsignmentNoResults`  | "No consignments match your search" |

---

## ♿ Accessibility

### WCAG 2.2 AA Compliance

- **Color Contrast**: ≥4.5:1 for normal text, ≥3:1 for large text
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Reader**: Proper ARIA labels and descriptions
- **Focus Management**: Clear focus indicators, logical tab order

### Keyboard Shortcuts

| Shortcut       | Action                 |
| -------------- | ---------------------- |
| `Ctrl/Cmd + N` | Create new consignment |
| `Ctrl/Cmd + F` | Focus search field     |
| `Escape`       | Close modal/dialog     |
| `Enter`        | Submit form            |

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("ConsignmentList", () => {
  it("renders list of consignments", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
});

// Hook tests
describe("useConsignmentList", () => {
  it("fetches consignment list", () => {});
  it("handles pagination", () => {});
  it("handles errors", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Consignment API Integration", () => {
  it("creates consignment successfully", () => {});
  it("ships consignment successfully", () => {});
  it("records sale successfully", () => {});
  it("settles consignment successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Consignment E2E", () => {
  it("complete consignment creation flow", () => {});
  it("complete shipment and receipt flow", () => {});
  it("complete sale and settlement flow", () => {});
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
mkdir -p apps/web/app/(dashboard)/consignment
mkdir -p apps/web/components/consignment
mkdir -p apps/web/hooks/consignment

# Create feature flag
echo 'flags.m50_consignment = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/consignment/ConsignmentList.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useConsignmentList } from "@/hooks/consignment/useConsignmentList";

export function ConsignmentList() {
  const { data, isLoading, error } = useConsignmentList();

  if (isLoading) return <ConsignmentSkeleton />;
  if (error) return <ConsignmentErrorState />;
  if (!data?.length) return <ConsignmentEmptyState />;

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="reference"
      filters={filters}
    />
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/consignment/useConsignmentList.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useConsignmentList(filters?: ConsignmentFilters) {
  return useQuery({
    queryKey: ["consignment", "list", filters],
    queryFn: () => api.consignment.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/consignment/page.tsx
import { ConsignmentList } from "@/components/consignment/ConsignmentList";
import { ConsignmentFilters } from "@/components/consignment/ConsignmentFilters";

export default function ConsignmentPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Consignment Management</h1>
        <CreateConsignmentButton />
      </div>
      <ConsignmentFilters />
      <ConsignmentList />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/consignment/__tests__/ConsignmentList.test.tsx
import { render, screen } from "@testing-library/react";
import { ConsignmentList } from "@/components/consignment/ConsignmentList";

describe("ConsignmentList", () => {
  it("renders list of consignments", () => {
    render(<ConsignmentList />);
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
  m50_consignment: false, // Default: disabled
};

// Usage in components
if (flags.m50_consignment) {
  return <ConsignmentList />;
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

1. **Set feature flag**: `flags.m50_consignment = false`
2. **Invalidate cache**: `revalidateTag("consignment")`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All consignment operations working
- [ ] Shipment tracking functional
- [ ] Receipt recording working
- [ ] Sales recording working
- [ ] Settlement calculation working
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

**Ready to implement Consignment Management UI! 🚀**
